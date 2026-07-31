import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/cn";

/**
 * Surface primitive. Everything that sits on the page background is a Card.
 *
 * `interactive` adds the lift-on-hover treatment — use it only when the whole
 * card is a link or button, never on a static panel, or the affordance lies.
 */
export const Card = forwardRef(function Card(
  { as, interactive = false, padded = true, className, children, to, ...rest },
  ref
) {
  const Component = to ? Link : as || "div";

  return (
    <Component
      ref={ref}
      to={to}
      className={cn(
        "surface-card",
        padded && "p-5 sm:p-6",
        interactive &&
          "transition-all duration-[var(--duration-base)] ease-[var(--ease-spring)] " +
            "hover:-translate-y-1 hover:border-[var(--brand)]/30 hover:shadow-[var(--shadow-lg)]",
        to && "block",
        className
      )}
      {...rest}
    >
      {children}
    </Component>
  );
});

export const CardHeader = ({ title, description, actions, className, children }) => (
  <div
    className={cn(
      "flex flex-wrap items-start justify-between gap-4",
      (children || description) && "mb-5",
      className
    )}
  >
    <div className="min-w-0">
      {title && (
        <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
          {title}
        </h2>
      )}
      {description && (
        <p className="mt-1 text-sm text-[var(--text-secondary)] text-balance-pretty">
          {description}
        </p>
      )}
      {children}
    </div>
    {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
  </div>
);

export const CardBody = ({ className, children }) => (
  <div className={cn("text-[0.9375rem] text-[var(--text-secondary)]", className)}>
    {children}
  </div>
);

export const CardFooter = ({ className, children }) => (
  <div
    className={cn(
      "mt-5 flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-4",
      className
    )}
  >
    {children}
  </div>
);

export default Card;
