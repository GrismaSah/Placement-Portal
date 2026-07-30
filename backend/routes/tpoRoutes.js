import express from "express";
import { isAuthenticatedTPO } from "../middlewares/auth.js";
import { forgotPasswordTPO, generateVerificationCodeTPO, getPendingTNPs, getTPO, handleTNPRequest, loginTPO, logoutTPO, registerTPO, updatePasswordTPO, verifyUserTPO } from "../controllers/tpoController.js";
import { authorizeRoles } from "../middlewares/tpoAuth.js";

const router = express.Router();

router.post("/register", registerTPO);
router.post("/login", loginTPO);
router.post("/verify", verifyUserTPO);
router.post("/generate-code", generateVerificationCodeTPO);
router.get("/logout", isAuthenticatedTPO, logoutTPO);
router.get("/me", isAuthenticatedTPO, getTPO);

router.post(
  "/tnp-request",
  isAuthenticatedTPO,
  authorizeRoles("TPO"),
  handleTNPRequest
);
router.get(
  "/pending-tnps",
  isAuthenticatedTPO,
  authorizeRoles("TPO"),
  getPendingTNPs
);
router.post("/forgot-password", forgotPasswordTPO);
router.post("/generate-new-password", generateVerificationCodeTPO);
router.post(("/update-password", isAuthenticatedTPO, updatePasswordTPO));
    
export default router;