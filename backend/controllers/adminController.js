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

export const registerAdmin = catchAsyncErrors(async (req, res, next) => {
    const { firstname, lastname, email, phone, password } = req.body;


  if (!firstname || !lastname || !email || !phone || !password ) {
    return next(new ErrorHandler("Please fill all required fields!"));
  }

  const isEmail = await Admin.findOne({ email });
  if (isEmail) {
    return next(new ErrorHandler("Email already registered!"));
  }
  const verificationCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString();
  const admin = await Admin.create({
    firstname,
    lastname,
    email,
    phone,
    password,
    verificationCode,
  });
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
  const { email, password, verificationCode } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Please provide email and password."));
  }

  const admin = await Admin.findOne({ email }).select("+password");
  if (!admin) {
    return next(new ErrorHandler("Invalid Email.", 400));
  }
  // The truthiness guard is load-bearing: a successful login nulls the stored
  // code, so without it a caller sending "verificationCode": null satisfies
  // null !== null and skips the second factor entirely.
  if (!verificationCode || admin.verificationCode !== verificationCode) {
    return next(new ErrorHandler("Invalid verification code.", 400));
  }

  const isPasswordMatched = await admin.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid Password.", 400));
  }
  if(admin.isVerified === false) {
    sentRegisteredEmail(admin);

  }
  admin.verificationCode = null;
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


  // verification code controller
export const verifyUserAdmin = catchAsyncErrors(async (req, res, next) => {
  const { verificationCode, email } = req.body;

  const user = await Admin.findOne({ email });
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
export const generateVerificationCodeAdmin = catchAsyncErrors(
  async (req, res, next) => {
    const { email } = req.body;

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const user = await Admin.findOne({ email });
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

export const forgotPasswordAdmin = catchAsyncErrors(async (req, res, next) => {
  const { email, verificationCode } = req.body;
  const user = await Admin.findOne({ email });

  if (!user) {
    return next(new ErrorHandler("User not found.", 404));
  }

  if (!verificationCode) {
    return next(new ErrorHandler("Verification code is required.", 400));
  }

  // A wrong code used to fall off the end of the function without ever
  // responding, so the request hung until the client timed out — and the UI,
  // whose catch block was empty, advanced to the next step anyway.
  if (user.verificationCode !== verificationCode) {
    return next(new ErrorHandler("That verification code is not correct.", 400));
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

  if (!newPassword || newPassword.length < 8) {
    return next(
      new ErrorHandler("Password must contain at least 8 characters.", 400)
    );
  }

  const user = await Admin.findOne({ email });
  if (!user) {
    return next(new ErrorHandler("User not found.", 404));
  }

  if (!user.verificationCode || user.verificationCode !== verificationCode) {
    return next(new ErrorHandler("That verification code is not correct.", 400));
  }

  user.password = newPassword;
  // Burn the code so it cannot be replayed to reset the password again.
  user.verificationCode = null;
  await user.save();

  // sendToken already writes the cookie and sends a JSON body; the second
  // res.json that used to follow it threw ERR_HTTP_HEADERS_SENT every time.
  sendToken(user, 200, res, "Password updated successfully.");
});

export const updatePasswordAdmin = catchAsyncErrors(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  const user = await Admin.findById(req.user._id).select("+password");
  if (!user) {
    return next(new ErrorHandler("User not found.", 404));
  }
  const isPasswordMatched = await user.comparePassword(oldPassword);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Old password is incorrect.", 400));
  }
  user.password = newPassword;
  await user.save();
  sendToken(user, 201, res, "Password updated successfully.");
});
