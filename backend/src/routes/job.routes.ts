import { Router } from "express";
import { JobController } from "../controllers/JobController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const jobRoutes = Router();
const jobController = new JobController();

jobRoutes.post("/", authMiddleware, jobController.create);
jobRoutes.get("/company/:companyId",authMiddleware,jobController.getByCompany);
jobRoutes.patch("/:jobId/status", authMiddleware, jobController.toggleStatus);
jobRoutes.patch("/:jobId/applicants/:userId/status", authMiddleware, jobController.updateApplicantStatus);
jobRoutes.get("/match/:userId", authMiddleware, jobController.getMatches);
jobRoutes.delete("/:jobId", authMiddleware, jobController.delete);
jobRoutes.put("/:jobId", authMiddleware, jobController.update);
jobRoutes.delete("/:jobId/applicants/:userId",authMiddleware, jobController.removeApplicant,);

export { jobRoutes };
