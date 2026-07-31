import { Link } from "react-router-dom";
import { FiChevronRight } from "react-icons/fi";
import { cn } from "../../lib/cn";

/**
 * Standard page heading: breadcrumb, title, supporting line, actions.
 * Every screen in the app uses this so vertical rhythm stays identical.
 */
const PageHeader = ({ title, description, actions, breadcrumbs = [], className }) => (
  <div className={cn("mb-6", className)}>
    {breadcrumbs.length > 0 && (
      <nav aria-label="Breadcrumb" className="mb-3">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-[var(--text-tertiary)]">
          {breadcrumbs.map((crumb, i) => {
            const isLast = i === breadcrumbs.length - 1;
            return (
              <li key={crumb.to ?? crumb.label} className="flex items-center gap-1">
                {crumb.to && !isLast ? (
                  <Link
                    to={crumb.to}
                    className="transition-colors hover:text-[var(--text-primary)]"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current={isLast ? "page" : undefined} className="text-[var(--text-secondary)]">
                    {crumb.label}
                  </span>
                )}
                {!isLast && <FiChevronRight aria-hidden="true" className="size-3.5" />}
              </li>
            );
          })}
        </ol>
      </nav>
    )}

    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-h2 font-bold tracking-tight text-[var(--text-primary)]">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-[0.9375rem] text-[var(--text-secondary)] text-balance-pretty">
            {description}
          </p>
        )}
      </div>

      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  </div>
);

export default PageHeader;
