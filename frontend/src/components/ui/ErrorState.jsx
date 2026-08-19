import { FiAlertTriangle, FiRefreshCw } from "react-icons/fi";
import { cn } from "../../lib/cn";
import { apiError } from "../../lib/api";
import Button from "./Button";

/**
 * The "we could not load this" state — the sibling EmptyState was missing.
 *
 * EmptyState deliberately means "genuinely nothing here", so screens that
 * rendered it on a failed request told the user a falsehood: a recruiter with
 * twenty live postings was shown "no postings yet", and the placement office
 * was shown a 0% placement rate as fact during an outage. Wrong information is
 * worse than an error message, and it is worse in the specific way that
 * matters here — it looks like a working product with no data in it.
 *
 * `useQuery` has always returned `error`; almost nothing read it.
 *
 * The retry button matters as much as the message. A failed fetch is usually
 * transient, and without it the only recovery is a full page reload, which
 * also throws away the cache for every other screen.
 */
const ErrorState = ({
  title = "Couldn't load this",
  description,
  error,
  onRetry,
  tone = "default",
  className,
}) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center px-6 py-14 text-center",
      tone === "card" && "surface-card",
      className
    )}
    role="alert"
  >
    <div
      aria-hidden="true"
      className="mb-5 grid size-14 place-items-center rounded-2xl bg-[var(--brand-subtle)] text-[var(--color-danger-500)] [&>svg]:size-6"
    >
      <FiAlertTriangle />
    </div>

    <h3 className="text-base font-semibold text-[var(--text-primary)]">{title}</h3>

    <p className="mt-2 max-w-sm text-sm text-[var(--text-secondary)] text-balance-pretty">
      {description ?? apiError(error, "Please check your connection and try again.")}
    </p>

    {onRetry && (
      <div className="mt-6">
        <Button size="sm" variant="secondary" onClick={onRetry}>
          <FiRefreshCw aria-hidden="true" />
          Try again
        </Button>
      </div>
    )}
  </div>
);

export default ErrorState;
