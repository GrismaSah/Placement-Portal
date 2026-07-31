import { cn } from "../../lib/cn";

/**
 * Status pill.
 *
 * Every stage of the application pipeline gets a distinct hue AND a distinct
 * label — color is never the only carrier of meaning, which is what keeps the
 * status board readable for colour-blind users.
 */

const TONES = {
  neutral: "bg-[var(--surface-hover)] text-[var(--text-secondary)] border-[var(--border)]",
  brand: "bg-[var(--brand-subtle)] text-[var(--brand)] border-[var(--brand)]/20",
  accent: "bg-[var(--accent-subtle)] text-[var(--color-gold-700)] border-[var(--accent)]/30",
  success: "bg-[var(--color-success-50)] text-[var(--color-success-500)] border-[var(--color-success-500)]/20",
  warning: "bg-[var(--color-warning-50)] text-[var(--color-warning-500)] border-[var(--color-warning-500)]/20",
  danger: "bg-[var(--color-danger-50)] text-[var(--color-danger-500)] border-[var(--color-danger-500)]/20",
  info: "bg-[var(--color-info-50)] text-[var(--color-info-500)] border-[var(--color-info-500)]/20",
};

/**
 * The application lifecycle introduced in Phase 4. Ordered — index doubles as
 * pipeline position for the Stepper.
 */
export const APPLICATION_STAGES = [
  { value: "Applied", label: "Applied", tone: "neutral", color: "var(--color-stage-applied)" },
  { value: "Shortlisted", label: "Shortlisted", tone: "info", color: "var(--color-stage-shortlisted)" },
  { value: "Interview", label: "Interview", tone: "brand", color: "var(--color-stage-interview)" },
  { value: "Offered", label: "Offered", tone: "success", color: "var(--color-stage-offered)" },
  { value: "Placed", label: "Placed", tone: "accent", color: "var(--color-stage-placed)" },
];

export const TERMINAL_STAGES = [
  { value: "Rejected", label: "Not selected", tone: "danger", color: "var(--color-stage-rejected)" },
  { value: "Withdrawn", label: "Withdrawn", tone: "neutral", color: "var(--color-stage-withdrawn)" },
];

const ALL_STAGES = [...APPLICATION_STAGES, ...TERMINAL_STAGES];

export const stageMeta = (status) =>
  ALL_STAGES.find((s) => s.value === status) ?? {
    value: status,
    label: status || "Unknown",
    tone: "neutral",
    color: "var(--color-stage-applied)",
  };

const SIZES = {
  sm: "h-5.5 px-2 text-[0.6875rem]",
  md: "h-7 px-2.5 text-xs",
};

const Badge = ({ tone = "neutral", size = "md", dot = false, className, children }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full border font-semibold whitespace-nowrap",
      TONES[tone] ?? TONES.neutral,
      SIZES[size],
      className
    )}
  >
    {dot && <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />}
    {children}
  </span>
);

/** Convenience wrapper so screens never map status→tone by hand. */
export const StatusBadge = ({ status, size = "md" }) => {
  const meta = stageMeta(status);
  return (
    <Badge tone={meta.tone} size={size} dot>
      {meta.label}
    </Badge>
  );
};

export default Badge;
