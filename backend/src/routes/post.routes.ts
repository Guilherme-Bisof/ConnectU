import { Router } from "express";
import { PostController } from "../controllers/PostController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const postRoutes = Router();
const postController = new PostController();

postRoutes.post("/", authMiddleware, postController.create);
postRoutes.get("/", authMiddleware, postController.listFeed);

postRoutes.post("/:postId/like", authMiddleware, postController.toggleLike);
postRoutes.post("/:postId/comment", authMiddleware, postController.comment);
postRoutes.delete("/comment/:commentId", authMiddleware, postController.deleteComment, );

postRoutes.delete("/:id", authMiddleware, postController.delete);

export { postRoutes };
