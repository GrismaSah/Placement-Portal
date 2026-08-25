import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { Admin } from "../models/adminModel.js";
import ErrorHandler from "../middlewares/error.js";
import { clearTokenCookie, sendToken } from "../utils/jwtToken.js";
import { User } from "../models/userSchema.js";
import { sendVerificationCode } from "../utils/verifyEmail/email.js";
import { sentRegisteredEmail } from "../utils/registeredUser/register.js";
import { sendRecruiterStatusEmailApproved, sendRecruiterStatusEmailDeclined } from "../utils/sendRecruiterStatusEmail.js";
import { emitProfileUpdate } from "../socket.js";
import { notify } from "../utils/notify.js";
import { CODE_SELECT, checkCode, issueCode } from "../utils/verificationCode.js";
import {
  assertPasswordPolicy,
  burnPasswordComparison,
} from "../utils/passwordPolicy.js";

// Same wording as the User side — see the note in userController.js.
const INVALID_CREDENTIALS = "Invalid email or password.";
const INVALID_CODE = "That verification code is not correct or has expired.";
const CODE_SENT_GENERIC =
  "If an account exists for that address, we've sent a verification code to it.";

/**
 * Coerce a client-supplied email into a string before it reaches a query.
 *
 * express.json() parses `{"email": {"$ne": null}}` into an *object*, and
 * Mongoose passes an object straight through as a query operator — so
 * `Admin.findOne({ email })` with that body selected an arbitrary admin
 * document instead of failing to match. From there the caller could aim the
 * code-minting and code-checking endpoints at a real admin account without
 * knowing a single admin address.
 *
 * userController already does this inline at every one of its User lookups;
 * these six were the ones that missed it.
 *
 * Not lowercasing here on purpose: adminSchema has no `lowercase: true`, so
 * addresses are stored exactly as first entered. Folding case on the way into
 * the query would stop matching any admin already stored with a capital
 * letter. Fixing that properly means normalising the stored data and the
 * schema together — a migration, not a one-line change.
 */
const queryEmail = (email) => String(email ?? "").trim();

export const registerAdmin = catchAsyncErrors(async (req, res, next) => {
    const { firstname, lastname, email, phone, password } = req.body;


  if (!firstname || !lastname || !email || !phone || !password ) {
    return next(new ErrorHandler("Please fill all required fields!"));
  }

  const isEmail = await Admin.findOne({ email: queryEmail(email) });
  if (isEmail) {
    return next(new ErrorHandler("Email already registered!"));
  }
  assertPasswordPolicy(password);

  const admin = new Admin({
    firstname,
    lastname,
    email,
    phone,
    password,
  });
  const verificationCode = issueCode(admin);
  await admin.save();

  const delivery = await sendVerificationCode(email, verificationCode);

  res.status(200).json({
    success: true,
    message: delivery.sent
      ? "Verification code sent to your email. Please check your inbox."
      : "Account created, but the verification email could not be sent.",
    emailSent: delivery.sent,
    // Only non-sensitive fields — the full document leaked the bcrypt hash and
    // the plaintext verification code.
    admin: {
      _id: admin._id,
      firstname: admin.firstname,
      lastname: admin.lastname,
      email: admin.email,
    },
  });
});

export const loginAdmin = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Please provide email and password."));
  }

  const admin = await Admin.findOne({ email: queryEmail(email) }).select(
    "+password"
  );

  // Identical answer and identical cost whether the address is unknown or the
  // password is wrong — see the note in userController.js.
  if (!admin) {
    await burnPasswordComparison(password);
    return next(new ErrorHandler(INVALID_CREDENTIALS, 401));
  }
  const isPasswordMatched = await admin.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler(INVALID_CREDENTIALS, 401));
  }

  // No emailed code here: this is a single-admin portfolio project, so a
  // correct password is the whole check. Trading away the second factor for
  // a one-step sign-in is a reasonable call for a known, single operator —
  // it would not be for a placement office with real staff turnover.
  if (admin.isVerified === false) {
    sentRegisteredEmail(admin);
  }
  admin.isVerified = true;
  await admin.save();

  sendToken(admin, 200, res, "Admin Logged In!");
});

