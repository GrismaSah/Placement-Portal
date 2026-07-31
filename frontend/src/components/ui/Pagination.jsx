import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { cn } from "../../lib/cn";

/**
 * Page control with ellipsis truncation.
 *
 * Always renders first and last so the user can jump to the end of a long
 * result set, and keeps a fixed number of slots so the row does not reflow
 * as they page through.
 */
function pageList(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  if (current <= 4) return [1, 2, 3, 4, 5, "…", total];
  if (current >= total - 3)
    return [1, "…", total - 4, total - 3, total - 2, total - 1, total];

  return [1, "…", current - 1, current, current + 1, "…", total];
}

const Pagination = ({ page, totalPages, onChange, className }) => {
  if (!totalPages || totalPages <= 1) return null;

  const slotClass =
    "grid size-9 place-items-center rounded-[var(--radius-field)] text-sm font-medium " +
    "transition-colors duration-[var(--duration-fast)]";

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center justify-center gap-1.5", className)}
    >
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className={cn(
          slotClass,
          "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]",
          "disabled:pointer-events-none disabled:opacity-40"
        )}
      >
        <FiChevronLeft className="size-4" />
      </button>

      {pageList(page, totalPages).map((slot, i) =>
        slot === "…" ? (
          <span
            key={`gap-${i}`}
            aria-hidden="true"
            className="grid size-9 place-items-center text-sm text-[var(--text-tertiary)]"
          >
            …
          </span>
        ) : (
          <button
            key={slot}
            type="button"
            onClick={() => onChange(slot)}
            aria-label={`Page ${slot}`}
            aria-current={slot === page ? "page" : undefined}
            data-numeric
            className={cn(
              slotClass,
              slot === page
                ? "bg-[var(--brand)] text-[var(--text-on-brand)] shadow-[var(--shadow-xs)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
            )}
          >
            {slot}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        className={cn(
          slotClass,
          "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]",
          "disabled:pointer-events-none disabled:opacity-40"
        )}
      >
        <FiChevronRight className="size-4" />
      </button>
    </nav>
  );
};

export default Pagination;
