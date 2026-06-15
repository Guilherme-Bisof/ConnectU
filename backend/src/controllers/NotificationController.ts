import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

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
      });

      res.json(notifications);
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
      });

      res.json(updatedNotification);
    } catch (error) {
      console.error("Erro ao atualizar notificação:", error);
      res.status(500).json({ error: "Erro interno ao atualizar notificação." });
    }
  }

  async markAllAsRead(req: Request, res: Response){
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Usuário não encontrado."});
      }

      await prisma.notification.updateMany({
        where: {
          userId: userId,
          read: false
        },
        data: { read: true},
      });

      res.json({message: "Todas as notificações foram marcadas como lidas."});
    } catch(error){
      console.error("Erro ao marcar todas como lidas:", error);
      res.status(500).json({ error: "Erro interno ao atualizar notificações. "});
    }
  }
}
