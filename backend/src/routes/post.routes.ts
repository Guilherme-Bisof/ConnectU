import { Router } from "express";
import { PostController } from "../controllers/PostController.js";

const postRoutes = Router();
const postController = new PostController();

postRoutes.post("/", postController.create);
postRoutes.get("/", postController.listFeed);
postRoutes.delete("/:id", postController.delete);

export { postRoutes };
