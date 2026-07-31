import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { FiCheck, FiEye, FiUsers, FiX } from "react-icons/fi";
import { api, apiError } from "../../lib/api";
import { invalidate, useQuery } from "../../lib/useQuery";
import PageHeader from "../Layout/PageHeader";
import {
  APPLICATION_STAGES,
  Avatar,
  Button,
  Card,
  EmptyState,
  Modal,
  Skeleton,
  StatusBadge,
  Table,
  Tabs,
  Textarea,
} from "../ui";
import ResumeModal from "./ResumeModal";

/**
 * Applicants for one posting.
 *
 * The recruiter's working surface. Previously this listed names with a resume
 * link and nothing else — there was no way to record a decision, because
 * applications had no status field. Now every row can be advanced through the
 * pipeline, and the student is notified on each transition.
 */

/** What a recruiter may move an application to from where it is now. */
const NEXT_STAGE = {
  Applied: "Shortlisted",
  Shortlisted: "Interview",
  Interview: "Offered",
  Offered: "Placed",
};

const JobApplications = () => {
  const { jobId } = useParams();
  const { data, isInitialLoading, refetch } = useQuery(
    "/api/v1/application/TNP/getall",
    { params: { jobId } }
  );

  const [tab, setTab] = useState("all");
  const [resume, setResume] = useState(null);
  const [action, setAction] = useState(null); // { app, status }
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const applications = data?.applications ?? [];
  const job = data?.job;

  const counts = useMemo(() => {
    const by = {};
    for (const a of applications) {
      const s = a.status ?? "Applied";
      by[s] = (by[s] ?? 0) + 1;
    }
    return by;
  }, [applications]);

  const shown =
    tab === "all"
      ? applications
      : applications.filter((a) => (a.status ?? "Applied") === tab);

  const move = async () => {
    if (!action) return;
    setBusy(true);
    try {
      await api.patch(`/api/v1/application/${action.app._id}/status`, {
        status: action.status,
        note: note.trim() || undefined,
      });
      invalidate("/api/v1/application");
      toast.success(`Marked ${action.status.toLowerCase()}`);
      setAction(null);
      setNote("");
      refetch();
    } catch (err) {
      toast.error(apiError(err, "Could not update the application."));
    } finally {
      setBusy(false);
    }
  };

  if (isInitialLoading) {
    return (
      <>
        <PageHeader title="Applicants" />
        <Skeleton className="h-96" rounded="rounded-[var(--radius-card)]" />
      </>
    );
  }

  const columns = [
    {
      key: "name",
      header: "Applicant",
      render: (a) => (
        <span className="flex items-center gap-2.5">
          <Avatar user={a} size={32} />
          <span className="min-w-0">
            <span className="block truncate font-medium text-[var(--text-primary)]">
              {a.name}
            </span>
            <span className="block truncate text-xs text-[var(--text-tertiary)]">
              {a.email}
            </span>
          </span>
        </span>
      ),
    },
    { key: "enrollment", header: "Enrollment", hideOnMobile: true },
    { key: "phone", header: "Phone", hideOnMobile: true },
    {
      key: "status",
      header: "Stage",
      render: (a) => <StatusBadge status={a.status ?? "Applied"} size="sm" />,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (a) => {
        const status = a.status ?? "Applied";
        const next = NEXT_STAGE[status];

        return (
          <span className="flex flex-wrap items-center justify-end gap-1.5">
            {a.resume?.fileId && (
              <Button
                variant="ghost"
                size="sm"
                aria-label={`View ${a.name}'s resume`}
                onClick={() => setResume(a.resume)}
                leadingIcon={<FiEye />}
              >
                Resume
              </Button>
            )}
            {next && (
              <Button
                size="sm"
                variant="outline"
                leadingIcon={<FiCheck />}
                onClick={() => setAction({ app: a, status: next })}
              >
                {next}
              </Button>
            )}
            {next && (
              <Button
                size="sm"
                variant="ghost"
                aria-label={`Reject ${a.name}`}
                className="text-[var(--color-danger-500)] hover:bg-[var(--color-danger-50)]"
                onClick={() => setAction({ app: a, status: "Rejected" })}
              >
                <FiX className="size-4" />
              </Button>
            )}
          </span>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "My postings", to: "/app/postings" },
          { label: job?.title ?? "Applicants" },
        ]}
        title={job?.title ? `Applicants — ${job.title}` : "Applicants"}
        description={
          applications.length
            ? `${applications.length} ${applications.length === 1 ? "person has" : "people have"} applied.`
            : undefined
        }
      />

      {applications.length === 0 ? (
        <Card padded={false}>
          <EmptyState
            icon={<FiUsers />}
            title="No applications yet"
            description="Applicants appear here as soon as students apply to this posting."
            action="Back to my postings"
            actionTo="/app/postings"
          />
        </Card>
      ) : (
        <>
          <Tabs
            ariaLabel="Filter by stage"
            variant="pill"
            value={tab}
            onChange={setTab}
            items={[
              { value: "all", label: "All", count: applications.length },
              ...APPLICATION_STAGES.filter((s) => counts[s.value]).map((s) => ({
                value: s.value,
                label: s.label,
                count: counts[s.value],
              })),
              ...(counts.Rejected
                ? [{ value: "Rejected", label: "Not selected", count: counts.Rejected }]
                : []),
            ]}
            className="mb-6"
          />

          <Card padded={false} className="overflow-hidden">
            <Table
              caption={`Applicants for ${job?.title ?? "this posting"}`}
              columns={columns}
              rows={shown}
              empty={
                <EmptyState
                  icon={<FiUsers />}
                  title="Nobody at this stage"
                  description="Move applicants through the pipeline and they'll appear here."
                />
              }
            />
          </Card>
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
        open={Boolean(action)}
        onClose={() => {
          setAction(null);
          setNote("");
        }}
        size="sm"
        title={
          action?.status === "Rejected"
            ? "Reject this applicant?"
            : `Move to ${action?.status ?? ""}?`
        }
        description={`${action?.app?.name ?? "The applicant"} will be notified.`}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setAction(null);
                setNote("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant={action?.status === "Rejected" ? "danger" : "primary"}
              loading={busy}
              onClick={move}
            >
              Confirm
            </Button>
          </>
        }
      >
        <Textarea
          label="Note (optional)"
          rows={3}
          maxLength={500}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Interview scheduled for Tuesday at 10am…"
          hint="Included in the notification the student receives."
        />
      </Modal>
    </>
  );
};

export default JobApplications;
