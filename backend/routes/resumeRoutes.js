import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {
  deleteMyResume,
  deleteMyResumeFile,
  getMyResume,
  getResumeFile,
  uploadMyResumeFile,
  upsertMyResume,
} from "../controllers/resumeController.js";

const router = express.Router();

router.get("/me", isAuthenticated, getMyResume);
router.put("/me", isAuthenticated, upsertMyResume);
router.delete("/me", isAuthenticated, deleteMyResume);

router.post("/me/file", isAuthenticated, uploadMyResumeFile);
router.delete("/me/file", isAuthenticated, deleteMyResumeFile);

// Access-controlled inside the handler: owner, or the recruiter on an
// application carrying this file. Never make this route public.
router.get("/file/:fileId", isAuthenticated, getResumeFile);

export default router;
