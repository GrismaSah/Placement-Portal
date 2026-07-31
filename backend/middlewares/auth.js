import { TPO } from "../models/tpoModel.js";
import { User } from "../models/userSchema.js";
import { catchAsyncErrors } from "./catchAsyncError.js";
import ErrorHandler from "./error.js";
import jwt from "jsonwebtoken";

/** Verify the cookie and return its payload, or null if it is absent/invalid. */
const decodeToken = (req) => {
  const { token } = req.cookies;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET_KEY);
  } catch {
    return null;
  }
};

export const isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const decoded = decodeToken(req);
  if (!decoded?.id) {
    return next(new ErrorHandler("User Not Authorized", 401));
  }

  const user = await User.findById(decoded.id).select("-password");

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

  const tpo = await TPO.findById(decoded.id).select("-password");
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

  const user = await User.findById(decoded.id).select("-password");
  if (user) {
    req.user = user;
    return next();
  }

  const tpo = await TPO.findById(decoded.id).select("-password");
  if (tpo) {
    tpo.role = "TPO";
    req.user = tpo;
    return next();
  }

  return next(new ErrorHandler("User Not Authorized", 401));
});
