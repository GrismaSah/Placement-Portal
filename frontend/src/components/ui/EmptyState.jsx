import { cn } from "../../lib/cn";
import Button from "./Button";

/**
 * The "nothing here" state.
 *
 * Every list in the app gets one. An empty result set is a normal outcome, not
 * an error — the old portal rendered a bare blank area for no jobs and the
 * backend even returned 404 for an empty recruiter approval queue, which forced the
 * happy path through an error handler.
 *
 * Each one should say what happened, why, and what to do next.
 */
const EmptyState = ({
  icon,
  title,
  description,
  action,
  actionTo,
  onAction,
  secondaryAction,
  tone = "default",
  className,
}) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center px-6 py-14 text-center",
      tone === "card" && "surface-card",
      className
    )}
  >
    {icon && (
      <div
        aria-hidden="true"
        className="mb-5 grid size-14 place-items-center rounded-2xl bg-[var(--brand-subtle)] text-[var(--brand)] [&>svg]:size-6"
      >
        {icon}
      </div>
    )}

    <h3 className="text-base font-semibold text-[var(--text-primary)]">{title}</h3>

    {description && (
      <p className="mt-2 max-w-sm text-sm text-[var(--text-secondary)] text-balance-pretty">
        {description}
      </p>
    )}

    {(action || secondaryAction) && (
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {action && (
          <Button to={actionTo} onClick={onAction} size="sm">
            {action}
          </Button>
        )}
        {secondaryAction}
      </div>
    )}
  </div>
);

export default EmptyState;
