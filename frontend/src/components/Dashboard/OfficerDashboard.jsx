import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiAward,
  FiBriefcase,
  FiCheckCircle,
  FiTrendingUp,
  FiUserCheck,
  FiUsers,
} from "react-icons/fi";
import { api } from "../../lib/api";
import { displayName } from "../../utils/avatar";
import PageHeader from "../Layout/PageHeader";
import { Button, Card, CardHeader, EmptyState, Skeleton, StatCard } from "../ui";

/** ₹45,00,000 → "₹45.0 L", ₹1.2cr → "₹1.2 Cr" — Indian conventions, not "4.5M". */
export const formatINR = (n) => {
  if (!n) return "—";
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)} L`;
  return `₹${Number(n).toLocaleString("en-IN")}`;
};

/**
 * Placement Officer home.
 *
 * The Admin previously had six endpoints and a single screen — a recruiter
 * approval queue — despite being the most senior role. This is the oversight
 * view: placement rate, packages, and what needs a decision today.
 */
const OfficerDashboard = ({ user }) => {
  const [analytics, setAnalytics] = useState(null);
  const [pending, setPending] = useState(null);

  useEffect(() => {
    api
      .get("/api/v1/admin/analytics")
      .then(({ data }) => setAnalytics(data.analytics ?? data))
      .catch(() => setAnalytics({}));

    api
      .get("/api/v1/admin/pending-recruiters")
      // The endpoint used to 404 on an empty queue, which forced "all clear"
      // through the error path. It now answers 200 with an empty array, so the
      // catch below is a genuine request failure — not the empty case.
      .then(({ data }) => setPending(data.pendingRecruiters ?? data.users ?? []))
      .catch(() => setPending([]));
  }, []);

  const loading = analytics === null;
  const a = analytics ?? {};

  return (
    <>
      <PageHeader
        title={`Placement overview`}
        description={`Signed in as ${displayName(user) || "Placement Officer"}.`}
        actions={
          <Button to="/app/analytics" variant="outline" leadingIcon={<FiTrendingUp />}>
            Full analytics
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" rounded="rounded-[var(--radius-card)]" />
          ))
        ) : (
          <>
            <StatCard
              label="Placement rate"
              value={a.placementRate ?? 0}
              suffix="%"
              icon={<FiCheckCircle />}
              tone="brand"
            />
            <StatCard label="Students placed" value={a.placed ?? 0} icon={<FiUsers />} />
            <StatCard
              label="Highest package"
              value={a.highestPackage ? formatINR(a.highestPackage) : "—"}
              animate={false}
              icon={<FiAward />}
              tone="accent"
            />
            <StatCard
              label="Recruiting partners"
              value={a.companies ?? 0}
              icon={<FiBriefcase />}
            />
          </>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* ---- Branch breakdown ---- */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Placement by branch"
            description="Share of eligible students with at least one offer."
          />

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : !a.byBranch?.length ? (
            <EmptyState
              icon={<FiTrendingUp />}
              title="No placement data yet"
              description="Branch-wise figures appear once students start receiving offers this season."
            />
          ) : (
            <ul className="space-y-4">
              {a.byBranch.map((row) => {
                const pct = row.total ? Math.round((row.placed / row.total) * 100) : 0;
                return (
                  <li key={row.branch}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-3">
                      <span className="truncate text-sm font-medium text-[var(--text-primary)]">
                        {row.branch}
                      </span>
                      <span
                        data-numeric
                        className="shrink-0 text-sm text-[var(--text-secondary)]"
                      >
                        {row.placed}/{row.total}{" "}
                        <span className="font-semibold text-[var(--text-primary)]">
                          {pct}%
                        </span>
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
              })}
            </ul>
          )}
        </Card>

        {/* ---- Approval queue ---- */}
        <Card>
          <CardHeader
            title="Awaiting approval"
            actions={
              <Link
                to="/app/approvals"
                className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand)] hover:underline"
              >
                Review <FiArrowRight aria-hidden="true" className="size-3.5" />
              </Link>
            }
          />

          {pending === null ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : pending.length === 0 ? (
            <EmptyState
              icon={<FiUserCheck />}
              title="Nothing to review"
              description="Every recruiter request has been actioned."
              className="!py-8"
            />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {pending.slice(0, 5).map((recruiter) => (
                <li key={recruiter._id} className="py-3">
                  <p className="truncate font-medium text-[var(--text-primary)]">
                    {recruiter.name}
                  </p>
                  <p className="truncate text-sm text-[var(--text-tertiary)]">{recruiter.email}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
};

export default OfficerDashboard;
