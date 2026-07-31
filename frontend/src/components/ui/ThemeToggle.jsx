import { FiMonitor, FiMoon, FiSun } from "react-icons/fi";
import { useTheme } from "../../lib/useTheme";
import { cn } from "../../lib/cn";

const OPTIONS = [
  { value: "light", label: "Light", Icon: FiSun },
  { value: "dark", label: "Dark", Icon: FiMoon },
  { value: "system", label: "System", Icon: FiMonitor },
];

/**
 * Three-way theme control.
 *
 * "System" is a first-class option rather than an implicit default, because a
 * user who has never touched the control should keep following their OS when
 * it changes at sunset — a two-way toggle silently pins them to whatever the
 * OS happened to be on their first visit.
 */
const ThemeToggle = ({ variant = "segmented", className }) => {
  const { mode, setMode, toggle, theme } = useTheme();

  if (variant === "icon") {
    const Icon = theme === "dark" ? FiSun : FiMoon;
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        className={cn(
          "grid size-10 place-items-center rounded-full text-[var(--text-secondary)]",
          "transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]",
          className
        )}
      >
        <Icon className="size-[18px]" />
      </button>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={cn(
        "inline-flex gap-0.5 rounded-[var(--radius-field)] bg-[var(--surface-hover)] p-1",
        className
      )}
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = mode === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setMode(value)}
            title={label}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-[calc(var(--radius-field)-3px)] px-2.5",
              "text-xs font-medium transition-colors",
              active
                ? "bg-[var(--surface-raised)] text-[var(--text-primary)] shadow-[var(--shadow-xs)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">{label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ThemeToggle;
