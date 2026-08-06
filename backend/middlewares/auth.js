import { TPO } from "../models/tpoModel.js";
import { User } from "../models/userSchema.js";
import { catchAsyncErrors } from "./catchAsyncError.js";
import ErrorHandler from "./error.js";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

/** Verify the cookie and return its payload, or null if it is absent/invalid. */
const decodeToken = (req) => {
  const { token } = req.cookies;
  if (!token) return null;
  try {
    return jwt.verify(token, env("JWT_SECRET_KEY"));
  } catch {
    return null;
  }
};

export const isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const decoded = decodeToken(req);
  if (!decoded?.id) {
    return next(new ErrorHandler("User Not Authorized", 401));
  }

  const user = await User.findById(decoded.id).select("-password -verificationCode");

  // A token can be structurally valid and still reference a deleted account,
  // or belong to a TPO (who lives in a different collection). Previously
  // req.user was simply set to null and every downstream controller crashed
  // on `req.user.role` with a 500.
  if (!user) {
    return next(new ErrorHandler("User Not Authorized", 401));
  }

  req.user = user;
  next();
});

export const isAuthenticatedTPO = catchAsyncErrors(async (req, res, next) => {
  const decoded = decodeToken(req);
  if (!decoded?.id) {
    return next(new ErrorHandler("User Not Authorized", 401));
  }

  const tpo = await TPO.findById(decoded.id).select("-password -verificationCode");
  if (!tpo) {
    return next(new ErrorHandler("User Not Authorized", 401));
  }

  // The TPO schema has no `role` field; it is attached at request time so the
  // rest of the stack can treat all three roles uniformly.
  tpo.role = "TPO";
  req.user = tpo;
  next();
});

/**
 * Non-throwing counterpart to isAuthenticated, for "am I logged in?" checks.
 *
 * The frontend calls /getuser once on every page load — including the public
 * landing page, before any login has happened — just to find out whether a
 * session exists. That is a routine question with a yes/no answer, not an
 * access violation, but isAuthenticated answered it with a 401, so every
 * first visit and every logged-out reload logged a "Failed to load resource"
 * error in the browser console. req.user is simply null when there is no
 * valid session; the controller reports that as normal, successful data.
 */
export const attachUser = catchAsyncErrors(async (req, res, next) => {
  const decoded = decodeToken(req);
  req.user = decoded?.id
    ? await User.findById(decoded.id).select("-password -verificationCode")
    : null;
  next();
});

/** Non-throwing counterpart to isAuthenticatedTPO — see attachUser. */
export const attachTPO = catchAsyncErrors(async (req, res, next) => {
  const decoded = decodeToken(req);
  const tpo = decoded?.id
    ? await TPO.findById(decoded.id).select("-password -verificationCode")
    : null;
  if (tpo) tpo.role = "TPO";
  req.user = tpo;
  next();
});

/**
 * Accepts any of the three roles.
 *
 * Needed because students, recruiters and placement officers all use the
 * notification endpoints, but they are split across two collections — so
 * neither of the guards above can serve them on its own.
 */
export const isAuthenticatedAny = catchAsyncErrors(async (req, res, next) => {
  const decoded = decodeToken(req);
  if (!decoded?.id) {
    return next(new ErrorHandler("User Not Authorized", 401));
  }

  const user = await User.findById(decoded.id).select("-password -verificationCode");
  if (user) {
    req.user = user;
    return next();
  }

  const tpo = await TPO.findById(decoded.id).select("-password -verificationCode");
  if (tpo) {
    tpo.role = "TPO";
    req.user = tpo;
    return next();
  }

  return next(new ErrorHandler("User Not Authorized", 401));
});
