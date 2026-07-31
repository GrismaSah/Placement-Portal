import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/cn";

/**
 * The one button in the app.
 *
 * `primary` is gold on navy text — the single strongest signal on any screen,
 * so there should be at most one per view. Everything else steps down from it.
 * That restraint is the whole reason the brand reads as institutional rather
 * than as a generic SaaS dashboard.
 */

const BASE =
  "relative inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap " +
  "rounded-[var(--radius-field)] transition-all duration-[var(--duration-base)] " +
  "ease-[var(--ease-spring)] select-none " +
  "disabled:pointer-events-none disabled:opacity-50 " +
  "active:translate-y-px";

const VARIANTS = {
  primary:
    "bg-[var(--accent)] text-[var(--text-on-accent)] shadow-[var(--shadow-xs)] " +
    "hover:bg-[var(--accent-hover)] hover:shadow-[var(--shadow-accent)] hover:-translate-y-0.5 " +
    "active:bg-[var(--accent-active)] active:translate-y-0",

  secondary:
    "bg-[var(--brand)] text-[var(--text-on-brand)] shadow-[var(--shadow-xs)] " +
    "hover:bg-[var(--brand-hover)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 " +
    "active:bg-[var(--brand-active)] active:translate-y-0",

  outline:
    "border border-[var(--border-strong)] bg-[var(--surface-raised)] text-[var(--text-primary)] " +
    "hover:border-[var(--brand)] hover:bg-[var(--surface-hover)]",

  ghost:
    "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]",

  danger:
    "bg-[var(--color-danger-500)] text-white shadow-[var(--shadow-xs)] " +
    "hover:brightness-110 hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5",

  // For use on navy — the hero, the auth panel, the sidebar.
  inverse:
    "border border-white/20 bg-white/10 text-white backdrop-blur-sm " +
    "hover:border-white/40 hover:bg-white/20 focus-visible:outline-[var(--focus-ring-inverse)]",
};

const SIZES = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-[0.9375rem]",
  lg: "h-13 px-7 text-base",
  icon: "size-10 p-0",
};

const Spinner = () => (
  <svg
    className="size-4 animate-spin"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
    <path
      d="M12 2a10 10 0 0 1 10 10"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    />
  </svg>
);

const Button = forwardRef(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    disabled,
    fullWidth = false,
    leadingIcon,
    trailingIcon,
    className,
    children,
    to,
    href,
    type = "button",
    ...rest
  },
  ref
) {
  const classes = cn(
    BASE,
    VARIANTS[variant] ?? VARIANTS.primary,
    SIZES[size] ?? SIZES.md,
    fullWidth && "w-full",
    className
  );

  // Content is kept mounted and merely hidden while loading, so the button
  // does not change width mid-submit and shift the layout under the cursor.
  const content = (
    <>
      {loading && (
        <span className="absolute inset-0 grid place-items-center">
          <Spinner />
        </span>
      )}
      <span
        className={cn(
          "inline-flex items-center gap-2",
          loading && "invisible"
        )}
      >
        {leadingIcon}
        {children}
        {trailingIcon}
      </span>
    </>
  );

  if (to) {
    return (
      <Link ref={ref} to={to} className={classes} {...rest}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a
        ref={ref}
        href={href}
        className={classes}
        target="_blank"
        rel="noopener noreferrer"
        {...rest}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {content}
    </button>
  );
});

export default Button;
