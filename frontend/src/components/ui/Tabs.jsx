import { useRef } from "react";
import { cn } from "../../lib/cn";

/**
 * Tabs with full keyboard support (arrows, Home, End) per the WAI-ARIA
 * tabs pattern. Roving tabindex — only the active tab is in the tab order, so
 * Tab moves past the whole strip rather than through every option.
 *
 * items: [{ value, label, count?, icon? }]
 */
const Tabs = ({ items, value, onChange, variant = "underline", className, ariaLabel }) => {
  const refs = useRef([]);

  const onKeyDown = (e) => {
    const i = items.findIndex((item) => item.value === value);
    let next = null;

    if (e.key === "ArrowRight") next = (i + 1) % items.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + items.length) % items.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    else return;

    e.preventDefault();
    onChange(items[next].value);
    refs.current[next]?.focus();
  };

  const isPill = variant === "pill";

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className={cn(
        "flex gap-1 overflow-x-auto",
        isPill
          ? "rounded-[var(--radius-field)] bg-[var(--surface-hover)] p-1"
          : "border-b border-[var(--border)]",
        className
      )}
    >
      {items.map((item, i) => {
        const active = item.value === value;

        return (
          <button
            key={item.value}
            ref={(el) => (refs.current[i] = el)}
            role="tab"
            type="button"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.value)}
            className={cn(
              "relative inline-flex shrink-0 items-center gap-2 px-4 text-sm font-medium",
              "transition-colors duration-[var(--duration-fast)] whitespace-nowrap",
              isPill
                ? cn(
                    "h-9 rounded-[calc(var(--radius-field)-2px)]",
                    active
                      ? "bg-[var(--surface-raised)] text-[var(--text-primary)] shadow-[var(--shadow-xs)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  )
                : cn(
                    "h-11 border-b-2 -mb-px",
                    active
                      ? "border-[var(--accent)] text-[var(--text-primary)]"
                      : "border-transparent text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                  )
            )}
          >
            {item.icon}
            {item.label}

            {item.count != null && (
              <span
                data-numeric
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[0.6875rem] font-semibold",
                  active
                    ? "bg-[var(--brand)] text-[var(--text-on-brand)]"
                    : "bg-[var(--surface-active)] text-[var(--text-secondary)]"
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
