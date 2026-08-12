import express from "express";
import {
  recruiterGetAllApplications,
  jobseekerDeleteApplication,
  jobseekerGetAllApplications,
  postApplication,
  updateApplicationStatus,
} from "../controllers/applicationController.js";
import { isAuthenticated, isAuthenticatedAny } from "../middlewares/auth.js";

const router = express.Router();

router.post("/post", isAuthenticated, postApplication);
router.get("/recruiter/getall", isAuthenticated, recruiterGetAllApplications);
router.get("/jobseeker/getall", isAuthenticated, jobseekerGetAllApplications);
router.delete("/delete/:id", isAuthenticated, jobseekerDeleteApplication);

// Recruiters and the placement office both move candidates through the
// pipeline, and they live in different collections — hence the shared guard.
// The controller does the role and ownership checks.
router.patch("/:id/status", isAuthenticatedAny, updateApplicationStatus);

export default router;
