export const sendToken = (user, statusCode, res, message) => {
  const token = user.getJWTToken();
  const isProduction = process.env.NODE_ENV === "production";

  const options = {
    expires: new Date(
      Date.now() + (Number(process.env.COOKIE_EXPIRE) || 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    // Required over HTTPS. Without it the cookie is set but never sent back,
    // so a deployed user appears to log in and is immediately anonymous again.
    secure: isProduction,
    // The frontend and API share an origin in production, so "lax" is both
    // sufficient and safer than "none" — it keeps the cookie off cross-site
    // requests, which is a meaningful CSRF mitigation given there is no CSRF
    // token in this codebase.
    sameSite: "lax",
    path: "/",
  };

  // `token` is also returned in the body only for local debugging; the cookie
  // is what actually authenticates every request.
  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    user,
    message,
    token,
  });
};

/** Clear the auth cookie using flags that match how it was set. */
export const clearTokenCookie = (res) => {
  const isProduction = process.env.NODE_ENV === "production";
  return res.cookie("token", "", {
    expires: new Date(0),
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
  });
};
