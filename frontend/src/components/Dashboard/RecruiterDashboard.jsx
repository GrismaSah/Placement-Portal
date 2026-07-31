import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiAlertCircle,
  FiArrowRight,
  FiBriefcase,
  FiPlus,
  FiUsers,
} from "react-icons/fi";
import { api } from "../../lib/api";
import { displayName } from "../../utils/avatar";
import { categoryIcon } from "../../constants/jobTaxonomy";
import PageHeader from "../Layout/PageHeader";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Skeleton,
  StatCard,
} from "../ui";

/**
 * Recruiter (TNP) home.
 *
 * Note the approval banner: a recruiter whose account is still Pending can
 * currently post jobs anyway, because the backend only blocks role === Student.
 * Until that is enforced server-side, the UI at least tells them their status
 * honestly rather than silently letting them believe they are live.
 */
const RecruiterDashboard = ({ user }) => {
  const [jobs, setJobs] = useState(null);

  useEffect(() => {
    api
      .get("/api/v1/job/getmyjobs")
      .then(({ data }) => setJobs(data.myJobs ?? []))
      .catch(() => setJobs([]));
  }, []);

  const totals = useMemo(() => {
    const list = jobs ?? [];
    return {
      postings: list.length,
      live: list.filter((j) => !j.expired).length,
      applicants: list.reduce((sum, j) => sum + (j.applicationCount ?? 0), 0),
    };
  }, [jobs]);

  const pending = user?.status && user.status !== "Approved";
  const loading = jobs === null;

  return (
    <>
      <PageHeader
        title={`Welcome, ${displayName(user).split(" ")[0] || "there"}`}
        description="Your postings and the candidates in them."
        actions={
          <Button to="/app/postings/new" leadingIcon={<FiPlus />}>
            Post a role
          </Button>
        }
      />

      {pending && (
        <Card
          className="mb-6 border-[var(--color-warning-500)]/30 bg-[var(--color-warning-50)]"
          padded
        >
          <div className="flex gap-3">
            <FiAlertCircle
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-[var(--color-warning-500)]"
            />
            <div>
              <p className="font-semibold text-[var(--text-primary)]">
                Your recruiter account is {user.status.toLowerCase()}
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                The Placement Office reviews every recruiting partner before postings are
                promoted to students. You&rsquo;ll be notified by email once a decision is
                made.
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" rounded="rounded-[var(--radius-card)]" />
          ))
        ) : (
          <>
            <StatCard label="Total postings" value={totals.postings} icon={<FiBriefcase />} />
            <StatCard label="Currently live" value={totals.live} icon={<FiBriefcase />} />
            <StatCard
              label="Applicants received"
              value={totals.applicants}
              icon={<FiUsers />}
              tone="brand"
            />
          </>
        )}
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Your postings"
          description="Applicant counts update as students apply."
          actions={
            <Link
              to="/app/postings"
              className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand)] hover:underline"
            >
              Manage <FiArrowRight aria-hidden="true" className="size-3.5" />
            </Link>
          }
        />

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : totals.postings === 0 ? (
          <EmptyState
            icon={<FiBriefcase />}
            title="You haven't posted a role yet"
            description="Post an opening and it becomes visible to every eligible student straight away."
            action="Post your first role"
            actionTo="/app/postings/new"
          />
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {(jobs ?? []).slice(0, 6).map((job) => {
              const Icon = categoryIcon(job.category);
              return (
                <li key={job._id}>
                  <Link
                    to={`/app/postings/${job._id}/applicants`}
                    className="flex items-center gap-3 py-3.5 transition-colors hover:bg-[var(--surface-hover)]"
                  >
                    <span
                      aria-hidden="true"
                      className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--brand-subtle)] text-[var(--brand)]"
                    >
                      <Icon className="size-5" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-[var(--text-primary)]">
                        {job.title}
                      </p>
                      <p className="truncate text-sm text-[var(--text-tertiary)]">
                        {job.company} · {job.city}
                      </p>
                    </div>

                    {job.expired ? (
                      <Badge tone="neutral" size="sm">
                        Closed
                      </Badge>
                    ) : (
                      <Badge tone="success" size="sm" dot>
                        Live
                      </Badge>
                    )}

                    <span
                      data-numeric
                      className="ml-2 w-16 shrink-0 text-right text-sm font-semibold text-[var(--text-primary)]"
                    >
                      {job.applicationCount ?? 0}
                      <span className="ml-1 font-normal text-[var(--text-tertiary)]">
                        {job.applicationCount === 1 ? "app" : "apps"}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
};

export default RecruiterDashboard;
