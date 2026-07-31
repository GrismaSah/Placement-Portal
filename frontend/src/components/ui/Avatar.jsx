import { avatarColors, displayName, initials } from "../../utils/avatar";
import { cn } from "../../lib/cn";

/**
 * Initials avatar.
 *
 * Ports the existing Layout/Avatar — the deterministic name→hue hash in
 * utils/avatar.js is genuinely good (same user, same colour, everywhere, with
 * nothing stored and no image hosting) and is kept as-is.
 */
const Avatar = ({ user, size = 40, className, ring = false }) => {
  const name = displayName(user);

  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full font-semibold select-none",
        ring && "ring-2 ring-[var(--surface-raised)]",
        className
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(11, size * 0.38),
        ...avatarColors(user),
      }}
      title={name || undefined}
      aria-hidden="true"
    >
      {initials(user)}
    </span>
  );
};

/** Overlapping stack, e.g. "who else applied". Caps at `max` then shows +N. */
export const AvatarGroup = ({ users = [], max = 4, size = 32 }) => {
  const shown = users.slice(0, max);
  const overflow = users.length - shown.length;

  return (
    <div className="flex items-center">
      {shown.map((u, i) => (
        <Avatar
          key={u._id ?? i}
          user={u}
          size={size}
          ring
          className={i > 0 ? "-ml-2.5" : undefined}
        />
      ))}

      {overflow > 0 && (
        <span
          data-numeric
          className="-ml-2.5 inline-grid place-items-center rounded-full bg-[var(--surface-active)] font-semibold text-[var(--text-secondary)] ring-2 ring-[var(--surface-raised)]"
          style={{ width: size, height: size, fontSize: Math.max(10, size * 0.34) }}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
};

export default Avatar;
