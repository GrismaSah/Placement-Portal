/**
 * Conditional className joiner.
 *
 * A ~15-line local implementation instead of pulling in `clsx` — this is the
 * whole of that library's useful surface and the app has enough dependencies.
 *
 *   cn("btn", isActive && "btn--active", { "btn--lg": size === "lg" })
 */
export function cn(...args) {
  const out = [];

  for (const arg of args) {
    if (!arg) continue;

    if (typeof arg === "string" || typeof arg === "number") {
      out.push(arg);
    } else if (Array.isArray(arg)) {
      const nested = cn(...arg);
      if (nested) out.push(nested);
    } else if (typeof arg === "object") {
      for (const key in arg) {
        if (arg[key]) out.push(key);
      }
    }
  }

  return out.join(" ");
}

export default cn;