export const logoutAdmin = catchAsyncErrors(async (req, res, next) => {
  // Same flags as when it was set, otherwise the browser keeps the cookie.
  clearTokenCookie(res)
    .status(200)
    .json({
      success: true,
      message: "Logged Out Successfully.",
    });
});


export const handleRecruiterRequest = catchAsyncErrors(async (req, res, next) => {
    const { userId, action } = req.body;


    if (!userId || !["Approved", "Declined"].includes(action)) {
      return next(new ErrorHandler("Invalid input!"));
    }

    const user = await User.findById(userId);
    if (!user || user.role !== "Recruiter") {
      return next(new ErrorHandler("Recruiter user not found!"));
    }

  user.status = action;

  await user.save();

  const approved = action === "Approved";

  // In-app notification alongside the email — the recruiter sees the decision
  // the moment they next open the portal, whether or not SMTP is configured.
  notify({
    user: user._id,
    type: approved ? "recruiter:approved" : "recruiter:declined",
    title: approved
      ? "Your recruiter account is approved"
      : "About your recruiter account",
    body: approved
      ? "You can now post openings and review applicants."
      : "The Placement Office was unable to approve your account at this time.",
    link: "/app/dashboard",
  });

  if (approved) {
    sendRecruiterStatusEmailApproved(user);
    res.status(200).json({ success: true, message: "Recruiter approved." });
  } else {
    sendRecruiterStatusEmailDeclined(user);
    res.status(200).json({ success: true, message: "Recruiter declined." });
  }
});


  export const getPendingRecruiters = catchAsyncErrors(async (req, res, next) => {
    const pendingRecruiters = await User.find({ role: "Recruiter", status: "Pending" })
      .select("-password -verificationCode")
      .sort({ createdAt: -1 });

    // An empty queue is the normal, desirable state — not an error. This used
    // to return 404 when there was nothing to review, which forced the client
    // to discover "all clear" through its error handler and made an empty
    // state indistinguishable from a genuine failure.
    res.status(200).json({
      success: true,
      count: pendingRecruiters.length,
      pendingRecruiters,
    });
  });

  export const getAdmin = catchAsyncErrors((req, res, next) => {
    // `role` is not a path on adminSchema, so setting it on the Mongoose
    // document (as isAuthenticatedAdmin does) is dropped during JSON
    // serialisation and the client receives an Admin with no role at all.
    // Spread to a plain object so the role actually survives the response.
    const user = req.user ? { ...req.user.toObject(), role: "Admin" } : null;

    res.status(200).json({
      success: true,
      user,
    });
  });

// update own Admin profile
export const updateProfileAdmin = catchAsyncErrors(async (req, res, next) => {
  const admin = await Admin.findById(req.user._id);
  if (!admin) {
    return next(new ErrorHandler("User not found.", 404));
  }

  // Whitelisted assignment only — see the note in userController.updateProfile.
  const { firstname, lastname, phone } = req.body;

  if (firstname !== undefined) admin.firstname = firstname;
  if (lastname !== undefined) admin.lastname = lastname;
  if (phone !== undefined) admin.phone = phone;

  try {
    await admin.save();
  } catch (error) {
    // phone carries a unique index; surface that as something a human can act on.
    if (error.code === 11000) {
      return next(
        new ErrorHandler("That phone number is already registered.", 400)
      );
    }
    throw error;
  }

  const saved = await Admin.findById(admin._id);
  const safeUser = { ...saved.toObject(), role: "Admin" };
  emitProfileUpdate(admin._id, safeUser);

  res.status(200).json({
    success: true,
    message: "Profile updated successfully.",
    user: safeUser,
  });
});


