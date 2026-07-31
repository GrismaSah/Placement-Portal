import express from "express";
import { isAuthenticatedAny } from "../middlewares/auth.js";
import {
  getNotifications,
  markAllRead,
  markRead,
} from "../controllers/notificationController.js";

const router = express.Router();

// All three roles use the bell, and they are split across two collections, so
// these use the role-agnostic guard.
router.get("/", isAuthenticatedAny, getNotifications);
router.patch("/:id/read", isAuthenticatedAny, markRead);
router.post("/read-all", isAuthenticatedAny, markAllRead);

export default router;
