import { Router } from "express";
import { UserController } from "../controllers/UserController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { uploadAvatar, uploadResume, uploadBanner } from "../middlewares/uploadMiddleware.js";

const userRoutes = Router();
const userController = new UserController();

userRoutes.post("/", userController.create);
userRoutes.get("/users/search", userController.searchUsers);
userRoutes.get("/:id", userController.getUserById);


userRoutes.put("/:id", authMiddleware, userController.updateProfile);
userRoutes.post("/:id/banner", uploadBanner.single('file'), userController.uploadUserBanner);
userRoutes.post("/:id/avatar", uploadAvatar.single('file'), userController.uploadUserAvatar);
userRoutes.post("/:id/resume", uploadResume.single('file'), userController.uploadUserResume);

export { userRoutes };
