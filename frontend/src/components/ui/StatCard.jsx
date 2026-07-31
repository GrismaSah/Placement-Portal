import { useEffect, useRef, useState } from "react";
import { cn } from "../../lib/cn";

/**
 * Counts from 0 to `value` once, when the element first scrolls into view.
 *
 * Deliberately fires only once — a number that re-animates every time you
 * scroll past it is a distraction, not a delight. Respects reduced motion by
 * jumping straight to the final value.
 */
export function useCountUp(value, { duration = 1100, enabled = true } = {}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const hasRun = useRef(false);

  useEffect(() => {
    const node = ref.current;
    const target = Number(value) || 0;

    const prefersReduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (!enabled || !node || prefersReduced) {
      setDisplay(target);
      return;
    }

    // Stat tiles mount with 0 and receive the real figure once the request
    // lands. Without this the "animate once" guard fired against that initial
    // 0, marked itself done, and the tile stayed on 0 forever.
    if (target === 0) return;
    hasRun.current = false;

    let frame = null;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || hasRun.current) return;
        hasRun.current = true;
        observer.disconnect();

        const start = performance.now();

        const tick = (now) => {
          const t = Math.min((now - start) / duration, 1);
          // easeOutExpo — fast start, long settle, which reads as "counting up"
          // rather than "sliding to a stop".
          const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
          setDisplay(Math.round(target * eased));
          if (t < 1) frame = requestAnimationFrame(tick);
        };

        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.35 }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [value, duration, enabled]);

  return { ref, display };
}

/**
 * Headline metric tile. Used on all three dashboards and the landing stat band.
 */
const StatCard = ({
  label,
  value,
  suffix,
  prefix,
  icon,
  hint,
  trend,
  tone = "default",
  animate = true,
  className,
}) => {
  const { ref, display } = useCountUp(value, { enabled: animate && Number.isFinite(Number(value)) });
  const isNumeric = Number.isFinite(Number(value));

  const tones = {
    default: "",
    brand: "bg-brand-gradient text-white border-transparent",
    accent: "border-[var(--accent)]/30 bg-[var(--accent-subtle)]",
  };

  const onBrand = tone === "brand";

  return (
    <div
      ref={ref}
      className={cn("surface-card p-5", tones[tone], className)}
    >
      <div className="flex items-start justify-between gap-3">
        <p
          className={cn(
            "text-sm font-medium",
            onBrand ? "text-white/70" : "text-[var(--text-secondary)]"
          )}
        >
          {label}
        </p>

        {icon && (
          <span
            aria-hidden="true"
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-xl [&>svg]:size-[18px]",
              onBrand
                ? "bg-white/10 text-[var(--color-gold-400)]"
                : "bg-[var(--brand-subtle)] text-[var(--brand)]"
            )}
          >
            {icon}
          </span>
        )}
      </div>

      <p
        data-numeric
        className={cn(
          "mt-3 text-3xl font-bold tracking-tight",
          onBrand ? "text-white" : "text-[var(--text-primary)]"
        )}
      >
        {prefix}
        {isNumeric ? display.toLocaleString("en-IN") : value}
        {suffix}
      </p>

      {(hint || trend) && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={cn(
                "font-semibold",
                trend.direction === "up"
                  ? "text-[var(--color-success-500)]"
                  : "text-[var(--color-danger-500)]"
              )}
            >
              {trend.direction === "up" ? "↑" : "↓"} {trend.value}
            </span>
          )}
          {hint && (
            <span className={onBrand ? "text-white/60" : "text-[var(--text-tertiary)]"}>
              {hint}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;
