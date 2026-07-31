import { useState } from "react";
import toast from "react-hot-toast";
import { FiCheck, FiMail, FiMapPin, FiPhone, FiUserCheck, FiX } from "react-icons/fi";
import { api, apiError } from "../../lib/api";
import { invalidate, useQuery } from "../../lib/useQuery";
import PageHeader from "../Layout/PageHeader";
import { Avatar, Button, Card, EmptyState, Modal, Skeleton } from "../ui";

/**
 * Recruiter approval queue.
 *
 * Replaces a bare <select> per row inside the old three-in-one applications
 * file. Approving a recruiter grants them the ability to post to the entire
 * student body, so it now reads as a decision — full contact details, and a
 * confirmation step — rather than a dropdown that fires on change.
 */
const TnpApprovals = () => {
  const { data, isInitialLoading, refetch } = useQuery("/api/v1/tpo/pending-tnps");
  const [action, setAction] = useState(null); // { tnp, decision }
  const [busy, setBusy] = useState(false);

  const pending = data?.pendingTNPs ?? [];

  const decide = async () => {
    if (!action) return;
    setBusy(true);
    try {
      await api.post("/api/v1/tpo/tnp-request", {
        userId: action.tnp._id,
        action: action.decision,
      });
      invalidate("/api/v1/tpo");
      toast.success(
        action.decision === "Approved" ? "Recruiter approved" : "Recruiter declined"
      );
      setAction(null);
      refetch();
    } catch (err) {
      toast.error(apiError(err, "Could not record that decision."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Recruiter approvals"
        description="Recruiters must be approved before their postings reach students."
      />

      {isInitialLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-52" rounded="rounded-[var(--radius-card)]" />
          ))}
        </div>
      ) : pending.length === 0 ? (
        <Card padded={false}>
          <EmptyState
            icon={<FiUserCheck />}
            title="Nothing to review"
            description="Every recruiter request has been actioned. New requests will appear here automatically."
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {pending.map((tnp) => (
            <Card key={tnp._id}>
              <div className="flex items-start gap-3.5">
                <Avatar user={tnp} size={48} />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[var(--text-primary)]">
                    {tnp.name}
                  </p>
                  <p className="text-sm text-[var(--text-tertiary)]">
                    Requested{" "}
                    {tnp.createdAt
                      ? new Date(tnp.createdAt).toLocaleDateString("en-IN", {
                          dateStyle: "medium",
                        })
                      : "recently"}
                  </p>
                </div>
              </div>

              <dl className="mt-5 space-y-2.5 border-t border-[var(--border)] pt-4 text-sm">
                <div className="flex items-center gap-2.5">
                  <FiMail aria-hidden="true" className="size-4 shrink-0 text-[var(--text-tertiary)]" />
                  <a
                    href={`mailto:${tnp.email}`}
                    className="truncate text-[var(--brand)] hover:underline"
                  >
                    {tnp.email}
                  </a>
                </div>
                {tnp.phone && (
                  <div className="flex items-center gap-2.5">
                    <FiPhone aria-hidden="true" className="size-4 shrink-0 text-[var(--text-tertiary)]" />
                    <span className="text-[var(--text-secondary)]">{tnp.phone}</span>
                  </div>
                )}
                {tnp.address && (
                  <div className="flex items-start gap-2.5">
                    <FiMapPin
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-[var(--text-tertiary)]"
                    />
                    <span className="text-[var(--text-secondary)]">{tnp.address}</span>
                  </div>
                )}
              </dl>

              <div className="mt-5 flex gap-2.5 border-t border-[var(--border)] pt-4">
                <Button
                  size="sm"
                  fullWidth
                  leadingIcon={<FiCheck />}
                  onClick={() => setAction({ tnp, decision: "Approved" })}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  fullWidth
                  variant="outline"
                  leadingIcon={<FiX />}
                  onClick={() => setAction({ tnp, decision: "Declined" })}
                >
                  Decline
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(action)}
        onClose={() => setAction(null)}
        size="sm"
        title={
          action?.decision === "Approved" ? "Approve this recruiter?" : "Decline this recruiter?"
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setAction(null)}>
              Cancel
            </Button>
            <Button
              variant={action?.decision === "Approved" ? "primary" : "danger"}
              loading={busy}
              onClick={decide}
            >
              {action?.decision === "Approved" ? "Approve" : "Decline"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-[var(--text-secondary)]">
          {action?.decision === "Approved" ? (
            <>
              <strong className="text-[var(--text-primary)]">{action?.tnp?.name}</strong> will
              be able to post openings visible to every student, and to view applicant
              details and resumes.
            </>
          ) : (
            <>
              <strong className="text-[var(--text-primary)]">{action?.tnp?.name}</strong> will
              not be able to post openings. They&rsquo;ll be notified by email.
            </>
          )}
        </p>
      </Modal>
    </>
  );
};

export default TnpApprovals;
