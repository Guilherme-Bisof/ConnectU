import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export class ChatController {
  /**
   * Método interno para encontrar ou criar uma sala entre dois usuários.
   * REGRA DE OURO: Nunca pode existir mais de 1 sala entre 2 pessoas.
   * Se o usuário saiu da sala antes (apagou conversa), ele é reconectado.
   */
  private async findOrCreateRoom(userIdA: string, userIdB: string, context: "SOCIAL" | "PROFESSIONAL" = "SOCIAL", jobId?: string) {
    // 1. Procura QUALQUER sala que contenha ambos os usuários (independente do contexto)
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

    // 2. Talvez o usuário A tenha saído da sala (apagou conversa) mas a sala ainda existe com B
    //    Nesse caso, reconecta o usuário A à sala existente
    const roomWithOnlyB = await prisma.room.findFirst({
      where: {
        users: { some: { id: userIdB } },
        // Verifica se esse Room já teve o userIdA antes (existem mensagens dele)
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

    // 3. Nenhuma sala existente: cria uma nova
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
        },
        orderBy: { createdAt: "desc" },
      });

      return res.json(rooms);
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

      // Camada de Segurança Corporativa: Verifica se o usuário logado pertence à sala que ele quer ler
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
