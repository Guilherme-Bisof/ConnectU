import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { ioInstance } from "./socketController.js";
import { getUserRoom } from "../utils/socketRooms.js";

export async function calculateTotalUnread(userId: string) {
  const userRooms = await prisma.room.findMany({
      where: { users: { some: { id: userId } } },
      select: { 
        id: true, 
        // @ts-ignore (desativado até prisma generate rodar offline)
        readStates: { where: { userId }, select: { lastReadAt: true } }
      }
    });

    if (userRooms.length === 0) return { totalUnread: 0, byRoom: {} };

    const orConditions = userRooms.map(room => {
      const rs = room.readStates[0];
      if (!rs || !rs.lastReadAt) {
        return { roomId: room.id }; // Conta todas (já que o backfill lidou com o passado, sem read state = nova)
      }
      return {
        roomId: room.id,
        createdAt: { gt: rs.lastReadAt }
      };
    });

    const unreadCounts = await prisma.message.groupBy({
      by: ['roomId'],
      where: {
        senderId: { not: userId },
        OR: orConditions
      },
      _count: { id: true }
    });

    let totalUnread = 0;
    const byRoom: Record<string, number> = {};

    for (const count of unreadCounts) {
      byRoom[count.roomId] = count._count.id;
      totalUnread += count._count.id;
    }

    return { totalUnread, byRoom };
  }

export class ChatController {

