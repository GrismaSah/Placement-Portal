import express from "express";
import { login, register, logout, getUser, verifyUser, generateVerificationCode, forgotPassword, generateNewPassword, updatePassword, updateProfile } from "../controllers/userController.js";
import { attachUser, isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/verify", verifyUser);
router.post("/generate-code", generateVerificationCode);
router.get("/logout", isAuthenticated, logout);
// attachUser, not isAuthenticated: this is the frontend's silent "am I
// logged in?" check on every page load, not an access-controlled route. A
// missing/invalid session is a normal "no" here, not a 401.
router.get("/getuser", attachUser, getUser);
router.post("/forgot-password", forgotPassword);
router.post("/generate-new-password", generateNewPassword);
router.post("/update-password", isAuthenticated, updatePassword);
router.put("/update-profile", isAuthenticated, updateProfile);

export default router;