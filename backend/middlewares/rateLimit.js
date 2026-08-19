import rateLimit from "express-rate-limit";
import { envInt } from "../config/env.js";

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
/**
 * One shared instance covers all twelve auth endpoints across both routers, so
 * the budget is spent by *any* auth traffic from an IP, not per endpoint. At
 * the old hardcoded 10, walking three roles through sign-in during a demo —
 * each of Recruiter and Admin costing two requests, one to mint a code and one
 * to submit it — left almost no headroom for a mistyped password, and everyone
 * behind a shared campus NAT counts as the same caller.
 *
 * 50 still stops credential stuffing (the codes are six digits, so a real
 * attack needs orders of magnitude more than this) while leaving room for
 * legitimate retries. Override with AUTH_RATE_LIMIT where the trade-off differs.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: envInt("AUTH_RATE_LIMIT", 50),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts. Please wait a few minutes and try again.",
  },
});
