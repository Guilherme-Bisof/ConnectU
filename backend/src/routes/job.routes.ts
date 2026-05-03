import { Router } from "express";
import { JobController } from "../controllers/JobController.js";

const jobRoutes = Router();
const jobController = new JobController();

jobRoutes.post("/", jobController.create);
jobRoutes.get("/match/:userId", jobController.getMatches);

export { jobRoutes };
