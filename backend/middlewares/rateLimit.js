import rateLimit from "express-rate-limit";

/**
 * Throttles the endpoints that let someone guess a password or a 6-digit
 * verification code. Without this, nothing in the app stopped an unlimited
 * number of attempts against /login or /verify from the same caller.
 *
 * Keyed by IP, in-memory. That's enough for a single long-lived process —
 * it does NOT survive across separate serverless invocations, so on a
 * platform like Vercel this is a soft deterrent, not a hard guarantee. A
 * real guarantee needs a shared store (e.g. Redis) keyed the same way.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts. Please wait a few minutes and try again.",
  },
});
