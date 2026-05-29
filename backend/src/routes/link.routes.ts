import { Router } from "express";
import { LinkController } from "../controllers/LinkController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";


const linkRoutes = Router();
const linkController = new LinkController();

linkRoutes.post("/", authMiddleware, linkController.create);

export { linkRoutes };
