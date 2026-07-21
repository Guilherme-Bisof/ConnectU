import { Router } from "express";
import { ChatController } from "../controllers/ChatController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { uploadChatImage } from "../middlewares/uploadMiddleware.js";

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
chatRoutes.post("/rooms/professional", authMiddleware, (req, res) =>
  chatController.createProfessionalRoom(req, res),
);
chatRoutes.post("/conversations/upload-image", authMiddleware, uploadChatImage.single('file'), (req, res) =>
  chatController.uploadImage(req, res),
);

chatRoutes.get("/chat/unread-summary", authMiddleware, (req, res) =>
  chatController.getUnreadSummary(req, res),
);
chatRoutes.put("/chat/rooms/:roomId/read", authMiddleware, (req, res) =>
  chatController.markRoomAsRead(req, res),
);

export { chatRoutes }
