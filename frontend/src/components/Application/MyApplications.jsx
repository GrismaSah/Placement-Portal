import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FiEye, FiInbox, FiTrash2 } from "react-icons/fi";
import { api, apiError } from "../../lib/api";
import { invalidate, useQuery } from "../../lib/useQuery";
import { companyLogo } from "../../constants/jobTaxonomy";
import PageHeader from "../Layout/PageHeader";
import {
  Button,
  Card,
  EmptyState,
  Modal,
  Skeleton,
  StatusBadge,
  StatusTimeline,
  Stepper,
  Tabs,
} from "../ui";
import ResumeModal from "./ResumeModal";

/**
 * The student's applications.
 *
 * Extracted from a 369-line file that fused three unrelated role screens
 * together and branched between them mid-render. This one only renders the
 * student view; recruiters and the placement office have their own screens.
 *
 * The stepper is the whole point — before the pipeline existed, submitting an
 * application produced no signal back to the student at all.
 */

const ACTIVE = ["Applied", "Shortlisted", "Interview", "Offered"];

const MyApplications = () => {
  const { data, isInitialLoading, refetch } = useQuery(
    "/api/v1/application/jobseeker/getall"
  );
  const [tab, setTab] = useState("active");
  const [resume, setResume] = useState(null);
  const [confirmWithdraw, setConfirmWithdraw] = useState(null);
  const [busy, setBusy] = useState(false);

  const applications = data?.applications ?? [];

  const buckets = useMemo(
    () => ({
      active: applications.filter((a) => ACTIVE.includes(a.status ?? "Applied")),
      placed: applications.filter((a) => a.status === "Placed"),
      closed: applications.filter((a) => ["Rejected", "Withdrawn"].includes(a.status)),
    }),
    [applications]
  );

  const shown = buckets[tab] ?? [];

  const withdraw = async (id) => {
    setBusy(true);
    try {
      await api.delete(`/api/v1/application/delete/${id}`);
      invalidate("/api/v1/application");
      toast.success("Application withdrawn");
      setConfirmWithdraw(null);
      refetch();
    } catch (err) {
      toast.error(apiError(err, "Could not withdraw the application."));
    } finally {
      setBusy(false);
    }
  };

  if (isInitialLoading) {
    return (
      <>
        <PageHeader title="My applications" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44" rounded="rounded-[var(--radius-card)]" />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="My applications"
        description="Every role you've applied to, and exactly where it stands."
        actions={
          <Button to="/app/jobs" variant="outline">
            Browse openings
          </Button>
        }
      />

      {applications.length === 0 ? (
        <Card padded={false}>
          <EmptyState
            icon={<FiInbox />}
            title="You haven't applied to anything yet"
            description="Once you apply, this page tracks the application through shortlisting, interview and offer."
            action="Find your first role"
            actionTo="/app/jobs"
          />
        </Card>
      ) : (
        <>
          <Tabs
            ariaLabel="Application status"
            value={tab}
            onChange={setTab}
            items={[
              { value: "active", label: "In progress", count: buckets.active.length },
              { value: "placed", label: "Placed", count: buckets.placed.length },
              { value: "closed", label: "Closed", count: buckets.closed.length },
            ]}
            className="mb-6"
          />

          {shown.length === 0 ? (
            <Card padded={false}>
              <EmptyState
                icon={<FiInbox />}
                title={`Nothing ${tab === "active" ? "in progress" : tab}`}
                description={
                  tab === "active"
                    ? "All of your applications have reached a final outcome."
                    : "Applications appear here as they reach this stage."
                }
              />
            </Card>
          ) : (
            <div className="space-y-4">
              {shown.map((app) => {
                const Logo = companyLogo(app.jobId?.company);
                const status = app.status ?? "Applied";
                const canWithdraw = ACTIVE.includes(status);

                return (
                  <Card key={app._id}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex min-w-0 gap-3.5">
                        <span
                          aria-hidden="true"
                          className="grid size-12 shrink-0 place-items-center rounded-xl bg-[var(--surface-hover)] text-[var(--text-secondary)]"
                        >
                          <Logo className="size-6" />
                        </span>
                        <div className="min-w-0">
                          {app.jobId?._id ? (
                            <Link
                              to={`/app/jobs/${app.jobId._id}`}
                              className="font-semibold text-[var(--text-primary)] hover:underline"
                            >
                              {app.jobId.title}
                            </Link>
                          ) : (
                            <span className="font-semibold text-[var(--text-primary)]">
                              Role no longer listed
                            </span>
                          )}
                          <p className="truncate text-sm text-[var(--text-secondary)]">
                            {app.jobId?.company}
                            {app.jobId?.city ? ` · ${app.jobId.city}` : ""}
                          </p>
                          {app.createdAt && (
                            <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
                              Applied{" "}
                              {new Date(app.createdAt).toLocaleDateString("en-IN", {
                                dateStyle: "medium",
                              })}
                            </p>
                          )}
                        </div>
                      </div>

                      <StatusBadge status={status} />
                    </div>

                    <div className="mt-6">
                      <Stepper status={status} history={app.statusHistory ?? []} />
                    </div>

                    {app.statusHistory?.length > 1 && (
                      <details className="mt-5">
                        <summary className="cursor-pointer text-sm font-medium text-[var(--brand)] hover:underline">
                          View history
                        </summary>
                        <StatusTimeline
                          history={app.statusHistory}
                          className="mt-4 border-t border-[var(--border)] pt-4"
                        />
                      </details>
                    )}

                    <div className="mt-5 flex flex-wrap gap-2.5 border-t border-[var(--border)] pt-4">
                      {app.resume?.fileId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          leadingIcon={<FiEye />}
                          onClick={() => setResume(app.resume)}
                        >
                          Resume sent
                        </Button>
                      )}
                      {canWithdraw && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[var(--color-danger-500)] hover:bg-[var(--color-danger-50)]"
                          leadingIcon={<FiTrash2 />}
                          onClick={() => setConfirmWithdraw(app)}
                        >
                          Withdraw
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {resume && (
        <ResumeModal
          open
          fileId={resume.fileId}
          contentType={resume.contentType}
          filename={resume.filename}
          onClose={() => setResume(null)}
        />
      )}

      <Modal
        open={Boolean(confirmWithdraw)}
        onClose={() => setConfirmWithdraw(null)}
        title="Withdraw this application?"
        description="This cannot be undone."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmWithdraw(null)}>
              Keep it
            </Button>
            <Button variant="danger" loading={busy} onClick={() => withdraw(confirmWithdraw._id)}>
              Withdraw
            </Button>
          </>
        }
      >
        <p className="text-sm text-[var(--text-secondary)]">
          Your application to{" "}
          <strong className="text-[var(--text-primary)]">
            {confirmWithdraw?.jobId?.title}
          </strong>{" "}
          will be removed and the recruiter will no longer see your resume.
        </p>
      </Modal>
    </>
  );
};

export default MyApplications;
