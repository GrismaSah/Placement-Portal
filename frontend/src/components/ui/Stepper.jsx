import { FiCheck, FiX } from "react-icons/fi";
import { cn } from "../../lib/cn";
import { APPLICATION_STAGES, stageMeta } from "./Badge";

/**
 * Horizontal progress track for the application lifecycle.
 *
 * This is the single most important piece of UI in the student experience: the
 * old portal gave applicants no feedback whatsoever after submitting — the
 * application had no status field, so "did anyone look at this?" was
 * unanswerable. The stepper is the answer.
 *
 * `Rejected` and `Withdrawn` are terminal and render the track in a muted /
 * danger treatment rather than as a stage, because they can happen at any
 * point and are not a position on the path.
 */
const Stepper = ({ status, history = [], compact = false, className }) => {
  const isTerminal = status === "Rejected" || status === "Withdrawn";
  const currentIndex = APPLICATION_STAGES.findIndex((s) => s.value === status);

  // On a terminal status, fill up to the furthest stage actually reached so the
  // student can see how far the application got before it ended.
  const reachedIndex = isTerminal
    ? history.reduce((max, entry) => {
        const idx = APPLICATION_STAGES.findIndex((s) => s.value === entry.status);
        return idx > max ? idx : max;
      }, 0)
    : currentIndex;

  const terminal = isTerminal ? stageMeta(status) : null;

  return (
    <div className={cn("w-full", className)}>
      <ol
        className="flex items-center"
        aria-label={`Application progress: ${terminal?.label ?? status}`}
      >
        {APPLICATION_STAGES.map((stage, i) => {
          const isDone = i < reachedIndex;
          const isCurrent = !isTerminal && i === currentIndex;
          const isReached = i <= reachedIndex;
          const isLast = i === APPLICATION_STAGES.length - 1;

          return (
            <li
              key={stage.value}
              className={cn("flex items-center", !isLast && "flex-1")}
              aria-current={isCurrent ? "step" : undefined}
            >
              <div className="flex flex-col items-center gap-2">
                <span
                  className={cn(
                    "grid shrink-0 place-items-center rounded-full border-2 transition-all",
                    "duration-[var(--duration-slow)] ease-[var(--ease-spring)]",
                    compact ? "size-6" : "size-8",
                    isTerminal && isReached
                      ? "border-[var(--text-tertiary)] bg-[var(--surface-hover)] text-[var(--text-tertiary)]"
                      : isDone
                        ? "border-transparent bg-[var(--color-success-500)] text-white"
                        : isCurrent
                          ? "scale-110 border-[var(--accent)] bg-[var(--accent)] text-[var(--text-on-accent)] shadow-[var(--shadow-accent)]"
                          : "border-[var(--border-strong)] bg-[var(--surface-raised)] text-[var(--text-tertiary)]"
                  )}
                >
                  {isDone && !isTerminal ? (
                    <FiCheck className={compact ? "size-3" : "size-4"} aria-hidden="true" />
                  ) : (
                    <span className={cn("font-semibold", compact ? "text-[10px]" : "text-xs")}>
                      {i + 1}
                    </span>
                  )}
                </span>

                {!compact && (
                  <span
                    className={cn(
                      "text-center text-xs font-medium whitespace-nowrap",
                      isCurrent
                        ? "text-[var(--text-primary)]"
                        : "text-[var(--text-tertiary)]"
                    )}
                  >
                    {stage.label}
                  </span>
                )}
              </div>

              {!isLast && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "mx-1.5 h-0.5 flex-1 rounded-full transition-colors duration-[var(--duration-slow)]",
                    compact ? "-mt-0" : "-mt-6",
                    isDone && !isTerminal
                      ? "bg-[var(--color-success-500)]"
                      : "bg-[var(--border-strong)]"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>

      {isTerminal && (
        <p
          className={cn(
            "mt-4 flex items-center gap-2 rounded-[var(--radius-field)] px-3 py-2 text-sm font-medium",
            status === "Rejected"
              ? "bg-[var(--color-danger-50)] text-[var(--color-danger-500)]"
              : "bg-[var(--surface-hover)] text-[var(--text-secondary)]"
          )}
        >
          <FiX aria-hidden="true" className="size-4 shrink-0" />
          {status === "Rejected"
            ? "This application was not taken forward."
            : "You withdrew this application."}
        </p>
      )}
    </div>
  );
};

/**
 * Vertical timeline of the statusHistory array, newest first.
 * Shown under the stepper on the application detail view.
 */
export const StatusTimeline = ({ history = [], className }) => {
  if (!history.length) return null;

  const entries = [...history].reverse();

  return (
    <ol className={cn("space-y-4", className)}>
      {entries.map((entry, i) => {
        const meta = stageMeta(entry.status);
        return (
          <li key={`${entry.status}-${entry.changedAt ?? i}`} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                aria-hidden="true"
                className="mt-1.5 size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: meta.color }}
              />
              {i < entries.length - 1 && (
                <span aria-hidden="true" className="mt-1 w-px flex-1 bg-[var(--border)]" />
              )}
            </div>

            <div className="pb-1">
              <p className="text-sm font-medium text-[var(--text-primary)]">{meta.label}</p>
              {entry.changedAt && (
                <time
                  dateTime={entry.changedAt}
                  className="text-xs text-[var(--text-tertiary)]"
                >
                  {new Date(entry.changedAt).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </time>
              )}
              {entry.note && (
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{entry.note}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
};

export default Stepper;