  async getUnreadSummary(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ error: "Acesso negado." });
      
      const summary = await calculateTotalUnread(userId);
      return res.json(summary);
    } catch (error) {
      console.error("Erro ao gerar resumo de não lidas:", error);
      return res.status(500).json({ error: "Erro ao buscar resumo." });
    }
  }

  async markRoomAsRead(req: Request, res: Response) {
    try {
      const roomId = req.params.roomId as string;
      const userId = (req as any).user?.id;

      if (!roomId) return res.status(400).json({ error: "RoomId obrigatório." });

      const roomAccess = await prisma.room.findFirst({
        where: { id: roomId, users: { some: { id: userId } } }
      });

      if (!roomAccess) {
        return res.status(403).json({ error: "Acesso negado à sala." });
      }

      const lastMessage = await prisma.message.findFirst({
        where: { roomId: roomId },
        orderBy: { createdAt: "desc" }
      });

      if (!lastMessage) {
        const summary = await calculateTotalUnread(userId);
        return res.json({ roomId, unreadCount: 0, totalUnread: summary.totalUnread });
      }

      await prisma.$transaction(async (tx) => {
        // @ts-ignore (desativado até prisma generate rodar offline)
        await tx.roomReadState.upsert({
          where: {
            roomId_userId: { roomId, userId }
          },
          update: {
            lastReadAt: lastMessage.createdAt,
            lastReadMessageId: lastMessage.id
          },
          create: {
            roomId,
            userId,
            lastReadAt: lastMessage.createdAt,
            lastReadMessageId: lastMessage.id
          }
        });

        await tx.notification.updateMany({
          where: {
            userId,
            type: "MESSAGE",
            read: false,
            resourceUrl: `/dashboard/chat/${roomId}`
          },
          data: { read: true }
        });
      });

      const updatedSummary = await calculateTotalUnread(userId);

      if (ioInstance) {
        const personalRoom = getUserRoom(userId);
        const connectedSockets = await ioInstance.in(personalRoom).fetchSockets();

        ioInstance.to(personalRoom).emit("chat:room-read", {
          roomId,
          unreadCount: 0,
          totalUnread: updatedSummary.totalUnread
        });
        
        ioInstance.to(personalRoom).emit("notifications:room-read", {
          roomId,
          resourceUrl: `/dashboard/chat/${roomId}`
        });
      }

      return res.json({ roomId, unreadCount: 0, totalUnread: updatedSummary.totalUnread });
    } catch (error) {
      console.error("Erro ao marcar sala como lida:", error);
      return res.status(500).json({ error: "Erro interno no servidor." });
    }
  }
  /**
   * Método interno para encontrar ou criar uma sala entre dois usuários.
   * REGRA DE OURO: Nunca pode existir mais de 1 sala entre 2 pessoas.
   * Se o usuário saiu da sala antes (apagou conversa), ele é reconectado.
   */
  private async findOrCreateRoom(userIdA: string, userIdB: string, context: "SOCIAL" | "PROFESSIONAL" = "SOCIAL", jobId?: string) {
    // Procura QUALQUER sala que contenha ambos os usuários (independente do contexto)
    let room = await prisma.room.findFirst({
      where: {
        AND: [
          { users: { some: { id: userIdA } } },
          { users: { some: { id: userIdB } } },
        ],
      },
      include: { users: true },
    });

    if (room) return room;

    // Talvez o usuário tenha saído da sala (apagou conversa) mas a sala ainda existe com B
    //Nesse caso, reconecta o usuário à sala existente
    const roomWithOnlyB = await prisma.room.findFirst({
      where: {
        users: { some: { id: userIdB } },
        // Verifica se esse Room já teve o userId antes (existem mensagens dele)
      },
      include: { 
        users: true,
        messages: { where: { senderId: userIdA }, take: 1 }
      },
    });

    if (roomWithOnlyB && roomWithOnlyB.messages.length > 0) {
      // Reconecta o usuário que saiu
      room = await prisma.room.update({
        where: { id: roomWithOnlyB.id },
        data: { users: { connect: { id: userIdA } } },
        include: { users: true },
      });
      return room;
    }

    // Também verifica o inverso (B saiu, A ainda está)
    const roomWithOnlyA = await prisma.room.findFirst({
      where: {
        users: { some: { id: userIdA } },
      },
      include: { 
        users: true,
        messages: { where: { senderId: userIdB }, take: 1 }
      },
    });

    if (roomWithOnlyA && roomWithOnlyA.messages.length > 0) {
      room = await prisma.room.update({
        where: { id: roomWithOnlyA.id },
        data: { users: { connect: { id: userIdB } } },
        include: { users: true },
      });
      return room;
    }

    // Nenhuma sala existente: cria uma nova
    room = await prisma.room.create({
      data: {
        context,
        jobId: jobId ? String(jobId) : null,
        users: {
          connect: [{ id: userIdA }, { id: userIdB }],
        },
      },
      include: { users: true },
    });

    return room;
  }

  async createRoom(req: Request, res: Response) {
    try {
      const { participantId } = req.body;
      const userId = (req as any).user?.id;

      if (!participantId) {
        return res
          .status(400)
          .json({ error: "ID do participante é obrigatório." });
      }

      if (participantId === userId) {
        return res
          .status(400)
          .json({ error: "Você não pode iniciar um chat consigo mesmo." });
      }

      const room = await this.findOrCreateRoom(userId, participantId, "SOCIAL");
      return res.json(room);
    } catch (error) {
      console.error("Erro ao iniciar conversa:", error);
      return res
        .status(500)
        .json({ error: "Erro interno ao iniciar conversa." });
    }
  }

  async createProfessionalRoom(req: Request, res: Response) {
    try {
      const { jobId, studentId } = req.body;
      const recruiterId = (req as any).user?.id;

      if (!jobId || !studentId) {
        return res.status(400).json({ error: "Faltam parâmetros obrigatórios." });
      }

      if (studentId === recruiterId) {
        return res.status(400).json({ error: "Você não pode iniciar um chat consigo mesmo." });
      }

      // Usa a mesma lógica: se já existe uma sala com essa pessoa, reutiliza
      const room = await this.findOrCreateRoom(recruiterId, studentId, "PROFESSIONAL", jobId);
      return res.json(room);
    } catch (error) {
      console.error("Erro ao iniciar chat profissional:", error);
      return res.status(500).json({ error: "Erro interno ao iniciar chat." });
    }
  }

  async getRooms(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      const rooms = await prisma.room.findMany({
        where: {
          users: { some: { id: userId } },
        },
        include: {
          users: {
            where: { id: { not: userId } },
            select: { id: true, name: true, avatarUrl: true, role: true },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          // @ts-ignore (desativado até prisma generate rodar offline)
          readStates: { where: { userId } },
        },
        orderBy: { createdAt: "desc" },
      });

      const summary = await calculateTotalUnread(userId);
      const mappedRooms = rooms.map(r => ({
        ...r,
        unreadCount: summary.byRoom[r.id] || 0
      }));

      return res.json(mappedRooms);
    } catch (error) {
      console.error("Erro ao listar conversas:", error);
      return res.status(500).json({ error: "Erro ao buscar conversas." });
    }
  }

  async getRoomMessages(req: Request, res: Response) {
    try {
      const { roomId } = req.params;
      const userId = (req as any).user?.id;

      if (!roomId || typeof roomId !== "string") {
        return res.status(400).json({ error: "ID da sala inválido." });
      }

      //  Verifica se o usuário logado pertence à sala que ele quer ler
      const roomAccess = await prisma.room.findFirst({
        where: {
          id: roomId,
          users: { some: { id: userId } },
        },
      });

      if (!roomAccess) {
        return res.status(403).json({
          error: "Acesso negado. Você não pertence a esta sala de chat.",
        });
      }

      const messages = await prisma.message.findMany({
        where: { roomId: roomId },
        orderBy: { createdAt: "asc" },
      });

      return res.json(messages);
    } catch (error) {
      console.error("Erro ao buscar histórico de mensagens:", error);
      return res.status(500).json({ error: "Erro ao buscar histórico." });
    }
  }

  async uploadImage(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nenhuma imagem foi enviada." });
      }
      
      const file = req.file as any;
      const imageUrl = file.path; 

      return res.json({ url: imageUrl });
    } catch (error) {
      console.error("Erro ao fazer upload da imagem do chat:", error);
      return res.status(500).json({ error: "Erro interno no upload de imagem." });
    }
  }
}
