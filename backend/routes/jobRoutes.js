import express from "express";
import {
  deleteJob,
  getAllJobs,
  getJobStats,
  getMyJobs,
  getSingleJob,
  postJob,
  updateJob,
} from "../controllers/jobController.js";
import { isAuthenticated, isAuthenticatedAny } from "../middlewares/auth.js";

const router = express.Router();

router.get("/getall", getAllJobs);
// Must stay above "/:id" — below it Express matches "stats" as an id and CastErrors.
router.get("/stats", getJobStats);
router.post("/post", isAuthenticated, postJob);
router.get("/getmyjobs", isAuthenticated, getMyJobs);
router.put("/update/:id", isAuthenticated, updateJob);
router.delete("/delete/:id", isAuthenticated, deleteJob);
// isAuthenticatedAny, not isAuthenticated: the placement office has "Openings"
// in its own sidebar (roles.js), but Admins live in the `admins` collection, so
// the User-only guard resolved their valid token to null and 401'd. Every job
// card the officer clicked rendered "This role is no longer listed".
// getSingleJob reads nothing off req.user, so widening the guard is enough.
router.get("/:id", isAuthenticatedAny, getSingleJob);

export default router;