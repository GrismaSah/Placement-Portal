import { cn } from "../../lib/cn";

/**
 * Responsive data table.
 *
 * Below `md` each row re-renders as a stacked card with the column header as a
 * label, rather than forcing a horizontal scroll. Recruiters review applicants
 * on phones, and a 7-column table on a 360px screen is unusable.
 *
 * Columns:
 *   { key, header, render?, align?, className?, hideOnMobile? }
 */
const Table = ({
  columns,
  rows,
  rowKey = (row, i) => row._id ?? row.id ?? i,
  onRowClick,
  empty,
  caption,
  className,
}) => {
  if (!rows?.length && empty) return empty;

  const alignClass = (align) =>
    align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";

  return (
    <div className={cn("w-full", className)}>
      {/* ---- md and up: a real table ---- */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}

          <thead>
            <tr className="border-b border-[var(--border)]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    "px-4 py-3 text-xs font-semibold tracking-wide text-[var(--text-secondary)] uppercase",
                    alignClass(col.align)
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, i) => (
              <tr
                key={rowKey(row, i)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "border-b border-[var(--border)] transition-colors last:border-0",
                  onRowClick && "cursor-pointer hover:bg-[var(--surface-hover)]"
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-4 py-3.5 text-[var(--text-primary)] align-middle",
                      alignClass(col.align),
                      col.className
                    )}
                  >
                    {col.render ? col.render(row, i) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---- below md: stacked cards ---- */}
      <ul className="space-y-3 md:hidden">
        {rows.map((row, i) => (
          <li
            key={rowKey(row, i)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={cn(
              "surface-card p-4",
              onRowClick && "cursor-pointer active:bg-[var(--surface-hover)]"
            )}
          >
            <dl className="space-y-2.5">
              {columns
                .filter((col) => !col.hideOnMobile)
                .map((col) => (
                  <div key={col.key} className="flex items-start justify-between gap-4">
                    <dt className="text-xs font-semibold tracking-wide text-[var(--text-tertiary)] uppercase">
                      {col.header}
                    </dt>
                    <dd className="min-w-0 text-right text-sm text-[var(--text-primary)]">
                      {col.render ? col.render(row, i) : row[col.key]}
                    </dd>
                  </div>
                ))}
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Table;
