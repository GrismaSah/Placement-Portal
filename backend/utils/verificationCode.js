import crypto from "crypto";
import { env } from "../config/env.js";

/**
 * Six-digit verification codes — generation, storage and checking.
 *
 * This code is the *only* proof of ownership in the password-reset flow and
 * the second factor for Recruiter and Admin sign-in, so all three of the
 * properties below matter. Every mint and every check in both controllers goes
 * through this module; previously each of the seven sites rolled its own.
 *
 * 1. UNPREDICTABLE. The codes used to come from `Math.random()`, which V8
 *    implements as xorshift128+ — a non-cryptographic PRNG whose internal
 *    state can be solved for from a handful of observed outputs. Because
 *    POST /generate-code is unauthenticated, an attacker could mint codes for
 *    an address they control as often as they liked to collect those samples,
 *    then predict the next code issued for someone else's account.
 *
 * 2. SHORT-LIVED AND ATTEMPT-CAPPED. A six-digit code carries only ~20 bits of
 *    entropy. NIST SP 800-63B permits that length only where the verifier
 *    limits failed attempts; OWASP requires reset codes be single-use and
 *    expire. Neither held here: there was no expiry field at all, so a code
 *    minted at registration stayed valid indefinitely, and the only throttle
 *    was 50 requests per IP per 15 minutes held in memory — which on Vercel is
 *    not shared between serverless invocations and so bounds nothing. The
 *    attempt counter below lives in MongoDB, which is why it actually holds.
 *
 * 3. NOT READABLE FROM THE DATABASE ALONE. Stored as a keyed hash rather than
 *    plaintext. Note *keyed*: a bare SHA-256 of a six-digit code is exhausted
 *    in well under a second, so a plain digest would be decoration. Keying
 *    with the app secret means a database-only compromise cannot recover or
 *    verify a code without also stealing that secret.
 */

export const CODE_TTL_MS = 10 * 60 * 1000;
export const MAX_CODE_ATTEMPTS = 5;

/**
 * The three code fields are `select: false`, so any query that needs to check
 * a code must ask for them by name. Exported as one constant so a new call
 * site cannot half-remember the list.
 */
export const CODE_SELECT =
  "+verificationCode +verificationCodeExpires +verificationAttempts";

/** Uniform over 100000-999999. randomInt's upper bound is exclusive. */
export const generateCode = () => String(crypto.randomInt(100000, 1000000));

export const hashCode = (code) =>
  crypto
    .createHmac("sha256", env("JWT_SECRET_KEY"))
    .update(String(code))
    .digest("hex");

/** Constant-time, so a wrong code cannot be narrowed a byte at a time. */
const codeMatches = (plain, stored) => {
  if (!plain || !stored) return false;
  const a = Buffer.from(hashCode(plain), "utf8");
  const b = Buffer.from(String(stored), "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

/** Mint a code onto `doc` and return the plaintext — for the email, only. */
export const issueCode = (doc) => {
  const code = generateCode();
  doc.verificationCode = hashCode(code);
  doc.verificationCodeExpires = new Date(Date.now() + CODE_TTL_MS);
  doc.verificationAttempts = 0;
  return code;
};

export const clearCode = (doc) => {
  doc.verificationCode = null;
  doc.verificationCodeExpires = null;
  doc.verificationAttempts = 0;
};

/**
 * True only for a live, unexpired, non-exhausted, matching code.
 *
 * Saves `doc` itself rather than leaving that to the caller. The failure paths
 * are the ones that must persist — an attempt counter the caller forgets to
 * write is a counter that never counts — and every caller here returns through
 * `next(err)` on failure, where a missed save would be silent.
 *
 * A spent, expired or exhausted code is cleared outright, so the user has to
 * request a fresh one instead of grinding the same guess space.
 *
 * `consume: false` validates without burning the code. The reset flow checks
 * the same code twice — once to move the user to the "choose a new password"
 * step, then again when that password is submitted — so the first check must
 * leave it usable. A wrong guess still costs an attempt either way.
 */
export const checkCode = async (doc, plain, { consume = true } = {}) => {
  if (!doc.verificationCode || !doc.verificationCodeExpires) return false;

  if (doc.verificationCodeExpires.getTime() < Date.now()) {
    clearCode(doc);
    await doc.save();
    return false;
  }

  if ((doc.verificationAttempts ?? 0) >= MAX_CODE_ATTEMPTS) {
    clearCode(doc);
    await doc.save();
    return false;
  }

  if (!codeMatches(plain, doc.verificationCode)) {
    doc.verificationAttempts = (doc.verificationAttempts ?? 0) + 1;
    // Kill it the moment the budget is spent rather than on the next request
    // to touch it, so a burnt code is never left sitting in a guessable state.
    if (doc.verificationAttempts >= MAX_CODE_ATTEMPTS) clearCode(doc);
    await doc.save();
    return false;
  }

  if (consume) {
    clearCode(doc);
    await doc.save();
  }
  return true;
};
