import { Admin } from "../models/adminModel.js";
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

/**
 * A signature-valid token is not automatically a live session.
 *
 * The account bumps `tokenVersion` whenever its password changes, so a token
 * minted before that no longer matches and is refused here — which is what
 * turns "change my password" into "sign my other devices out". Without this a
 * stolen cookie stayed good for its full seven days no matter what the victim
 * did about it.
 *
 * `?? 0` on the token side is deliberate: tokens issued before this field
 * existed carry no `tv` at all, and treating those as version 0 lets sessions
 * that were live at deploy time survive rather than logging everyone out.
 */
const sessionIsCurrent = (decoded, account) =>
  (decoded?.tv ?? 0) === (account?.tokenVersion ?? 0);

export const isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const decoded = decodeToken(req);
  if (!decoded?.id) {
    return next(new ErrorHandler("User Not Authorized", 401));
  }

  const user = await User.findById(decoded.id).select("-password -verificationCode");

  // A token can be structurally valid and still reference a deleted account,
  // or belong to an Admin (who lives in a different collection). Previously
  // req.user was simply set to null and every downstream controller crashed
  // on `req.user.role` with a 500.
  if (!user || !sessionIsCurrent(decoded, user)) {
    return next(new ErrorHandler("User Not Authorized", 401));
  }

  req.user = user;
  next();
});

export const isAuthenticatedAdmin = catchAsyncErrors(async (req, res, next) => {
  const decoded = decodeToken(req);
  if (!decoded?.id) {
    return next(new ErrorHandler("User Not Authorized", 401));
  }

  const admin = await Admin.findById(decoded.id).select("-password -verificationCode");
  if (!admin || !sessionIsCurrent(decoded, admin)) {
    return next(new ErrorHandler("User Not Authorized", 401));
  }

  // The Admin schema has no `role` field; it is attached at request time so
  // the rest of the stack can treat all three roles uniformly.
  admin.role = "Admin";
  req.user = admin;
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
  const user = decoded?.id
    ? await User.findById(decoded.id).select("-password -verificationCode")
    : null;
  // A superseded token is "no session" here rather than an error, same as an
  // absent one — this route only answers "am I logged in?".
  req.user = user && sessionIsCurrent(decoded, user) ? user : null;
  next();
});

/** Non-throwing counterpart to isAuthenticatedAdmin — see attachUser. */
export const attachAdmin = catchAsyncErrors(async (req, res, next) => {
  const decoded = decodeToken(req);
  const found = decoded?.id
    ? await Admin.findById(decoded.id).select("-password -verificationCode")
    : null;
  const admin = found && sessionIsCurrent(decoded, found) ? found : null;
  if (admin) admin.role = "Admin";
  req.user = admin;
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
  if (user && sessionIsCurrent(decoded, user)) {
    req.user = user;
    return next();
  }

  const admin = await Admin.findById(decoded.id).select("-password -verificationCode");
  if (admin && sessionIsCurrent(decoded, admin)) {
    admin.role = "Admin";
    req.user = admin;
    return next();
  }

  return next(new ErrorHandler("User Not Authorized", 401));
});
