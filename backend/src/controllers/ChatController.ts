import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export class ChatController {
  async createRoom(req: Request, res: Response) {
    try {
      const { participantId } = req.body;
      const userId = (req as any).user?.id;

      if (!participantId) {
        return res
          .status(400)
          .json({ error: "ID do participante é obrigatório." });
      }

      // Evita que o usuário crie uma sala com ele mesmo
      if (participantId === userId) {
        return res
          .status(400)
          .json({ error: "Você não pode iniciar um chat consigo mesmo." });
      }

      let room = await prisma.room.findFirst({
        where: {
          AND: [
            { users: { some: { id: userId } } },
            { users: { some: { id: participantId } } },
          ],
        },
        include: { users: true },
      });

      if (!room) {
        room = await prisma.room.create({
          data: {
            context: "SOCIAL",
            users: {
              connect: [{ id: userId }, { id: participantId }],
            },
          },
          include: { users: true },
        });
      }

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

      let room = await prisma.room.findFirst({
        where: {
          context: "PROFESSIONAL",
          jobId: String(jobId),
          AND: [
            { users: { some: { id: recruiterId } } },
            { users: { some: { id: studentId } } },
          ],
        },
        include: { users: true },
      });

      if (!room) {
        room = await prisma.room.create({
          data: {
            context: "PROFESSIONAL",
            jobId: String(jobId),
            users: {
              connect: [{ id: recruiterId }, { id: studentId }],
            },
          },
          include: { users: true },
        });
      }

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
