import express from "express";
import { isAuthenticatedTPO } from "../middlewares/auth.js";
import { forgotPasswordTPO, generateVerificationCodeTPO, getPendingTNPs, getTPO, handleTNPRequest, loginTPO, logoutTPO, registerTPO, updatePasswordTPO, updateProfileTPO, verifyUserTPO } from "../controllers/tpoController.js";
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
// Was `router.post(("/update-password", ...))` — the extra parens collapsed the
// three arguments into one via the comma operator, so this path was never
// actually registered and every request to it 404'd.
router.post("/update-password", isAuthenticatedTPO, updatePasswordTPO);
router.put("/update-profile", isAuthenticatedTPO, updateProfileTPO);


export default router;