import express from "express";
import { attachAdmin, isAuthenticatedAdmin } from "../middlewares/auth.js";
import { forgotPasswordAdmin, generateNewPasswordAdmin, generateVerificationCodeAdmin, getPendingRecruiters, getAdmin, handleRecruiterRequest, loginAdmin, logoutAdmin, registerAdmin, updatePasswordAdmin, updateProfileAdmin } from "../controllers/adminController.js";
import { authorizeRoles } from "../middlewares/authorize.js";
import { authLimiter } from "../middlewares/rateLimit.js";
import {
  getPlacementAnalytics,
  getStudentDirectory,
} from "../controllers/analyticsController.js";

const router = express.Router();

// Creating an admin has to be an admin-only act. Unguarded, anyone could POST
// here, receive the verification code at their own address, log in, and then
// read the entire student directory and approve recruiters. The first admin is
// created by `npm run seed:accounts`, so gating this breaks no bootstrap path.
router.post("/register", authLimiter, isAuthenticatedAdmin, authorizeRoles("Admin"), registerAdmin);
router.post("/login", authLimiter, loginAdmin);
// No POST /verify here on purpose — see the note where verifyUserAdmin was
// removed in adminController.js. It granted an Admin session on the emailed
// code alone, and a null code matched the null resting state. Admins verify
// through /login, which checks the password first.
router.post("/generate-code", authLimiter, generateVerificationCodeAdmin);
router.get("/logout", isAuthenticatedAdmin, logoutAdmin);
// attachAdmin, not isAuthenticatedAdmin: the frontend's silent session check
// (see the same comment on GET /user/getuser). No session is a normal "no".
router.get("/me", attachAdmin, getAdmin);

router.post(
  "/recruiter-request",
  isAuthenticatedAdmin,
  authorizeRoles("Admin"),
  handleRecruiterRequest
);
router.get(
  "/pending-recruiters",
  isAuthenticatedAdmin,
  authorizeRoles("Admin"),
  getPendingRecruiters
);
router.post("/forgot-password", authLimiter, forgotPasswordAdmin);
// Was wired to generateVerificationCodeAdmin — the password reset endpoint was
// resending a code instead of setting the new password, so Admin reset silently
// never worked.
router.post("/generate-new-password", authLimiter, generateNewPasswordAdmin);

// ---- Placement reporting ----
// The office previously had no reporting at all.
router.get("/analytics", isAuthenticatedAdmin, authorizeRoles("Admin"), getPlacementAnalytics);
router.get("/students", isAuthenticatedAdmin, authorizeRoles("Admin"), getStudentDirectory);
// Was `router.post(("/update-password", ...))` — the extra parens collapsed the
// three arguments into one via the comma operator, so this path was never
// actually registered and every request to it 404'd.
router.post("/update-password", isAuthenticatedAdmin, updatePasswordAdmin);
router.put("/update-profile", isAuthenticatedAdmin, updateProfileAdmin);


export default router;
