import express from "express";
import { login, register, logout, getUser, verifyUser, generateVerificationCode, forgotPassword, generateNewPassword, updatePassword, updateProfile } from "../controllers/userController.js";
import { attachUser, isAuthenticated } from "../middlewares/auth.js";
import { authLimiter } from "../middlewares/rateLimit.js";

const router = express.Router();

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/verify", authLimiter, verifyUser);
router.post("/generate-code", authLimiter, generateVerificationCode);
router.get("/logout", isAuthenticated, logout);
// attachUser, not isAuthenticated: this is the frontend's silent "am I
// logged in?" check on every page load, not an access-controlled route. A
// missing/invalid session is a normal "no" here, not a 401.
router.get("/getuser", attachUser, getUser);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/generate-new-password", authLimiter, generateNewPassword);
router.post("/update-password", isAuthenticated, updatePassword);
router.put("/update-profile", isAuthenticated, updateProfile);

export default router;