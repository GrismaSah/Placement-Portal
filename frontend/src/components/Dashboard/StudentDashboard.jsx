import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiAward,
  FiBriefcase,
  FiCheckCircle,
  FiFileText,
  FiInbox,
  FiSend,
} from "react-icons/fi";
import { api } from "../../lib/api";
import { displayName } from "../../utils/avatar";
import { categoryIcon, companyLogo } from "../../constants/jobTaxonomy";
import PageHeader from "../Layout/PageHeader";
import {
  APPLICATION_STAGES,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Skeleton,
  StatCard,
  StatusBadge,
} from "../ui";

/**
 * Student home.
 *
 * Answers, in order: where do my applications stand, is my profile ready, and
 * what should I apply to next. The old portal answered none of these — it
 * dropped students on a marketing page with a job list.
 */

/** Rough profile completeness, so the meter has something to measure. */
function completeness(user, resume) {
  const checks = [
    [Boolean(user?.name), "Name"],
    [Boolean(user?.email), "Email"],
    [Boolean(user?.phone), "Phone"],
    [Boolean(user?.address), "Address"],
    [Boolean(user?.enrollment), "Enrollment number"],
    [Boolean(resume?.headline), "Headline"],
    [Boolean(resume?.summary), "Summary"],
    [Boolean(resume?.education?.length), "Education"],
    [Boolean(resume?.skills?.length), "Skills"],
    [Boolean(resume?.file?.fileId), "Resume file"],
  ];

  const done = checks.filter(([ok]) => ok).length;
  return {
    percent: Math.round((done / checks.length) * 100),
    missing: checks.filter(([ok]) => !ok).map(([, label]) => label),
  };
}

const Ring = ({ percent }) => {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);

  return (
    <div className="relative grid size-28 shrink-0 place-items-center">
      <svg viewBox="0 0 100 100" className="size-28 -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="9"
          className="stroke-[var(--surface-active)]"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="stroke-[var(--accent)] transition-[stroke-dashoffset] duration-[900ms] ease-[var(--ease-spring)]"
        />
      </svg>
      <span
        data-numeric
        className="absolute text-xl font-bold text-[var(--text-primary)]"
      >
        {percent}%
      </span>
    </div>
  );
};

