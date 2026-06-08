import { Router } from "express";
import { ChatController } from "../controllers/ChatController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const chatRoutes = Router();
const chatController = new ChatController();

chatRoutes.post("/conversations", authMiddleware, (req, res) =>
  chatController.createRoom(req, res),
);
chatRoutes.get("/conversations", authMiddleware, (req, res) =>
  chatController.getRooms(req, res),
);
chatRoutes.get("/conversations/:roomId/messages", authMiddleware, (req, res) =>
  chatController.getRoomMessages(req, res),
);

export { chatRoutes }
