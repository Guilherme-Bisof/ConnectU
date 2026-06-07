import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/conversations", authMiddleware, async (req: any, res: any) => {
  const userId = req.user.id;

  try {
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

    res.json(rooms);
  } catch (error) {
    console.error("Erro ao buscar conversas:", error);
    res.status(500).json({ error: "Erro ao buscar conversas" });
  }
});

router.post("/conversations", authMiddleware, async (req: any, res: any) => {
  const { participantId } = req.body;
  const userId = req.user.id;

  try {
    let room = await prisma.room.findFirst({
      where: {
        AND: [
          { users: { some: { id: userId } } },
          { users: { some: { id: participantId } } },
        ],
      },
    });

    if (!room) {
      room = await prisma.room.create({
        data: {
          users: { connect: [{ id: userId }, { id: participantId }] },
        },
      });
    }
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: "Erro ao iniciar conversa" });
  }
});

export default router;
