import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { serializeNotification } from "../utils/notificationUtils.js";
import { ioInstance } from "./socketController.js";
import { getUserRoom } from "../utils/socketRooms.js";

export class NotificationController {
  // Listar notificações
  async getUserNotifications(req: Request, res: Response) {
    try {
      const userId = (req as any ).user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado." });
      }

      const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 30,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      });

      res.json(notifications.map(serializeNotification));
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
      res.status(500).json({ error: "Erro interno ao buscar notificações." });
    }
  }

  async markAsRead(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Usuário não encontrado." });
      }

      const notification = await prisma.notification.findUnique({
        where: { id: String(id) },
      });

      if (!notification || notification.userId !== userId) {
        return res.status(404).json({ error: "Notificação não encontrada." });
      }

      const updatedNotification = await prisma.notification.update({
        where: { id: String(id) },
        data: { read: true },
        include: {
          sender: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      });

      res.json(serializeNotification(updatedNotification));
    } catch (error) {
      console.error("Erro ao atualizar notificação:", error);
      res.status(500).json({ error: "Erro interno ao atualizar notificação." });
    }
  }

  async markAllAsRead(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado." });
      }

      const result = await prisma.notification.updateMany({
        where: {
          userId,
          read: false,
        },
        data: {
          read: true,
        },
      });

      if (ioInstance) {
        ioInstance.to(getUserRoom(userId)).emit("notifications:all-read", {
          updatedCount: result.count,
        });
      }

      return res.status(200).json({
        message: "Todas as notificações foram marcadas como lidas.",
        updatedCount: result.count,
      });
    } catch (error) {
      console.error("[Notifications Read All Error]", {
        userId: (req as any).user?.id,
        error,
      });
      return res.status(500).json({
        error: "Erro interno ao atualizar notificações.",
      });
    }
  }
}
