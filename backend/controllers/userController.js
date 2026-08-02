import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { User } from "../models/userSchema.js";
import ErrorHandler from "../middlewares/error.js";
import { clearTokenCookie, sendToken } from "../utils/jwtToken.js";
import { TPO } from "../models/tpoModel.js";
import { sendVerificationCode } from "../utils/verifyEmail/email.js";
import { sentRegisteredEmail } from "../utils/registeredUser/register.js";
import { emitProfileUpdate } from "../socket.js";

export const register = catchAsyncErrors(async (req, res, next) => {
  const { name, email, phone, password, role, enrollment, address } = req.body;

  if (!name || !email || !phone || !password || !role || !address) {
    return next(new ErrorHandler("Please fill the complete form!"));
  }

  const isEmail = await User.findOne({ email });
  if (isEmail) {
    return next(new ErrorHandler("Email already registered!"));
  }
  const verificationCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString();
  const user = await User.create({
    name,
    email,
    phone,
    password,
    role,
    enrollment,
    address,
    verificationCode,
  });
  
  const delivery = await sendVerificationCode(email, verificationCode);

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
  // const user = await User.findOne({ email }).select("+password");
  const user = await User.findOne({ email });
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

  if (role === "TNP") {
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
    sendVerificationCode(email, verificationCode);
    user.verificationCode = verificationCode;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Verification code sent to your email. Please check your inbox.",
      user,
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
  // console.log(verificationCode, email);

  const user = await User.findOne({ email });
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
    const user = await User.findOne({ email });
    if (!user) {
      return next(new ErrorHandler("User not found.", 404));
    }
    user.verificationCode = verificationCode;
    await user.save();
    sendVerificationCode(email, verificationCode);
    res.status(200).json({
      success: true,
      message: "Verification code sent to your email. Please check your inbox.",
    });
  }
);

export const forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const { email, verificationCode } = req.body;
  const user = await User.findOne({ email });

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

  const user = await User.findOne({ email });
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
  // document, so a blind merge would let a student PUT {role:"TNP",
  // status:"Approved"} and promote themselves past the TPO approval flow.
  const { name, phone, address, enrollment } = req.body;

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (address !== undefined) user.address = address;
  // Enrolment only means anything for students.
  if (enrollment !== undefined && user.role === "Student") {
    user.enrollment = enrollment;
  }

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
  // console.log(oldPassword, newPassword);
  

  if (!oldPassword || !newPassword) {
    return next(new ErrorHandler("Old password and new password are required.", 400));
  }

  const user = await User.findById(req.user._id);

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
