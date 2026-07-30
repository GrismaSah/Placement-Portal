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
  // TPO records use firstname/lastname rather than a single name field.
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

/** Human label for a role, including the TNP/TPO naming that confuses everyone. */
export const roleLabel = (role) => {
  if (role === "TNP") return "Recruiter (TNP)";
  if (role === "TPO") return "Placement Officer (TPO)";
  if (role === "Student") return "Student";
  return role || "";
};
