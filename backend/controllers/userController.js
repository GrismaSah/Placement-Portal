import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { User } from "../models/userSchema.js";
import ErrorHandler from "../middlewares/error.js";
import { clearTokenCookie, publicUser, sendToken } from "../utils/jwtToken.js";
import { sendVerificationCode } from "../utils/verifyEmail/email.js";
import { sentRegisteredEmail } from "../utils/registeredUser/register.js";
import { emitProfileUpdate } from "../socket.js";
import { BRANDING } from "../config/branding.js";
import { StudentAllowlist } from "../models/studentAllowlistModel.js";
import { CODE_SELECT, checkCode, issueCode } from "../utils/verificationCode.js";
import {
  assertPasswordPolicy,
  burnPasswordComparison,
} from "../utils/passwordPolicy.js";

/**
 * One message for every way a sign-in can fail.
 *
 * Login used to answer "Invalid Email." when no account matched, "Invalid
 * Password." when one did, and a 404 naming the role when the role was wrong —
 * which together confirm which addresses hold accounts and what each one is.
 * That is what let an attacker aim the code-minting endpoints at a real
 * account, and OWASP asks for a consistent message here for exactly that
 * reason.
 */
const INVALID_CREDENTIALS = "Invalid email or password.";

/** Likewise one message whether the address is unknown or the code is wrong. */
const INVALID_CODE = "That verification code is not correct or has expired.";

/**
 * Said whether or not the address has an account.
 *
 * This costs a little honesty — the old copy distinguished "sent" from "could
 * not send", which was genuinely useful when SMTP is misconfigured. But this
 * endpoint is unauthenticated and takes an arbitrary address, so any answer
 * that varies with whether the account exists is an enumeration oracle. The
 * paths where the caller has already proved the account is theirs still report
 * the real delivery result.
 */
const CODE_SENT_GENERIC =
  "If an account exists for that address, we've sent a verification code to it.";

