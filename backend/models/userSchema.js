import mongoose from "mongoose";
import validator from "validator";
// bcryptjs rather than bcrypt: the latter is a native addon that has to be
// compiled for the target platform, which routinely fails on serverless
// builds. The hash formats are interchangeable, so existing passwords keep
// working unchanged.
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import {
  BCRYPT_COST,
  PASSWORD_MAX_BYTES,
  PASSWORD_MIN_LENGTH,
  passwordByteLength,
} from "../utils/passwordPolicy.js";


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
    // Without this, "Student@Jain.Test" and "student@jain.test" pass the
    // unique index as two different values — the index only rejects an
    // exact byte-for-byte repeat, not the same mailbox typed differently.
    lowercase: true,
    trim: true,
  },
  enrollment: {
    type: String,
    // Same reasoning as email: normalise here so "23btrcn001" and
    // "23BTRCN001" collide as the one enrollment number they actually are.
    uppercase: true,
    trim: true,
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
    minLength: [
      PASSWORD_MIN_LENGTH,
      `Password must contain at least ${PASSWORD_MIN_LENGTH} characters!`,
    ],
    // bcrypt truncates at 72 *bytes* and ignores the rest, so anything longer
    // is silently weaker than the user believes. Measured in bytes rather than
    // characters because a non-ASCII character costs more than one.
    validate: {
      validator: (v) => passwordByteLength(v) <= PASSWORD_MAX_BYTES,
      message: `Password cannot exceed ${PASSWORD_MAX_BYTES} bytes.`,
    },
    // Never loaded unless a query explicitly asks for it with
    // .select("+password"). Scrubbing on the way out is opt-in and one missed
    // path leaks the hash; this makes leaking it require a deliberate act.
    select: false,
  },
  role: {
    type: String,
    required: [true, "Please select a role"],
    enum: ["Student", "Recruiter"],
  },
  isVerified: {
    type: Boolean,
    default: false,
  },

  /**
   * Sign-in / reset code state. See utils/verificationCode.js for why all
   * three exist and why the code is stored as a keyed hash rather than the six
   * digits the user is emailed. `select: false` for the same reason as
   * `password` — use CODE_SELECT to opt in where a check genuinely needs them.
   */
  verificationCode: {
    type: String,
    default: null,
    select: false,
  },
  verificationCodeExpires: {
    type: Date,
    default: null,
    select: false,
  },
  verificationAttempts: {
    type: Number,
    default: 0,
    select: false,
  },

  /**
   * Bumped whenever the password changes. Every JWT carries the value that was
   * current when it was minted, and the auth guards reject a token whose value
   * no longer matches — which is what makes "change my password" actually end
   * sessions on other devices. Without it a stolen 7-day token survived the
   * one action a victim takes to recover.
   */
  tokenVersion: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Declined"],
    default: function () {
      return this.role === "Recruiter" ? "Pending" : undefined;
    },
    required: function () {
      return this.role === "Recruiter";
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

// Nothing previously stopped two accounts from sharing one enrollment
// number — two different emails could both register as "23BTRCN001". Partial
// (not a plain unique index) because `enrollment` only means anything for
// Student accounts; a Recruiter document has no enrollment field at all,
// and a plain unique index would treat every one of those missing values as
// a duplicate of each other after the first.
userSchema.index(
  { enrollment: 1 },
  { unique: true, partialFilterExpression: { role: "Student" } }
);

// Supports the placement dashboard's branch/batch breakdowns and the
// recruiter approval queue.
userSchema.index({ role: 1, status: 1 });
userSchema.index({ role: 1, branch: 1, batch: 1 });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, BCRYPT_COST);
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getJWTToken = function () {
  // Trimmed: a trailing newline on JWT_EXPIRE makes jsonwebtoken throw.
  // `tv` is the token version — see the field's note above. Kept short because
  // it rides in every request's cookie.
  return jwt.sign(
    { id: this._id, tv: this.tokenVersion ?? 0 },
    env("JWT_SECRET_KEY"),
    { expiresIn: env("JWT_EXPIRE", "7d") }
  );
};



export const User = mongoose.model("User", userSchema);