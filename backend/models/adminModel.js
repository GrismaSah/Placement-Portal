import mongoose from "mongoose";
// See userSchema.js — bcryptjs avoids a native build step on serverless.
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import validator from "validator";
import {
  BCRYPT_COST,
  PASSWORD_MAX_BYTES,
  PASSWORD_MIN_LENGTH,
  passwordByteLength,
} from "../utils/passwordPolicy.js";


const adminSchema = new mongoose.Schema(
  {
    firstname: { type: String, required: true, trim: true },
    lastname: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      validate: [validator.isEmail, "Please provide a valid Email!"],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    // Mirrors userSchema — see utils/verificationCode.js for the reasoning
    // behind the expiry, the attempt counter and the keyed hash.
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
    // See userSchema.tokenVersion — bumped on every password change so tokens
    // minted before it stop being accepted.
    tokenVersion: {
      type: Number,
      default: 0,
    },
    phone: { type: String, required: true, unique: true, trim: true },
    password: {
      type: String,
      required: true,
      minLength: [
        PASSWORD_MIN_LENGTH,
        `Password must contain at least ${PASSWORD_MIN_LENGTH} characters!`,
      ],
      // bcrypt ignores everything past 72 bytes — see passwordPolicy.js.
      validate: {
        validator: (v) => passwordByteLength(v) <= PASSWORD_MAX_BYTES,
        message: `Password cannot exceed ${PASSWORD_MAX_BYTES} bytes.`,
      },
      select: false,
    },
  },
  { timestamps: true }
);

adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, BCRYPT_COST);
  next();
});

// Compare password method
adminSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

adminSchema.methods.getJWTToken = function () {
  return jwt.sign(
    { id: this._id, tv: this.tokenVersion ?? 0 },
    env("JWT_SECRET_KEY"),
    { expiresIn: env("JWT_EXPIRE", "7d") }
  );
};


export const Admin = mongoose.model("Admin", adminSchema);
