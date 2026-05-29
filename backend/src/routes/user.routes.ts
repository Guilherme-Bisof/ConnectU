import { Router } from "express";
import { UserController } from "../controllers/UserController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const userRoutes = Router();
const userController = new UserController();

userRoutes.post("/", userController.create);
userRoutes.get("/:id", userController.getUserById);

userRoutes.put("/:id", authMiddleware, userController.updateProfile);

export { userRoutes };