export const register = catchAsyncErrors(async (req, res, next) => {
  const { name, email, phone, password, role, enrollment, address } = req.body;

  if (!name || !email || !phone || !password || !role || !address) {
    return next(new ErrorHandler("Please fill the complete form!"));
  }

  // Normalise up front — comparisons below and the pre-existence checks both
  // need this, and it must match what the schema will store on save (see
  // userSchema.js) or a mismatched-case duplicate would slip past both.
  const normalizedEmail = String(email).trim().toLowerCase();

  if (role === "Student") {
    if (!enrollment || !String(enrollment).trim()) {
      return next(new ErrorHandler("Please enter your enrollment number.", 400));
    }

    const normalizedEnrollment = String(enrollment).trim().toUpperCase();
    const expectedEmail = `${normalizedEnrollment.toLowerCase()}@${BRANDING.studentEmailDomain}`;

    // Ties every student account to a mailbox the university actually
    // issued for that enrollment number — an arbitrary personal address
    // proves nothing about who the registrant is.
    if (normalizedEmail !== expectedEmail) {
      return next(
        new ErrorHandler(
          `Students must register with their official JAIN University email — ${expectedEmail}.`,
          400
        )
      );
    }

    // Only enrollment numbers JAIN actually issued may register — otherwise
    // the email-domain check above is satisfiable by anyone who can guess a
    // plausible-looking enrollment number.
    const allowlistEntry = await StudentAllowlist.findOne({
      enrollment: normalizedEnrollment,
    });
    if (!allowlistEntry || allowlistEntry.email !== normalizedEmail) {
      return next(
        new ErrorHandler(
          "This enrollment number is not recognized. Contact the placement office if you believe this is an error.",
          400
        )
      );
    }

    // The unique index on {enrollment, role:"Student"} is the real
    // backstop (see userSchema.js) for a race between two simultaneous
    // registrations; this is just a friendlier message for the common case.
    const isEnrollment = await User.findOne({
      role: "Student",
      enrollment: normalizedEnrollment,
    });
    if (isEnrollment) {
      return next(
        new ErrorHandler("This enrollment number is already registered.", 400)
      );
    }
  }

  const isEmail = await User.findOne({ email: normalizedEmail });
  if (isEmail) {
    return next(new ErrorHandler("Email already registered!"));
  }

  // Checked here as well as by the schema validator, so the rule cannot be
  // lost to a change in Mongoose middleware ordering. See passwordPolicy.js.
  assertPasswordPolicy(password);

  const user = new User({
    name,
    email: normalizedEmail,
    phone,
    password,
    role,
    enrollment,
    address,
  });
  // Mints the code, stores its keyed hash with a 10-minute expiry, and returns
  // the six digits to put in the email — the plaintext is never persisted.
  const verificationCode = issueCode(user);
  await user.save();

  const delivery = await sendVerificationCode(normalizedEmail, verificationCode);

  res.status(200).json({
    success: true,
    // Tell the truth about delivery. Claiming "check your inbox" when no mail
    // server is configured leaves the user waiting for something that will
    // never arrive.
    message: delivery.sent
      ? "Verification code sent to your email. Please check your inbox."
      : "Account created, but the verification email could not be sent. Please contact the placement office.",
    emailSent: delivery.sent,
    // Return only non-sensitive fields. The whole Mongoose document used to go
    // back here, which meant every registration response contained the
    // account's bcrypt hash and its plaintext verification code — the latter
    // defeating the point of email verification entirely.
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

export const login = catchAsyncErrors(async (req, res, next) => {
  const { email, password, role, verificationCode } = req.body;
  if (!email || !password || !role) {
    return next(new ErrorHandler("Please provide email ,password and role."));
  }
  // Stored emails are lowercased on save (see userSchema.js); a query has to
  // match that or "Student@Jain.Test" typed at login stops finding the
  // account "student@jain.test" that was actually stored.
  // +password: the hash is select:false on the schema, and comparePassword
  // below needs it.
  const user = await User.findOne({
    email: String(email).trim().toLowerCase(),
  }).select(`+password ${CODE_SELECT}`);

  // Unknown address and wrong role answer exactly as a wrong password does,
  // and pay the same bcrypt cost before doing so. Returning early here without
  // hashing made "no such account" measurably faster than "wrong password",
  // which enumerates accounts even when the wording is identical.
  if (!user || user.role !== role) {
    await burnPasswordComparison(password);
    return next(new ErrorHandler(INVALID_CREDENTIALS, 401));
  }

  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler(INVALID_CREDENTIALS, 401));
  }

  if (role === "Recruiter") {
    // A Recruiter's code is nulled after every use (registration or previous
    // login), so a plain email+password submit never has one to check
    // against. Previously that fell straight into the mismatch branch below
    // and errored with "Invalid verification code" — which the frontend then
    // read as "a code exists, ask for it," sending the recruiter to a
    // "We've sent a 6-digit code" screen when no code had actually been
    // generated or emailed. Mint and send one here, the same way the
    // Student branch below already does for an unverified student.
    if (!verificationCode) {
      const freshCode = issueCode(user);
      await user.save();
      const delivery = await sendVerificationCode(user.email, freshCode);

      return res.status(200).json({
        success: true,
        // Honest about delivery here: the caller has already proved the
        // password, so this reveals nothing they did not already know.
        message: delivery.sent
          ? "Verification code sent to your email. Please check your inbox."
          : "Could not send the verification email. Please contact the placement office.",
        emailSent: delivery.sent,
      });
    }

    // Expiry, the attempt cap and the constant-time comparison all live in
    // checkCode, which also persists the attempt counter on a wrong guess.
    if (!(await checkCode(user, verificationCode))) {
      return next(new ErrorHandler(INVALID_CODE, 400));
    }
    if (user.isVerified === false) {
      sentRegisteredEmail(user);
    }
    user.isVerified = true;
    await user.save();
  }

  
  if (role === "Student" && user.isVerified === false) {
    const verificationCode = issueCode(user);
    await user.save();
    const delivery = await sendVerificationCode(user.email, verificationCode);

    return res.status(200).json({
      success: true,
      message: delivery.sent
        ? "Verification code sent to your email. Please check your inbox."
        : "Could not send the verification email. Please contact the placement office.",
      emailSent: delivery.sent,
      // publicUser, not the raw document: this branch mints a verification
      // code four lines above, and returning the document handed that second
      // factor — and the bcrypt hash — straight back to the caller.
      user: publicUser(user),
    });
  }

  sendToken(user, 201, res, "User Logged In!");
});

export const logout = catchAsyncErrors(async (req, res, next) => {
  // Must use the same secure/sameSite/path flags the cookie was set with —
  // a browser will not overwrite a Secure cookie with a non-Secure one, so
  // over HTTPS the old clear silently left the user signed in.
  clearTokenCookie(res)
    .status(201)
    .json({
      success: true,
      message: "Logged Out Successfully.",
    });
});

export const getUser = catchAsyncErrors((req, res, next) => {
  const user = req.user;
  res.status(200).json({
    success: true,
    user,
  });
});

// verification code controller
export const verifyUser = catchAsyncErrors(async (req, res, next) => {
  const { verificationCode, email } = req.body;
  if (!verificationCode || !email) {
    return next(new ErrorHandler("Please provide verification code."));
  }
  const user = await User.findOne({
    email: String(email).trim().toLowerCase(),
  }).select(CODE_SELECT);

  // One answer for "no such address" and "wrong code". This endpoint issues a
  // session, so letting it distinguish the two would make it a free oracle for
  // which addresses are registered.
  if (!user || !(await checkCode(user, verificationCode))) {
    return next(new ErrorHandler(INVALID_CODE, 400));
  }

  user.isVerified = true;
  await user.save();

  sentRegisteredEmail(user);

  sendToken(user, 201, res, "User Registered Successfully!");
});

// generate verification code and send it to the user's email while login
export const generateVerificationCode = catchAsyncErrors(
  async (req, res, next) => {
    const { email } = req.body;
    if (!email) {
      return next(new ErrorHandler("Email is required.", 400));
    }

    const user = await User.findOne({
      email: String(email).trim().toLowerCase(),
    }).select(CODE_SELECT);

    // Only actually send when the account exists — but answer identically
    // either way. This route is unauthenticated and accepts any address, so a
    // 404 here told an attacker precisely which addresses are registered.
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

export const forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const { email, verificationCode } = req.body;

  if (!verificationCode) {
    return next(new ErrorHandler("Verification code is required.", 400));
  }

  const user = await User.findOne({
    email: String(email).trim().toLowerCase(),
  }).select(CODE_SELECT);

  // `consume: false` — this is the middle step of the reset flow and
  // generate-new-password checks the same code again when the new password is
  // submitted. Burning it here would break that second check. A wrong guess
  // still costs an attempt.
  //
  // A wrong code used to fall off the end of the function without responding,
  // so the request hung until the client gave up — and the UI's empty catch
  // block let the user proceed to set a new password regardless.
  if (!user || !(await checkCode(user, verificationCode, { consume: false }))) {
    return next(new ErrorHandler(INVALID_CODE, 400));
  }

  res.status(200).json({
    success: true,
    message: "Verification code is correct.",
  });
});

export const generateNewPassword = catchAsyncErrors(async (req, res, next) => {
  const { email, newPassword, verificationCode } = req.body;

  /**
   * SECURITY: this endpoint previously accepted { email, newPassword } and set
   * the password with no code, no token and no session. Any unauthenticated
   * caller who knew an email address could take over that account outright.
   *
   * The emailed code is the only proof of ownership this flow has, so it is
   * required here rather than only on the preceding step — nothing obliged a
   * caller to make that call at all.
   */
  if (!verificationCode) {
    return next(new ErrorHandler("Verification code is required.", 400));
  }

  assertPasswordPolicy(newPassword);

  const user = await User.findOne({
    email: String(email).trim().toLowerCase(),
  }).select(CODE_SELECT);

  // checkCode burns the code on success, so the same one cannot be replayed.
  if (!user || !(await checkCode(user, verificationCode))) {
    return next(new ErrorHandler(INVALID_CODE, 400));
  }

  user.password = newPassword;
  // Whoever reset this password now owns the account, so every session that
  // predates the reset must stop working — including the attacker's, if the
  // reset is the victim taking their account back. sendToken below mints a
  // fresh cookie carrying the new version, so this caller stays signed in.
  user.tokenVersion = (user.tokenVersion ?? 0) + 1;
  await user.save();

  // sendToken sets the cookie and sends the body. The res.json that used to
  // follow it threw ERR_HTTP_HEADERS_SENT on every successful reset.
  sendToken(user, 200, res, "Password updated successfully.");
});

// update own profile
export const updateProfile = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new ErrorHandler("User not found.", 404));
  }

  // Assign only these, field by field. Never Object.assign(user, req.body):
  // role, status, isVerified, email and password all live on this same
  // document, so a blind merge would let a student PUT {role:"Recruiter",
  // status:"Approved"} and promote themselves past the Admin approval flow.
  const { name, phone, address, enrollment, branch, batch, cgpa } = req.body;

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (address !== undefined) user.address = address;
  // Enrolment only means anything for students.
  if (enrollment !== undefined && user.role === "Student") {
    user.enrollment = enrollment;
  }
  // Academic fields are student-only for the same reason as enrolment. They
  // were missing from the whitelist rather than deliberately excluded: the
  // form sends all three, the server dropped them, and the UI still reported
  // success — which is also why branch-wise analytics could never populate.
  if (branch !== undefined && user.role === "Student") user.branch = branch;
  if (batch !== undefined && user.role === "Student") user.batch = batch;
  if (cgpa !== undefined && user.role === "Student") user.cgpa = cgpa;

  // save() rather than findByIdAndUpdate so the schema validators run.
  await user.save();

  const safeUser = await User.findById(user._id).select("-password");
  emitProfileUpdate(user._id, safeUser);

  res.status(200).json({
    success: true,
    message: "Profile updated successfully.",
    user: safeUser,
  });
});

// update password
export const updatePassword = catchAsyncErrors(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;


  if (!oldPassword || !newPassword) {
    return next(new ErrorHandler("Old password and new password are required.", 400));
  }

  assertPasswordPolicy(newPassword);

  // +password: the hash is select:false on the schema, and comparePassword
  // below needs it.
  const user = await User.findById(req.user._id).select("+password");

  if (!user) {
    return next(new ErrorHandler("User not found.", 404));
  }

  const isPasswordMatched = await user.comparePassword(oldPassword);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Old password is incorrect.", 400));
  }

  user.password = newPassword;
  // Signs out every other device. Changing your password is the one action a
  // user takes when they think someone else has their account, and before
  // this it did nothing to the sessions that someone else was already using.
  user.tokenVersion = (user.tokenVersion ?? 0) + 1;
  await user.save();
  sendToken(user, 200, res, "Password updated successfully.");
});
