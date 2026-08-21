import { envInt, isProduction } from "../config/env.js";

/**
 * Strip everything a client must never receive.
 *
 * `sendToken` is used by login, verification and password reset, and it was
 * serialising the whole Mongoose document — so every one of those responses
 * carried the account's bcrypt hash and its live verification code. The hash
 * is offline-crackable, and the code is the second factor for recruiter and
 * officer sign-in, which made returning it self-defeating.
 */
export const publicUser = (user) => {
  const plain = typeof user?.toObject === "function" ? user.toObject() : { ...user };
  delete plain.password;
  delete plain.verificationCode;
  delete plain.verificationCodeExpires;
  delete plain.verificationAttempts;
  // Not secret, but it is internal session bookkeeping the client has no use
  // for, and publishing it advertises exactly which value to forge.
  delete plain.tokenVersion;
  delete plain.__v;
  return plain;
};

export const sendToken = (user, statusCode, res, message) => {
  const token = user.getJWTToken();
  const production = isProduction();

  const options = {
    expires: new Date(
      Date.now() + envInt("COOKIE_EXPIRE", 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    // Required over HTTPS. Without it the cookie is set but never sent back,
    // so a deployed user appears to log in and is immediately anonymous again.
    secure: production,
    // The frontend and API share an origin in production, so "lax" is both
    // sufficient and safer than "none" — it keeps the cookie off cross-site
    // requests, which is a meaningful CSRF mitigation given there is no CSRF
    // token in this codebase.
    sameSite: "lax",
    path: "/",
  };

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    user: publicUser(user),
    message,
    // The httpOnly cookie is what authenticates requests. The raw token is
    // echoed only outside production, where it is useful for curl-based
    // debugging; shipping it in the body lets any XSS lift a 7-day
    // credential that the httpOnly flag otherwise protects.
    ...(production ? {} : { token }),
  });
};

/** Clear the auth cookie using flags that match how it was set. */
export const clearTokenCookie = (res) => {
  const production = isProduction();
  return res.cookie("token", "", {
    expires: new Date(0),
    httpOnly: true,
    secure: production,
    sameSite: "lax",
    path: "/",
  });
};
