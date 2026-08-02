/**
 * Environment variable access, with whitespace trimmed.
 *
 * Values set through a shell pipe frequently arrive with a trailing newline —
 * `"7d\r\n"` instead of `"7d"`. That is invisible in every dashboard and log,
 * but it breaks exact comparisons and strict parsers:
 *
 *   - jsonwebtoken rejects `expiresIn: "7d\r\n"` outright, so every login and
 *     verification returned a 500.
 *   - `NODE_ENV === "production"` silently evaluated false, which turned off
 *     the `secure` flag on the auth cookie in production.
 *
 * Reading everything through here means a stray newline can never cause
 * either class of failure again.
 */

export const env = (name, fallback = undefined) => {
  const raw = process.env[name];
  if (raw == null) return fallback;
  const trimmed = String(raw).trim();
  return trimmed === "" ? fallback : trimmed;
};

export const envInt = (name, fallback) => {
  const n = Number(env(name));
  return Number.isFinite(n) ? n : fallback;
};

export const isProduction = () => env("NODE_ENV") === "production";
