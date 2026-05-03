import { Router } from "express";
import { LinkController } from "../controllers/LinkController.js";

const linkRoutes = Router();
const linkController = new LinkController();

linkRoutes.post("/", linkController.create);

export { linkRoutes };