const StudentDashboard = ({ user }) => {
  const [applications, setApplications] = useState(null);
  const [resume, setResume] = useState(null);
  const [jobs, setJobs] = useState(null);

  useEffect(() => {
    api
      .get("/api/v1/application/jobseeker/getall")
      .then(({ data }) => setApplications(data.applications ?? []))
      .catch(() => setApplications([]));

    api
      .get("/api/v1/resume/me")
      .then(({ data }) => setResume(data.resume ?? null))
      .catch(() => setResume(null));

    api
      .get("/api/v1/job/getall", { params: { limit: 4, page: 1 } })
      .then(({ data }) => setJobs(data.jobs ?? []))
      .catch(() => setJobs([]));
  }, []);

  const counts = useMemo(() => {
    const list = applications ?? [];
    const by = (status) => list.filter((a) => (a.status ?? "Applied") === status).length;
    return {
      total: list.length,
      active: list.filter(
        (a) => !["Rejected", "Withdrawn", "Placed"].includes(a.status ?? "Applied")
      ).length,
      offers: by("Offered") + by("Placed"),
      interviews: by("Interview"),
    };
  }, [applications]);

  const profile = completeness(user, resume);
  const loading = applications === null;

  return (
    <>
      <PageHeader
        title={`Welcome back, ${displayName(user).split(" ")[0] || "there"}`}
        description="Here's where everything stands today."
        actions={
          <Button to="/app/jobs" leadingIcon={<FiBriefcase />}>
            Browse openings
          </Button>
        }
      />

      {/* ---- Metrics ---- */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" rounded="rounded-[var(--radius-card)]" />
          ))
        ) : (
          <>
            <StatCard label="Applications" value={counts.total} icon={<FiSend />} />
            <StatCard label="In progress" value={counts.active} icon={<FiFileText />} />
            <StatCard label="Interviews" value={counts.interviews} icon={<FiAward />} />
            <StatCard
              label="Offers"
              value={counts.offers}
              icon={<FiCheckCircle />}
              tone={counts.offers > 0 ? "accent" : "default"}
            />
          </>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* ---- Pipeline ---- */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Your pipeline"
            description="Every application you have open, by stage."
            actions={
              <Link
                to="/app/applications"
                className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand)] hover:underline"
              >
                View all <FiArrowRight aria-hidden="true" className="size-3.5" />
              </Link>
            }
          />

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : counts.total === 0 ? (
            <EmptyState
              icon={<FiInbox />}
              title="No applications yet"
              description="Once you apply to a role it appears here, and you can follow it through every stage."
              action="Find your first role"
              actionTo="/app/jobs"
            />
          ) : (
            <>
              {/* Stage funnel */}
              <div className="mb-6 grid grid-cols-5 gap-2">
                {APPLICATION_STAGES.map((stage) => {
                  const n = (applications ?? []).filter(
                    (a) => (a.status ?? "Applied") === stage.value
                  ).length;

                  return (
                    <div
                      key={stage.value}
                      className="rounded-[var(--radius-field)] border border-[var(--border)] p-3 text-center"
                    >
                      <span
                        aria-hidden="true"
                        className="mx-auto block h-1 w-8 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      />
                      <p
                        data-numeric
                        className="mt-2 text-xl font-bold text-[var(--text-primary)]"
                      >
                        {n}
                      </p>
                      <p className="mt-0.5 text-[0.6875rem] leading-tight text-[var(--text-tertiary)]">
                        {stage.label}
                      </p>
                    </div>
                  );
                })}
              </div>

              <ul className="divide-y divide-[var(--border)]">
                {(applications ?? []).slice(0, 5).map((app) => {
                  const Logo = companyLogo(app.jobId?.company);
                  return (
                    <li key={app._id} className="flex items-center gap-3 py-3.5">
                      <span
                        aria-hidden="true"
                        className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--surface-hover)] text-[var(--text-secondary)]"
                      >
                        <Logo className="size-5" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-[var(--text-primary)]">
                          {app.jobId?.title ?? "Role no longer listed"}
                        </p>
                        <p className="truncate text-sm text-[var(--text-tertiary)]">
                          {app.jobId?.company}
                        </p>
                      </div>

                      <StatusBadge status={app.status ?? "Applied"} size="sm" />
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </Card>

        {/* ---- Right rail ---- */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Profile strength" />
            <div className="flex items-center gap-5">
              <Ring percent={profile.percent} />
              <div className="min-w-0">
                {profile.percent === 100 ? (
                  <p className="text-sm text-[var(--text-secondary)]">
                    Your profile is complete. Recruiters see everything they need.
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Still missing:
                    </p>
                    <ul className="mt-1.5 space-y-1 text-sm text-[var(--text-tertiary)]">
                      {profile.missing.slice(0, 3).map((m) => (
                        <li key={m}>· {m}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>

            {profile.percent < 100 && (
              <Button to="/app/resume" variant="outline" size="sm" fullWidth className="mt-5">
                Complete your profile
              </Button>
            )}
          </Card>

          <Card>
            <CardHeader title="Newest openings" />
            {jobs === null ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <p className="py-4 text-sm text-[var(--text-tertiary)]">
                No openings posted yet.
              </p>
            ) : (
              <ul className="space-y-1">
                {jobs.slice(0, 4).map((job) => {
                  const Icon = categoryIcon(job.category);
                  return (
                    <li key={job._id}>
                      <Link
                        to={`/app/jobs/${job._id}`}
                        className="flex items-center gap-3 rounded-[var(--radius-field)] px-2 py-2.5 transition-colors hover:bg-[var(--surface-hover)]"
                      >
                        <span
                          aria-hidden="true"
                          className="grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--brand-subtle)] text-[var(--brand)]"
                        >
                          <Icon className="size-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-[var(--text-primary)]">
                            {job.title}
                          </span>
                          <span className="block truncate text-xs text-[var(--text-tertiary)]">
                            {job.company} · {job.city}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
};

export default StudentDashboard;
