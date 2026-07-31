import mongoose from "mongoose";
import validator from "validator";
// bcryptjs rather than bcrypt: the latter is a native addon that has to be
// compiled for the target platform, which routinely fails on serverless
// builds. The hash formats are interchangeable, so existing passwords keep
// working unchanged.
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your Name!"],
    minLength: [3, "Name must contain at least 3 Characters!"],
    maxLength: [30, "Name cannot exceed 30 Characters!"],
  },
  email: {
    type: String,
    required: [true, "Please enter your Email!"],
    validate: [validator.isEmail, "Please provide a valid Email!"],
  },
  enrollment: {
    type: String,
  },
  address: {
    type: String,
    required: [true, "Please enter your Address!"],
  },
  phone: {
    type: Number,
    required: [true, "Please enter your Phone Number!"],
  },
  password: {
    type: String,
    required: [true, "Please provide a Password!"],
    minLength: [8, "Password must contain at least 8 characters!"],
    // maxLength: [32, "Password cannot exceed 32 characters!"],
    // select: false,
  },
  role: {
    type: String,
    required: [true, "Please select a role"],
    enum: ["Student", "TNP"],
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationCode: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Declined"],
    default: function () {
      return this.role === "TNP" ? "Pending" : undefined;
    },
    required: function () {
      return this.role === "TNP";
    },
  },

  /**
   * Academic profile (students only).
   *
   * The user record previously held name/email/phone/address/enrollment and
   * nothing else, and education lived as free text inside the resume document
   * — so nothing was filterable. Eligibility rules on a job and every
   * branch-wise figure on the placement dashboard need these as real fields.
   */
  branch: { type: String, trim: true },
  batch: { type: Number }, // graduating year, e.g. 2027
  cgpa: {
    type: Number,
    min: [0, "CGPA cannot be negative."],
    max: [10, "CGPA cannot exceed 10."],
  },
  backlogs: { type: Number, default: 0, min: 0 },

  placementStatus: {
    type: String,
    enum: ["Unplaced", "Placed", "Opted out"],
    default: "Unplaced",
  },

  // Company the student ultimately joined, denormalised from the placed
  // application so reporting does not have to re-derive it every query.
  placedAt: {
    company: { type: String },
    ctc: { type: Number },
    placedOn: { type: Date },
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Email uniqueness was only checked in the controller, which two concurrent
// registrations could both pass.
userSchema.index({ email: 1 }, { unique: true });

// Supports the placement dashboard's branch/batch breakdowns and the TNP
// approval queue.
userSchema.index({ role: 1, status: 1 });
userSchema.index({ role: 1, branch: 1, batch: 1 });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};



export const User = mongoose.model("User", userSchema);