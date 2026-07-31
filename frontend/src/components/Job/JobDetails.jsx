import { useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiAlertCircle,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiMapPin,
  FiUsers,
} from "react-icons/fi";
import { Context } from "../../main";
import { useQuery } from "../../lib/useQuery";
import { categoryLabel, companyLogo } from "../../constants/jobTaxonomy";
import { isStudent } from "../../lib/roles";
import PageHeader from "../Layout/PageHeader";
import { Badge, Button, Card, CardHeader, Skeleton, StatusBadge } from "../ui";
import { salaryLabel } from "./Jobs";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { dateStyle: "medium" }) : null;

const JobDetails = () => {
  const { id } = useParams();
  const { user } = useContext(Context);
  const navigate = useNavigate();

  const { data, isInitialLoading, error } = useQuery(`/api/v1/job/${id}`);
  const job = data?.job;

  // Whether this student has already applied decides what the action card
  // offers: apply, or the current stage of an existing application.
  const { data: mine } = useQuery("/api/v1/application/jobseeker/getall", {
    enabled: isStudent(user),
  });
  const application = (mine?.applications ?? []).find(
    (a) => String(a.jobId?._id ?? a.jobId) === String(id)
  );

  if (error) {
    return (
      <Card className="text-center">
        <h1 className="text-h3 font-semibold text-[var(--text-primary)]">
          This role is no longer listed
        </h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          It may have been closed or removed by the recruiter.
        </p>
        <Button to="/app/jobs" className="mt-6">
          Browse other openings
        </Button>
      </Card>
    );
  }

  if (isInitialLoading || !job) {
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-32" rounded="rounded-[var(--radius-card)]" />
          <Skeleton className="h-56" rounded="rounded-[var(--radius-card)]" />
        </div>
        <Skeleton className="h-80" rounded="rounded-[var(--radius-card)]" />
      </div>
    );
  }

  const Logo = companyLogo(job.company);
  const deadline = job.applicationDeadline ? new Date(job.applicationDeadline) : null;
  const closed = job.expired || (deadline && deadline < new Date());

  const facts = [
    {
      icon: FiMapPin,
      label: "Location",
      value: [job.city, job.country].filter(Boolean).join(", "),
    },
    { icon: FiBriefcase, label: "Function", value: categoryLabel(job.category) },
    { icon: FiCalendar, label: "Posted", value: fmtDate(job.jobPostedOn) },
    deadline && { icon: FiClock, label: "Apply by", value: fmtDate(deadline) },
    job.driveDate && { icon: FiCalendar, label: "Drive date", value: fmtDate(job.driveDate) },
    job.openings && { icon: FiUsers, label: "Openings", value: String(job.openings) },
  ].filter(Boolean);

  const e = job.eligibility;
  const criteria = [
    e?.minCgpa != null && `CGPA ${e.minCgpa} and above`,
    e?.maxBacklogs != null && `At most ${e.maxBacklogs} active backlog(s)`,
    e?.allowedBranches?.length && `Open to ${e.allowedBranches.join(", ")}`,
    e?.allowedBatches?.length && `Batch of ${e.allowedBatches.join(", ")}`,
  ].filter(Boolean);

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Openings", to: "/app/jobs" }, { label: job.title }]}
        title={job.title}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ---- Main column ---- */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="flex items-start gap-4">
              <span
                aria-hidden="true"
                className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[var(--surface-hover)] text-[var(--text-secondary)]"
              >
                <Logo className="size-7" />
              </span>
              <div className="min-w-0">
                <p className="text-lg font-semibold text-[var(--text-primary)]">
                  {job.company}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  {[job.city, job.country].filter(Boolean).join(", ")}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <Badge tone="brand" size="sm">
                    {categoryLabel(job.category)}
                  </Badge>
                  {closed ? (
                    <Badge tone="neutral" size="sm">
                      Closed
                    </Badge>
                  ) : (
                    <Badge tone="success" size="sm" dot>
                      Accepting applications
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="About this role" />
            <p className="text-[0.9375rem] leading-relaxed whitespace-pre-line text-[var(--text-secondary)]">
              {job.description}
            </p>
          </Card>

          {criteria.length > 0 && (
            <Card>
              <CardHeader
                title="Eligibility"
                description="Set by the recruiter for this posting."
              />
              <ul className="space-y-2.5">
                {criteria.map((c) => (
                  <li key={c} className="flex items-start gap-2.5 text-[0.9375rem]">
                    <FiCheckCircle
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-[var(--color-success-500)]"
                    />
                    <span className="text-[var(--text-secondary)]">{c}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {job.postedBy?.name && (
            <Card>
              <CardHeader title="Posted by" />
              <p className="font-medium text-[var(--text-primary)]">{job.postedBy.name}</p>
              {job.postedBy.email && (
                <a
                  href={`mailto:${job.postedBy.email}`}
                  className="text-sm text-[var(--brand)] hover:underline"
                >
                  {job.postedBy.email}
                </a>
              )}
            </Card>
          )}
        </div>

        {/* ---- Action card ---- */}
        <div className="lg:col-span-1">
          <Card className="lg:sticky lg:top-22">
            <p className="text-xs font-semibold tracking-wide text-[var(--text-tertiary)] uppercase">
              Package
            </p>
            <p
              data-numeric
              className="mt-1 text-2xl font-bold tracking-tight text-[var(--text-primary)]"
            >
              {salaryLabel(job)}
            </p>

            <dl className="mt-5 space-y-3.5 border-t border-[var(--border)] pt-5">
              {facts.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <Icon
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-[var(--text-tertiary)]"
                  />
                  <div className="min-w-0">
                    <dt className="text-xs text-[var(--text-tertiary)]">{label}</dt>
                    <dd className="text-sm font-medium text-[var(--text-primary)]">
                      {value}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>

            <div className="mt-6">
              {!isStudent(user) ? (
                <p className="rounded-[var(--radius-field)] bg-[var(--surface-hover)] px-3.5 py-3 text-sm text-[var(--text-secondary)]">
                  Only students can apply to postings.
                </p>
              ) : application ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3 rounded-[var(--radius-field)] bg-[var(--surface-hover)] px-3.5 py-3">
                    <span className="text-sm text-[var(--text-secondary)]">You applied</span>
                    <StatusBadge status={application.status ?? "Applied"} size="sm" />
                  </div>
                  <Button to="/app/applications" variant="outline" fullWidth>
                    Track this application
                  </Button>
                </div>
              ) : closed ? (
                <div className="flex gap-2.5 rounded-[var(--radius-field)] bg-[var(--color-warning-50)] px-3.5 py-3">
                  <FiAlertCircle
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-[var(--color-warning-500)]"
                  />
                  <p className="text-sm text-[var(--text-secondary)]">
                    Applications for this role have closed.
                  </p>
                </div>
              ) : (
                <Button fullWidth size="lg" onClick={() => navigate(`/app/jobs/${job._id}/apply`)}>
                  Apply now
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default JobDetails;
