import { Server, Socket } from "socket.io";
import { prisma } from "../lib/prisma.js";
import { serializeNotification } from "../utils/notificationUtils.js";
import { calculateTotalUnread } from "./ChatController.js";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../middlewares/authMiddleware.js";
import { getUserRoom } from "../utils/socketRooms.js";

interface SocketJwtPayload extends jwt.JwtPayload {
  id?: string;
  userId?: string;
  name?: string;
  email?: string;
}

interface SocketUser {
  id: string;
  name: string;
}

export let ioInstance: Server;

// userId -> count of active sockets
const onlineUsers = new Map<string, number>();

export const registerSocketEvents = (io: Server) => {

  ioInstance = io;

  io.use((socket: any, next: any) => {
    const token =
      socket.handshake.auth.token || socket.handshake.headers["authorization"];

    if (!token) {
      return next(
        new Error(
          "Acesso negado. Token de autenticação não fornecido no Socket.",
        ),
      );
    }

    try {
      const cleanToken = token.startsWith("Bearer ")
        ? token.split(" ")[1]
        : token;
      const decoded = jwt.verify(cleanToken, JWT_SECRET) as SocketJwtPayload;
      const userId = decoded.id ?? decoded.userId ?? decoded.sub;

      if (!userId) {
        return next(new Error("Token do Socket não contém um usuário válido."));
      }

      socket.data.user = {
        id: String(userId),
        name: decoded.name ?? decoded.email ?? "Usuário",
      } satisfies SocketUser;
      next();
    } catch (err) {
      return next(
        new Error("Sua sessão expirou ou o token do Socket é inválido."),
      );
    }
  });

  io.on("connection", async (socket: Socket) => {
    const authUser = socket.data.user as SocketUser;

    const currentCount = onlineUsers.get(authUser.id) || 0;
    if (currentCount === 0) {
      // Notifica todos que este usuário ficou online
      io.emit("user_status_change", { userId: authUser.id, status: "online" });
    }
    onlineUsers.set(authUser.id, currentCount + 1);

    const personalRoom = getUserRoom(authUser.id);
    await socket.join(personalRoom);

    // Sincronização após reconexão
    try {
      // @ts-ignore (cache da IDE não reconhece a migration ainda)
      const pendingReceipts = await prisma.messageReceipt.findMany({
        where: { userId: authUser.id, deliveredAt: null },
        include: { message: true }
      });
      if (pendingReceipts.length > 0) {
        const now = new Date();
        // @ts-ignore
        await prisma.messageReceipt.updateMany({
          where: { userId: authUser.id, deliveredAt: null },
          data: { deliveredAt: now }
        });
        
        const bySender = pendingReceipts.reduce((acc: Record<string, string[]>, r: any) => {
          const senderId = r.message.senderId;
          if (!acc[senderId]) {
            acc[senderId] = [];
          }
          acc[senderId].push(r.messageId);
          return acc;
        }, {} as Record<string, string[]>);
        
        for (const senderId of Object.keys(bySender)) {
          for (const msgId of (bySender[senderId] || [])) {
            io.to(getUserRoom(senderId)).emit("message:receipt-updated", {
              messageId: msgId,
              userId: authUser.id,
              deliveredAt: now,
              readAt: null
            });
          }
        }
      }
    } catch (err) {
      console.error("Erro sincronizando receipts pendentes:", err);
    }
    
    // Quando entra, pede a lista de quem já tá online
    socket.on("request_online_users", () => {
      const usersArray = Array.from(onlineUsers.keys());
      socket.emit("online_users_list", usersArray);
    });
    
    socket.on("join_room", async (roomId: string) => {
      const hasAccess = await prisma.room.findFirst({
        where: {
          id: roomId,
          users: { some: { id: authUser.id } },
        },
      });

      if (!hasAccess) {
        console.warn(
          `Tentativa de invasão detectada: Socket ${socket.id} tentou acessar a sala ${roomId}`,
        );
        return;
      }

      socket.join(roomId);
    });

    socket.on("message:delivered", async ({ messageId, roomId }) => {
      try {
        // @ts-ignore
        const receipt = await prisma.messageReceipt.findUnique({
          where: { messageId_userId: { messageId, userId: authUser.id } },
          include: { message: true }
        });

        if (!receipt || receipt.message.roomId !== roomId) return;
        if (receipt.deliveredAt) return; // Idempotente

        // @ts-ignore
        const updated = await prisma.messageReceipt.update({
          where: { id: receipt.id },
          data: { deliveredAt: new Date() }
        });

        io.to(getUserRoom(receipt.message.senderId)).emit("message:receipt-updated", {
          messageId,
          userId: authUser.id,
          deliveredAt: updated.deliveredAt,
          readAt: updated.readAt
        });
      } catch (error) {
        console.error("Erro no message:delivered", error);
      }
    });

    socket.on(
      "send_message",
      async (data: { roomId: string; content?: string; imageUrl?: string }) => {
        const { roomId, content, imageUrl } = data;
        const senderId = authUser.id; 

        if ((!content || content.trim() === "") && !imageUrl) return;

        try {
         
          const belongsToRoom = await prisma.room.findFirst({
            where: {
              id: roomId,
              users: { some: { id: senderId } },
            },
          });

          if (!belongsToRoom) return;

          const room = await prisma.room.findUnique({
            where: { id: roomId },
            include: { users: true }
          });
          
          if (!room) return;

          const otherUsers = room.users.filter((u: any) => u.id !== senderId);

          const { savedMessage, unarchiveResults } = await prisma.$transaction(async (tx: any) => {
            const msg = await tx.message.create({
              data: {
                content: content || null,
                imageUrl: imageUrl || null,
                roomId,
                senderId,
              },
            });

            const receiptsData = otherUsers.map((u: any) => ({
              messageId: msg.id,
              userId: u.id,
              deliveredAt: null,
              readAt: null
            }));

            if (receiptsData.length > 0) {
              // @ts-ignore
              await tx.messageReceipt.createMany({
                data: receiptsData
              });
            }

            const unarchiveResults: Record<string, { unarchived: boolean, pref: any }> = {};
            
            for (const user of room.users) {
               const pref = await tx.roomPreference.findUnique({
                 where: { roomId_userId: { roomId, userId: user.id } }
               });
               
               if (pref?.isArchived) {
                 const unarchiveResult = await tx.roomPreference.updateMany({
                   where: { roomId, userId: user.id, isArchived: true },
                   data: { isArchived: false, archivedAt: null }
                 });

                 unarchiveResults[user.id] = { unarchived: unarchiveResult.count > 0, pref };
               } else {
                 unarchiveResults[user.id] = { unarchived: false, pref };
               }
            }

            return { savedMessage: msg, unarchiveResults };
          });

          io.to(roomId).emit("receive_message", savedMessage);
          
          // Emitir auto-desarquivamento para quem precisou (remetente ou destinatário)
          for (const user of room.users) {
            const result = unarchiveResults[user.id];
            if (result?.unarchived) {
              io.to(getUserRoom(user.id)).emit("chat:preference-updated", {
                roomId,
                preference: {
                  isArchived: false,
                  archivedAt: null,
                  isMuted: result.pref?.isMuted || false,
                  detailsPanelCollapsed: result.pref?.detailsPanelCollapsed ?? false,
                },
                reason: "new-message"
              });
            }
          }
          
          for (const user of otherUsers) {
            io.to(getUserRoom(user.id)).emit("message:delivery-request", {
              messageId: savedMessage.id,
              roomId
            });
          }

          // Busca o nome real do remetente
          const realSender = await prisma.user.findUnique({ where: { id: senderId } });
          const senderName = realSender?.name || "Usuário";

          for (const user of otherUsers) {
              const recipientRoom = getUserRoom(user.id);
              const result = unarchiveResults[user.id];
              const pref = result?.pref;
              const isMuted = pref?.isMuted || false;
              
              if (!isMuted) {
                const notification = await prisma.notification.create({
                  data: {
                    userId: user.id,
                    senderId: senderId,
                    type: "MESSAGE",
                    title: `${senderName} enviou uma nova mensagem`,
                    content: content ? content.substring(0, 50) + (content.length > 50 ? "..." : "") : "Enviou uma imagem",
                    metadata: { roomId, messageId: savedMessage.id },
                    resourceUrl: `/dashboard/chat/${roomId}`,
                  },
                  include: {
                    sender: {
                      select: { id: true, name: true, avatarUrl: true },
                    },
                  },
                });

                const payload = serializeNotification(notification);
                io.to(recipientRoom).emit("notification:received", payload);
              }
              
              // Emite a atualização de contagem de Unread para o destinatário, mesmo que mudo para push (ele vê o badge atualizado)
              const summary = await calculateTotalUnread(user.id);
              
              io.to(recipientRoom).emit("chat:unread-updated", {
                roomId: roomId,
                messageId: savedMessage.id,
                unreadCount: summary.byRoom[roomId] || 0,
                totalUnread: summary.totalUnread
              });
            }
        } catch (error) {
          console.error("Erro ao salvar e transmitir mensagem:", error);
        }
      }
    );

    socket.on("edit_message", async (data: { messageId: string, newContent: string, roomId: string }) => {
      try {
        const msg = await prisma.message.findUnique({ where: { id: data.messageId } });
        if (!msg || msg.senderId !== authUser.id) return;
        
        const updated = await prisma.message.update({
          where: { id: data.messageId },
          data: { content: data.newContent, isEdited: true }
        });
        
        io.to(data.roomId).emit("message_edited", updated);
      } catch (error) {
        console.error("Erro ao editar mensagem:", error);
      }
    });

    socket.on("delete_message", async (data: { messageId: string, roomId: string }) => {
      try {
        const msg = await prisma.message.findUnique({ where: { id: data.messageId } });
        if (!msg || msg.senderId !== authUser.id) return;
        
        await prisma.message.delete({ where: { id: data.messageId } });
        io.to(data.roomId).emit("message_deleted", { messageId: data.messageId, roomId: data.roomId });
      } catch (error) {
        console.error("Erro ao deletar mensagem:", error);
      }
    });

    socket.on("delete_room", async (roomId: string) => {
      try {
        // Verifica se usuário pertence a sala
        const room = await prisma.room.findFirst({
          where: { id: roomId, users: { some: { id: authUser.id } } },
          include: { users: true }
        });
        if (!room) return;

        // Remove APENAS este usuário da sala (não apaga para o outro)
        await prisma.room.update({
          where: { id: roomId },
          data: {
            users: { disconnect: { id: authUser.id } }
          }
        });

        // Notifica apenas o socket deste usuário que a sala foi removida da lista dele
        socket.emit("room_deleted", roomId);

        // Se não sobrou ninguém na sala, aí sim apaga tudo
        const remainingUsers = room.users.filter((u: any) => u.id !== authUser.id);
        if (remainingUsers.length === 0) {
          await prisma.message.deleteMany({ where: { roomId } });
          await prisma.room.delete({ where: { id: roomId } });
        }
      } catch (error) {
        console.error("Erro ao deletar sala:", error);
      }
    });

    socket.on("toggle_mute_room", async (roomId: string) => {
      try {
        const user = await prisma.user.findUnique({ where: { id: authUser.id } });
        if (!user) return;
        
        const isMuted = user.mutedRooms.includes(roomId);
        const updatedMutedRooms = isMuted
          ? user.mutedRooms.filter((id: any) => id !== roomId)
          : [...user.mutedRooms, roomId];

        await prisma.user.update({
          where: { id: authUser.id },
          data: { mutedRooms: updatedMutedRooms }
        });

        socket.emit("mute_room_toggled", { roomId, isMuted: !isMuted });
      } catch (error) {
        console.error("Erro ao mutar sala:", error);
      }
    });

    socket.on("disconnect", () => {
      const currentCount = onlineUsers.get(authUser.id) || 0;
      if (currentCount <= 1) {
        onlineUsers.delete(authUser.id);
        io.emit("user_status_change", { userId: authUser.id, status: "offline" });
      } else {
        onlineUsers.set(authUser.id, currentCount - 1);
      }
    });
  });
};
