import { Router } from "express";
import { NotificationController } from "../controllers/NotificationController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const notificationRoutes = Router();
const notificationController = new NotificationController();

notificationRoutes.get(
  "/",
  authMiddleware,
  notificationController.getUserNotifications,
);

notificationRoutes.patch("/:id/read", authMiddleware, notificationController.markAsRead);

export { notificationRoutes };