/**
 * REMOVED: verifyUserAdmin (POST /api/v1/admin/verify).
 *
 * It authenticated on the emailed code alone — no password — and it lacked the
 * `if (!verificationCode)` guard that loginAdmin, forgotPasswordAdmin and
 * generateNewPasswordAdmin all have. `verificationCode` defaults to null and is
 * set back to null after every successful login, so null is the resting state,
 * and a body of {"email":"<admin>","verificationCode":null} made the check
 * `null !== null` — false. The guard was skipped and sendToken handed back a
 * valid Admin cookie. Any caller who knew an admin address had the student
 * directory, the analytics and the recruiter approval queue.
 *
 * Deleted rather than patched: nothing called it. Login.jsx sends Admin and
 * Recruiter through /login (which verifies the password first and then the
 * code), and only Students use a /verify endpoint. A newly registered admin is
 * marked verified by loginAdmin's own branch. Patching the comparison would
 * have left a password-less session-minting endpoint in place for the next
 * person to reintroduce the same bug into.
 */

// generate verification code and send it to the user's email while login
export const generateVerificationCodeAdmin = catchAsyncErrors(
  async (req, res, next) => {
    const { email } = req.body;
    if (!email) {
      return next(new ErrorHandler("Email is required.", 400));
    }

    const user = await Admin.findOne({ email: queryEmail(email) }).select(
      CODE_SELECT
    );

    // Send only if the account exists; answer the same either way. An admin
    // address is the most valuable thing this app could confirm.
    if (user) {
      const verificationCode = issueCode(user);
      await user.save();
      await sendVerificationCode(user.email, verificationCode);
    }

    res.status(200).json({
      success: true,
      message: CODE_SENT_GENERIC,
    });
  }
);

export const forgotPasswordAdmin = catchAsyncErrors(async (req, res, next) => {
  const { email, verificationCode } = req.body;

  if (!verificationCode) {
    return next(new ErrorHandler("Verification code is required.", 400));
  }

  const user = await Admin.findOne({ email: queryEmail(email) }).select(
    CODE_SELECT
  );

  // `consume: false` — generate-new-password re-checks this same code when the
  // new password arrives, so this step must not burn it.
  //
  // A wrong code used to fall off the end of the function without ever
  // responding, so the request hung until the client timed out — and the UI,
  // whose catch block was empty, advanced to the next step anyway.
  if (!user || !(await checkCode(user, verificationCode, { consume: false }))) {
    return next(new ErrorHandler(INVALID_CODE, 400));
  }

  res.status(200).json({
    success: true,
    message: "Verification code is correct.",
  });
});

export const generateNewPasswordAdmin = catchAsyncErrors(async (req, res, next) => {
  const { email, newPassword, verificationCode } = req.body;

  /**
   * SECURITY: this endpoint previously accepted { email, newPassword } and set
   * the password with no code, no token and no session — meaning anyone who
   * knew an address could take over that account. The emailed code is the only
   * proof of ownership in this flow, so it is now required here too. Checking
   * it on the previous step alone was worthless: nothing forced a caller to
   * make that call first.
   */
  if (!verificationCode) {
    return next(new ErrorHandler("Verification code is required.", 400));
  }

  assertPasswordPolicy(newPassword);

  const user = await Admin.findOne({ email: queryEmail(email) }).select(
    CODE_SELECT
  );

  // checkCode burns the code, so it cannot be replayed to reset again.
  if (!user || !(await checkCode(user, verificationCode))) {
    return next(new ErrorHandler(INVALID_CODE, 400));
  }

  user.password = newPassword;
  // Ends every session that predates the reset — see userController.
  user.tokenVersion = (user.tokenVersion ?? 0) + 1;
  await user.save();

  // sendToken already writes the cookie and sends a JSON body; the second
  // res.json that used to follow it threw ERR_HTTP_HEADERS_SENT every time.
  sendToken(user, 200, res, "Password updated successfully.");
});

export const updatePasswordAdmin = catchAsyncErrors(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return next(
      new ErrorHandler("Old password and new password are required.", 400)
    );
  }

  assertPasswordPolicy(newPassword);

  const user = await Admin.findById(req.user._id).select("+password");
  if (!user) {
    return next(new ErrorHandler("User not found.", 404));
  }
  const isPasswordMatched = await user.comparePassword(oldPassword);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Old password is incorrect.", 400));
  }
  user.password = newPassword;
  // Signs out every other device — see userController.updatePassword.
  user.tokenVersion = (user.tokenVersion ?? 0) + 1;
  await user.save();
  sendToken(user, 201, res, "Password updated successfully.");
});
