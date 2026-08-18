import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { User } from "../models/userSchema.js";
import ErrorHandler from "../middlewares/error.js";
import { clearTokenCookie, publicUser, sendToken } from "../utils/jwtToken.js";
import { sendVerificationCode } from "../utils/verifyEmail/email.js";
import { sentRegisteredEmail } from "../utils/registeredUser/register.js";
import { emitProfileUpdate } from "../socket.js";
import { BRANDING } from "../config/branding.js";
import { StudentAllowlist } from "../models/studentAllowlistModel.js";

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
  const verificationCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString();
  const user = await User.create({
    name,
    email: normalizedEmail,
    phone,
    password,
    role,
    enrollment,
    address,
    verificationCode,
  });
  
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
  }).select("+password");
  if (!user) {
    return next(new ErrorHandler("Invalid Email.", 400));
  }
  if (user.role !== role) {
    return next(
      new ErrorHandler(`User with provided email and ${role} not found!`, 404)
    );
  }
  
  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid Password.", 400));
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
      const freshCode = Math.floor(100000 + Math.random() * 900000).toString();
      user.verificationCode = freshCode;
      await user.save();
      const delivery = await sendVerificationCode(email, freshCode);

      return res.status(200).json({
        success: true,
        message: delivery.sent
          ? "Verification code sent to your email. Please check your inbox."
          : "Could not send the verification email. Please contact the placement office.",
        emailSent: delivery.sent,
      });
    }

    if (user.verificationCode !== verificationCode) {
      return next(new ErrorHandler("Invalid verification code.", 400));
    }
    if (user.isVerified === false) {
      sentRegisteredEmail(user);
    }
    user.isVerified = true;
    user.verificationCode = null;
    await user.save();
  }

  
  if (role === "Student" && user.isVerified === false) {
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    user.verificationCode = verificationCode;
    await user.save();
    const delivery = await sendVerificationCode(email, verificationCode);

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
  const user = await User.findOne({ email: String(email).trim().toLowerCase() });
  if (!user) {
    return next(new ErrorHandler("User not found.", 404));
  }
  if (user.verificationCode !== verificationCode) {
    return next(new ErrorHandler("Invalid verification code.", 400));
  }

  user.isVerified = true;
  user.verificationCode = null;
  await user.save();

  sentRegisteredEmail(user);

  sendToken(user, 201, res, "User Registered Successfully!");
});

// generate verification code and send it to the user's email while login
export const generateVerificationCode = catchAsyncErrors(
  async (req, res, next) => {
    const { email } = req.body;

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!user) {
      return next(new ErrorHandler("User not found.", 404));
    }
    user.verificationCode = verificationCode;
    await user.save();
    const delivery = await sendVerificationCode(email, verificationCode);
    res.status(200).json({
      success: true,
      message: delivery.sent
        ? "Verification code sent to your email. Please check your inbox."
        : "Could not send the verification email. Please contact the placement office.",
      emailSent: delivery.sent,
    });
  }
);

export const forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const { email, verificationCode } = req.body;
  const user = await User.findOne({ email: String(email).trim().toLowerCase() });

  if (!user) {
    return next(new ErrorHandler("User not found.", 404));
  }

  if (!verificationCode) {
    return next(new ErrorHandler("Verification code is required.", 400));
  }

  // A wrong code used to fall off the end of the function without responding,
  // so the request hung until the client gave up — and the UI's empty catch
  // block let the user proceed to set a new password regardless.
  if (user.verificationCode !== verificationCode) {
    return next(new ErrorHandler("That verification code is not correct.", 400));
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

  if (!newPassword || newPassword.length < 8) {
    return next(
      new ErrorHandler("Password must contain at least 8 characters.", 400)
    );
  }

  const user = await User.findOne({ email: String(email).trim().toLowerCase() });
  if (!user) {
    return next(new ErrorHandler("User not found.", 404));
  }

  if (!user.verificationCode || user.verificationCode !== verificationCode) {
    return next(new ErrorHandler("That verification code is not correct.", 400));
  }

  user.password = newPassword;
  // Burn the code so the same one cannot be replayed.
  user.verificationCode = null;
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
  await user.save();
  sendToken(user, 200, res, "Password updated successfully.");
});
