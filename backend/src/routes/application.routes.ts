import { Router } from "express";
import { ApplicationController } from "../controllers/ApplicationController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const applicationRoutes = Router();
const applicationController = new ApplicationController();

applicationRoutes.post("/", authMiddleware, applicationController.apply);
applicationRoutes.get("/job/:jobId",authMiddleware, applicationController. getJobApplication,);

export { applicationRoutes };
