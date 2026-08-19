import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiBriefcase,
  FiEdit2,
  FiEyeOff,
  FiMapPin,
  FiPlus,
  FiTrash2,
  FiUsers,
} from "react-icons/fi";
import { api, apiError } from "../../lib/api";
import { invalidate, useQuery } from "../../lib/useQuery";
import { categoryLabel, companyLogo } from "../../constants/jobTaxonomy";
import PageHeader from "../Layout/PageHeader";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  Skeleton,
  Textarea,
} from "../ui";
import { salaryLabel } from "./Jobs";

/**
 * The recruiter's postings.
 *
 * Replaces an inline-editable table where every cell became an input at once.
 * Editing now happens in a focused dialog, and closing a posting is offered
 * separately from deleting it — the server refuses to delete a posting that
 * has applications, because students are relying on those records.
 */
const MyJobs = () => {
  const { data, isInitialLoading, error, refetch } = useQuery("/api/v1/job/getmyjobs");
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const jobs = data?.myJobs ?? [];

  const save = async () => {
    setBusy(true);
    try {
      await api.put(`/api/v1/job/update/${editing._id}`, {
        title: editing.title,
        description: editing.description,
        city: editing.city,
        country: editing.country,
        company: editing.company,
      });
      invalidate("/api/v1/job");
      toast.success("Posting updated");
      setEditing(null);
      refetch();
    } catch (err) {
      toast.error(apiError(err, "Could not update the posting."));
    } finally {
      setBusy(false);
    }
  };

  const toggleExpired = async (job) => {
    try {
      await api.put(`/api/v1/job/update/${job._id}`, { expired: !job.expired });
      invalidate("/api/v1/job");
      toast.success(job.expired ? "Posting reopened" : "Posting closed");
      refetch();
    } catch (err) {
      toast.error(apiError(err, "Could not change the posting."));
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/api/v1/job/delete/${confirmDelete._id}`);
      invalidate("/api/v1/job");
      toast.success("Posting deleted");
      setConfirmDelete(null);
      refetch();
    } catch (err) {
      toast.error(apiError(err, "Could not delete the posting."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="My postings"
        description="Everything you've published, with live applicant counts."
        actions={
          <Button to="/app/postings/new" leadingIcon={<FiPlus />}>
            Post a role
          </Button>
        }
      />

      {isInitialLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-60" rounded="rounded-[var(--radius-card)]" />
          ))}
        </div>
      ) : error ? (
        // Not the empty state: telling a recruiter with live postings that they
        // have none is worse than telling them the request failed.
        <Card padded={false}>
          <ErrorState
            title="Couldn't load your postings"
            error={error}
            onRetry={refetch}
          />
        </Card>
      ) : jobs.length === 0 ? (
        <Card padded={false}>
          <EmptyState
            icon={<FiBriefcase />}
            title="You haven't posted a role yet"
            description="Publish an opening and it becomes visible to every eligible student straight away."
            action="Post your first role"
            actionTo="/app/postings/new"
          />
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => {
            const Logo = companyLogo(job.company);
            return (
              <Card key={job._id} className="flex flex-col">
                <div className="flex items-start gap-3.5">
                  <span
                    aria-hidden="true"
                    className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--surface-hover)] text-[var(--text-secondary)]"
                  >
                    <Logo className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-[var(--text-primary)]">
                      {job.title}
                    </h3>
                    <p className="truncate text-sm text-[var(--text-secondary)]">
                      {job.company}
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
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--text-tertiary)]">
                  <span className="flex items-center gap-1.5">
                    <FiMapPin aria-hidden="true" className="size-3.5" />
                    {job.city}
                  </span>
                  <span data-numeric className="font-semibold text-[var(--text-primary)]">
                    {salaryLabel(job)}
                  </span>
                </div>

                <Badge tone="brand" size="sm" className="mt-3 self-start">
                  {categoryLabel(job.category)}
                </Badge>

                <Link
                  to={`/app/postings/${job._id}/applicants`}
                  className="mt-4 flex items-center justify-between gap-3 rounded-[var(--radius-field)] bg-[var(--surface-hover)] px-3.5 py-2.5 transition-colors hover:bg-[var(--surface-active)]"
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                    <FiUsers aria-hidden="true" className="size-4" />
                    Applicants
                  </span>
                  <span data-numeric className="font-bold text-[var(--text-primary)]">
                    {job.applicationCount ?? 0}
                  </span>
                </Link>

                <div className="mt-auto flex flex-wrap gap-1.5 border-t border-[var(--border)] pt-4 [margin-top:1rem]">
                  <Button
                    size="sm"
                    variant="ghost"
                    leadingIcon={<FiEdit2 />}
                    onClick={() => setEditing({ ...job })}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    leadingIcon={<FiEyeOff />}
                    onClick={() => toggleExpired(job)}
                  >
                    {job.expired ? "Reopen" : "Close"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={`Delete ${job.title}`}
                    className="text-[var(--color-danger-500)] hover:bg-[var(--color-danger-50)]"
                    onClick={() => setConfirmDelete(job)}
                  >
                    <FiTrash2 className="size-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit dialog */}
      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Edit posting"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button loading={busy} onClick={save}>
              Save changes
            </Button>
          </>
        }
      >
        {editing && (
          <div className="space-y-5">
            <Input
              label="Job title"
              maxLength={30}
              value={editing.title}
              onChange={(e) => setEditing((j) => ({ ...j, title: e.target.value }))}
            />
            <Input
              label="Company"
              value={editing.company}
              onChange={(e) => setEditing((j) => ({ ...j, company: e.target.value }))}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="City"
                value={editing.city}
                onChange={(e) => setEditing((j) => ({ ...j, city: e.target.value }))}
              />
              <Input
                label="Country"
                value={editing.country}
                onChange={(e) => setEditing((j) => ({ ...j, country: e.target.value }))}
              />
            </div>
            <Textarea
              label="Description"
              rows={6}
              maxLength={500}
              value={editing.description}
              onChange={(e) => setEditing((j) => ({ ...j, description: e.target.value }))}
            />
          </div>
        )}
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        size="sm"
        title="Delete this posting?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={busy} onClick={remove}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-[var(--text-secondary)]">
          <strong className="text-[var(--text-primary)]">{confirmDelete?.title}</strong> will
          be removed permanently.
          {confirmDelete?.applicationCount > 0 && (
            <>
              {" "}
              It has {confirmDelete.applicationCount} application(s), so it cannot be
              deleted — close it instead to stop new applications while keeping the
              records.
            </>
          )}
        </p>
      </Modal>
    </>
  );
};

export default MyJobs;
