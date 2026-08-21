import bcrypt from "bcryptjs";
import ErrorHandler from "../middlewares/error.js";

export const PASSWORD_MIN_LENGTH = 8;

/**
 * bcrypt work factor.
 *
 * OWASP's floor for bcrypt is 10, so the previous value was not wrong — but 12
 * is the current practical default, costing roughly a quarter-second per hash
 * on 2026-era hardware, which is the target OWASP actually describes. The cost
 * is stored inside each hash, so raising it is backward compatible: existing
 * cost-10 hashes keep verifying, and are re-hashed at 12 the next time that
 * account sets a password.
 */
export const BCRYPT_COST = 12;

/**
 * bcrypt hashes at most the first 72 *bytes* of input and silently discards
 * the rest, so without an explicit ceiling a user with a long passphrase gets
 * far less security than they think they are choosing, and two passwords that
 * differ only past byte 72 are the same password. Bytes, not characters:
 * non-ASCII costs more than one byte each, so `String.length` is the wrong
 * measure here.
 */
export const PASSWORD_MAX_BYTES = 72;

export const passwordByteLength = (password) =>
  Buffer.byteLength(String(password ?? ""), "utf8");

/**
 * Throws an ErrorHandler unless the password is acceptable.
 *
 * Deliberately duplicated at the controller layer rather than left to the
 * schema validators alone. The schema does enforce this — validation runs on
 * the plaintext, before the pre-save hook replaces it with a hash — but that
 * ordering is an implementation detail of Mongoose's middleware, and a rule
 * this important should not be one refactor away from silently validating a
 * 60-character bcrypt digest instead of the password the user typed.
 */
export const assertPasswordPolicy = (password) => {
  if (!password || String(password).length < PASSWORD_MIN_LENGTH) {
    throw new ErrorHandler(
      `Password must contain at least ${PASSWORD_MIN_LENGTH} characters.`,
      400
    );
  }
  if (passwordByteLength(password) > PASSWORD_MAX_BYTES) {
    throw new ErrorHandler(
      `Password cannot exceed ${PASSWORD_MAX_BYTES} bytes.`,
      400
    );
  }
};

/**
 * A real bcrypt hash of a value nobody has, at the same cost factor the app
 * uses, so that comparing against it costs the same as a genuine check.
 *
 * Login used to return as soon as the email missed, before any hashing
 * happened — so "no such account" answered in a couple of milliseconds while
 * "wrong password" took the full bcrypt work factor. That difference is
 * measurable over a network and enumerates accounts even once the error
 * *messages* are identical. Burning the same work on a miss closes that gap.
 *
 * Hardcoded rather than generated at boot: hashing at cost 12 takes roughly a
 * quarter of a second, and paying that during a serverless cold start would
 * make the very first login of each instance the slow one — reintroducing a
 * timing signal at exactly the moment it is easiest to observe. The value is
 * not a secret; it is a hash of a published dummy string.
 */
const DECOY_HASH = "$2b$12$I564QA9KhAnyJ..1X7C5pObnDgSNBR6Edu50Init25/HY1nFQ/HUy";

export const burnPasswordComparison = async (password) => {
  await bcrypt.compare(String(password ?? ""), DECOY_HASH);
};
