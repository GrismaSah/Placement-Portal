import {
  FiAward,
  FiBriefcase,
  FiCheckCircle,
  FiDownload,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { useQuery } from "../../lib/useQuery";
import { stageMeta } from "../ui/Badge";
import PageHeader from "../Layout/PageHeader";
import { Button, Card, CardHeader, EmptyState, Skeleton, StatCard } from "../ui";

/** ₹45,00,000 → "₹45.0 L". Indian conventions, not "4.5M". */
export const formatINR = (n) => {
  if (!n) return "—";
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)} L`;
  return `₹${Number(n).toLocaleString("en-IN")}`;
};

/** Client-side CSV, so no export endpoint or file storage is needed. */
function downloadCsv(filename, rows) {
  const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = rows.map((r) => r.map(escape).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const Bar = ({ label, value, total, hint }) => {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <li>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="truncate text-sm font-medium text-[var(--text-primary)]">
          {label}
        </span>
        <span data-numeric className="shrink-0 text-sm text-[var(--text-secondary)]">
          {hint ?? `${value}/${total}`}{" "}
          <span className="font-semibold text-[var(--text-primary)]">{pct}%</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-active)]">
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-[900ms] ease-[var(--ease-spring)]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </li>
  );
};

/**
 * Placement reporting.
 *
 * The office previously had no reporting of any kind — no placement rate, no
 * package figures, no branch or company breakdown. Everything here is derived
 * from applications rather than from the denormalised user.placementStatus, so
 * the numbers stay correct even if that field drifts.
 */
const Analytics = () => {
  const { data, isInitialLoading } = useQuery("/api/v1/tpo/analytics");
  const a = data?.analytics ?? {};

  const exportCsv = () => {
    if (!a.byBranch?.length) {
      toast.error("There's no placement data to export yet.");
      return;
    }
    downloadCsv("jain-placement-report.csv", [
      ["Branch", "Students", "Placed", "Placement rate %"],
      ...a.byBranch.map((r) => [
        r.branch,
        r.total,
        r.placed,
        r.total ? Math.round((r.placed / r.total) * 100) : 0,
      ]),
      [],
      ["Company", "Hires", "Average CTC"],
      ...(a.byCompany ?? []).map((c) => [c.company, c.hires, c.avgCtc ?? ""]),
    ]);
    toast.success("Report downloaded");
  };

  if (isInitialLoading) {
    return (
      <>
        <PageHeader title="Placement analytics" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" rounded="rounded-[var(--radius-card)]" />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Placement analytics"
        description="Live figures for the current season."
        actions={
          <Button variant="outline" leadingIcon={<FiDownload />} onClick={exportCsv}>
            Export CSV
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Placement rate"
          value={a.placementRate ?? 0}
          suffix="%"
          icon={<FiCheckCircle />}
          tone="brand"
          hint={`${a.placed ?? 0} of ${a.students ?? 0} students`}
        />
        <StatCard label="Offers made" value={a.offers ?? 0} icon={<FiTrendingUp />} />
        <StatCard
          label="Highest package"
          value={formatINR(a.highestPackage)}
          animate={false}
          icon={<FiAward />}
          tone="accent"
        />
        <StatCard
          label="Median package"
          value={formatINR(a.medianPackage)}
          animate={false}
          icon={<FiBriefcase />}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Students registered" value={a.students ?? 0} icon={<FiUsers />} />
        <StatCard label="Applications" value={a.applications ?? 0} icon={<FiBriefcase />} />
        <StatCard label="Recruiting partners" value={a.companies ?? 0} icon={<FiBriefcase />} />
        <StatCard label="Open roles" value={a.openRoles ?? 0} icon={<FiBriefcase />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Branch */}
        <Card>
          <CardHeader
            title="By branch"
            description="Share of students with at least one confirmed placement."
          />
          {!a.byBranch?.length ? (
            <EmptyState
              icon={<FiTrendingUp />}
              title="No placement data yet"
              description="Branch figures appear once students start being placed."
            />
          ) : (
            <ul className="space-y-4">
              {a.byBranch.map((row) => (
                <Bar
                  key={row.branch}
                  label={row.branch}
                  value={row.placed}
                  total={row.total}
                />
              ))}
            </ul>
          )}
        </Card>

        {/* Pipeline */}
        <Card>
          <CardHeader
            title="Pipeline"
            description="Where every application currently sits."
          />
          {!a.byStage?.length ? (
            <EmptyState
              icon={<FiBriefcase />}
              title="No applications yet"
              description="The pipeline fills as students apply to openings."
            />
          ) : (
            <ul className="space-y-3">
              {a.byStage.map((row) => {
                const meta = stageMeta(row.status);
                const total = a.applications || 1;
                const pct = Math.round((row.count / total) * 100);
                return (
                  <li key={row.status} className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: meta.color }}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm text-[var(--text-primary)]">
                      {meta.label}
                    </span>
                    <span
                      data-numeric
                      className="shrink-0 text-sm font-semibold text-[var(--text-primary)]"
                    >
                      {row.count}
                    </span>
                    <span
                      data-numeric
                      className="w-10 shrink-0 text-right text-xs text-[var(--text-tertiary)]"
                    >
                      {pct}%
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Companies */}
        <Card className="lg:col-span-2">
          <CardHeader title="Top recruiters" description="By confirmed hires this season." />
          {!a.byCompany?.length ? (
            <EmptyState
              icon={<FiBriefcase />}
              title="No hires recorded yet"
              description="Companies appear here once their offers are confirmed as placements."
            />
          ) : (
            <ul className="space-y-4">
              {a.byCompany.map((c) => (
                <Bar
                  key={c.company}
                  label={c.company}
                  value={c.hires}
                  total={a.byCompany[0].hires}
                  hint={`${c.hires} ${c.hires === 1 ? "hire" : "hires"}${
                    c.avgCtc ? ` · avg ${formatINR(c.avgCtc)}` : ""
                  }`}
                />
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
};

export default Analytics;
