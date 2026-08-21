/**
 * Initials-based avatar helpers.
 *
 * No image hosting involved: the avatar is derived entirely from the user's own
 * name, so it is always available, always current, and needs no upload.
 */

/** The user's display name, whichever model they came from. */
export const displayName = (user) => {
  if (!user) return "";
  if (user.name) return user.name;
  // Admin records use firstname/lastname rather than a single name field.
  return [user.firstname, user.lastname].filter(Boolean).join(" ");
};

/** Up to two initials, e.g. "Test Student" -> "TS", "Cher" -> "C". */
export const initials = (user) => {
  const parts = displayName(user).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Deterministic hue from the name, so a given user keeps the same colour across
 * reloads and devices without storing anything.
 */
export const avatarHue = (user) => {
  const name = displayName(user);
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0; // keep it a 32-bit int
  }
  return Math.abs(hash) % 360;
};

/** Inline background/foreground for an avatar circle. */
export const avatarColors = (user) => {
  const hue = avatarHue(user);
  return {
    background: `linear-gradient(135deg, hsl(${hue} 45% 38%), hsl(${
      (hue + 25) % 360
    } 42% 28%))`,
    color: "#ffffff",
  };
};

// A second `roleLabel` used to live here — same Student/Recruiter/Admin
// mapping as lib/roles.js, written as an if/else chain, with no importers.
// Two copies of the role vocabulary in two modules is a trap: renaming a role
// would have been applied to whichever one the author found first. The live
// one is `roleLabel` in lib/roles.js; this file is about avatars only.
