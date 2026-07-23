import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { serializeNotification } from "../utils/notificationUtils.js";
import { ioInstance } from "./socketController.js";
import { getUserRoom } from "../utils/socketRooms.js";

const VALID_TYPES = ["MESSAGE", "LIKE", "COMMENT", "CONNECTION", "APPLICATION", "SYSTEM", "JOB"];

export class NotificationController {
  // Listar notificações
  async getUserNotifications(req: Request, res: Response) {
    try {
      const userId = (req as any ).user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado." });
      }

      const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
      const cursor = req.query.cursor ? String(req.query.cursor) : undefined;
      const unreadStr = req.query.unread as string | undefined;
      let unread: boolean | undefined = undefined;
      
      if (unreadStr !== undefined) {
        if (unreadStr === "true") unread = true;
        else if (unreadStr === "false") unread = false;
        else return res.status(400).json({ error: "Parâmetro 'unread' deve ser true ou false." });
      }

      const type = req.query.type as string | undefined;
      const types = req.query.types as string | undefined;
      
      let typeFilter: string[] | undefined = undefined;
      
      if (types) {
        typeFilter = types.split(",");
        for (const t of typeFilter) {
          if (!VALID_TYPES.includes(t)) {
            return res.status(400).json({ error: `Tipo inválido: ${t}` });
          }
        }
      } else if (type) {
        if (!VALID_TYPES.includes(type)) {
          return res.status(400).json({ error: `Tipo inválido: ${type}` });
        }
        typeFilter = [type];
      }

      const whereClause: any = { userId };
      if (unread === true) whereClause.read = false;
      if (unread === false) whereClause.read = true;
      
      if (typeFilter && typeFilter.length > 0) {
        whereClause.type = { in: typeFilter };
      }

      const notifications = await prisma.notification.findMany({
        where: whereClause,
        orderBy: [
          { createdAt: "desc" },
          { id: "desc" }
        ],
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        skip: cursor ? 1 : 0,
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

      let nextCursor: string | null = null;
      if (notifications.length > limit) {
        const nextItem = notifications.pop();
        nextCursor = nextItem?.id || null;
      }

      const unreadCount = await prisma.notification.count({
        where: { userId, read: false }
      });

      res.json({
        items: notifications.map(serializeNotification),
        nextCursor,
        unreadCount
      });
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
      
      if (notification.read) {
         return res.json(serializeNotification(notification));
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
      
      if (ioInstance) {
        ioInstance.to(getUserRoom(userId)).emit("notification:read", {
          notificationId: updatedNotification.id
        });
      }

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
          readAt: new Date().toISOString()
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
