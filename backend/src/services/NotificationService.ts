import { prisma } from "../lib/prisma.js";
import { ioInstance } from "../controllers/socketController.js";
import { getUserRoom } from "../utils/socketRooms.js";
import { serializeNotification } from "../utils/notificationUtils.js";

interface CreateNotificationInput {
    userId: string;
    senderId?: string;
    type: "LIKE" | "COMMENT" | "MESSAGE" | "SYSTEM";
    title: string;
    content: string;
    postId?: string;
}

export class NotificationService {
    static async create ({ userId, senderId, type, title, content, postId}: CreateNotificationInput) {
        try {

            if (senderId && senderId === userId){
                return null;
            }

            const rawNotification = await prisma.notification.create({
              data: {
                userId,
                senderId: senderId ?? null, 
                type,
                title,
                content,
                postId: postId ?? null,
              },
              include: {
                sender: {
                  select: { id: true, name: true, avatarUrl: true }
                }
              }
            });

            const notification = serializeNotification(rawNotification);

            if (ioInstance) {
                ioInstance.to(getUserRoom(userId)).emit("notification:received", notification);
            }

            return notification;
        } catch (error) {
            console.error("Erro ao criar notificação no Service:", error);
            throw new Error("Não foi possível gerar a notificação.");
        }
    }
}
