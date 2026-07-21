import { Server, Socket } from "socket.io";
import { prisma } from "../lib/prisma.js";
import { serializeNotification } from "../utils/notificationUtils.js";
import { calculateTotalUnread } from "./ChatController.js";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../middlewares/authMiddleware.js";

export let ioInstance: Server;

// userId -> count of active sockets
const onlineUsers = new Map<string, number>();

export const registerSocketEvents = (io: Server) => {

  ioInstance = io;

  io.use((socket, next) => {
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
      const decoded = jwt.verify(cleanToken, JWT_SECRET);
      (socket as any).user = decoded; 
      next();
    } catch (err) {
      return next(
        new Error("Sua sessão expirou ou o token do Socket é inválido."),
      );
    }
  });

  io.on("connection", (socket: Socket) => {
    const authUser = (socket as any).user;
    console.log(
      `Usuário autenticado conectado ao Socket: ${authUser.name} (${socket.id})`,
    );

    const currentCount = onlineUsers.get(authUser.id) || 0;
    if (currentCount === 0) {
      // Notifica todos que este usuário ficou online
      io.emit("user_status_change", { userId: authUser.id, status: "online" });
    }
    onlineUsers.set(authUser.id, currentCount + 1);

    socket.join(authUser.id);
    
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
      console.log(
        `Usuário ${authUser.name} entrou com segurança na sala: ${roomId}`,
      );
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

          const savedMessage = await prisma.message.create({
            data: {
              content: content || null,
              imageUrl: imageUrl || null,
              roomId,
              senderId,
            },
          });

          io.to(roomId).emit("receive_message", savedMessage);

          // Criar notificação para os outros membros da sala
          const room = await prisma.room.findUnique({
            where: { id: roomId },
            include: { users: true }
          });
          
          if (room) {
            // Busca o nome real do remetente
            const realSender = await prisma.user.findUnique({ where: { id: senderId } });
            const senderName = realSender?.name || "Usuário";

            const otherUsers = room.users.filter((u: any) => u.id !== senderId);
            for (const user of otherUsers) {
              // Verifica se a sala está silenciada para este usuário
              const isMuted = user.mutedRooms && user.mutedRooms.includes(roomId);
              
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
                io.to(user.id).emit("notification:received", payload);
              }
              
              // Emite a atualização de contagem de Unread para o destinatário, mesmo que mudo para push (ele vê o badge atualizado)
              const summary = await calculateTotalUnread(user.id);
              
              console.log("[Unread Emit]", {
                recipientUserId: user.id,
                roomId: roomId,
                messageId: savedMessage.id,
                unreadCount: summary.byRoom[roomId] || 0,
                totalUnread: summary.totalUnread
              });

              io.to(user.id).emit("chat:unread-updated", {
                roomId: roomId,
                messageId: savedMessage.id,
                unreadCount: summary.byRoom[roomId] || 0,
                totalUnread: summary.totalUnread
              });
            }
          }
        } catch (error) {
          console.error("Erro ao salvar e transmitir mensagem:", error);
        }
      },
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
          ? user.mutedRooms.filter(id => id !== roomId)
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
      console.log(`Usuário desconectado do Socket: ${authUser.name}`);
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
