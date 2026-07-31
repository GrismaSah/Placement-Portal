import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { FiCheck, FiFileText, FiUploadCloud, FiUser } from "react-icons/fi";
import { Context } from "../../main";
import { api, apiError } from "../../lib/api";
import { invalidate, useQuery } from "../../lib/useQuery";
import { cn } from "../../lib/cn";
import PageHeader from "../Layout/PageHeader";
import { Button, Card, CardHeader, Input, Textarea } from "../ui";

/**
 * Three-step apply flow.
 *
 * The original was one long form that asked the student to retype their name,
 * email, phone, address and enrollment number — all of which the portal
 * already knows — and to re-upload a resume for every single application.
 *
 * Now: confirm what we hold, pick the saved resume or upload one, write the
 * cover letter. The draft is kept in sessionStorage so a mis-click does not
 * discard it.
 */

const STEPS = [
  { key: "profile", label: "Your details", icon: FiUser },
  { key: "resume", label: "Resume", icon: FiFileText },
  { key: "letter", label: "Cover letter", icon: FiUploadCloud },
];

// Matches the server cap. The platform rejects request bodies over ~4.5MB
// before Express sees them, so anything larger fails with an opaque error.
const MAX_BYTES = 4 * 1024 * 1024;

const Application = () => {
  const { id } = useParams();
  const { user } = useContext(Context);
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    address: user?.address ?? "",
    enrollment: user?.enrollment ?? "",
  });

  const draftKey = `jain-application-draft-${id}`;
  const [coverLetter, setCoverLetter] = useState(
    () => sessionStorage.getItem(draftKey) ?? ""
  );

  const [file, setFile] = useState(null);
  const [useSaved, setUseSaved] = useState(false);

  const { data: jobData } = useQuery(`/api/v1/job/${id}`);
  const { data: resumeData } = useQuery("/api/v1/resume/me");

  const job = jobData?.job;
  const savedResume = resumeData?.resume?.file?.fileId ? resumeData.resume.file : null;

  // Preselect the stored resume once it loads — that is the common case.
  useEffect(() => {
    if (savedResume) setUseSaved(true);
  }, [savedResume]);

  useEffect(() => {
    // Autosave, so navigating away mid-sentence does not lose the letter.
    sessionStorage.setItem(draftKey, coverLetter);
  }, [coverLetter, draftKey]);

  useEffect(() => {
    setForm((f) => ({
      ...f,
      name: f.name || user?.name || "",
      email: f.email || user?.email || "",
      phone: f.phone || user?.phone || "",
      address: f.address || user?.address || "",
      enrollment: f.enrollment || user?.enrollment || "",
    }));
  }, [user]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const pickFile = (e) => {
    const picked = e.target.files?.[0];
    if (!picked) return;
    if (picked.size > MAX_BYTES) {
      toast.error("Resume must be 4MB or smaller.");
      return;
    }
    setFile(picked);
    setUseSaved(false);
  };

  const canContinue =
    step === 0
      ? form.name && form.email && form.phone && form.address && form.enrollment
      : step === 1
        ? Boolean(useSaved ? savedResume : file)
        : coverLetter.trim().length >= 30;

  const submit = async (e) => {
    e.preventDefault();
    if (!canContinue) return;

    setSubmitting(true);
    const body = new FormData();
    Object.entries(form).forEach(([k, v]) => body.append(k, v));
    body.append("coverLetter", coverLetter);
    body.append("jobId", id);

    if (useSaved && savedResume) body.append("useSavedResume", "true");
    else body.append("resume", file);

    try {
      const { data } = await api.post("/api/v1/application/post", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      sessionStorage.removeItem(draftKey);
      // The applications list and this job's detail card both change.
      invalidate("/api/v1/application");
      toast.success(data.message || "Application submitted");
      navigate("/app/applications");
    } catch (err) {
      toast.error(apiError(err, "Could not submit your application."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Openings", to: "/app/jobs" },
          { label: job?.title ?? "Role", to: `/app/jobs/${id}` },
          { label: "Apply" },
        ]}
        title={job ? `Apply — ${job.title}` : "Apply"}
        description={job ? `${job.company} · ${job.city}` : undefined}
      />

      <div className="mx-auto max-w-2xl">
        {/* Step rail */}
        <ol className="mb-8 flex items-center">
          {STEPS.map((s, i) => {
            const done = i < step;
            const current = i === step;
            return (
              <li key={s.key} className={cn("flex items-center", i < STEPS.length - 1 && "flex-1")}>
                <button
                  type="button"
                  onClick={() => i < step && setStep(i)}
                  disabled={i > step}
                  className="flex items-center gap-2.5 disabled:cursor-default"
                >
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-full border-2 text-xs font-semibold transition-all",
                      done
                        ? "border-transparent bg-[var(--color-success-500)] text-white"
                        : current
                          ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--text-on-accent)]"
                          : "border-[var(--border-strong)] text-[var(--text-tertiary)]"
                    )}
                  >
                    {done ? <FiCheck aria-hidden="true" className="size-4" /> : i + 1}
                  </span>
                  <span
                    className={cn(
                      "hidden text-sm font-medium sm:block",
                      current ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"
                    )}
                  >
                    {s.label}
                  </span>
                </button>

                {i < STEPS.length - 1 && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "mx-3 h-0.5 flex-1 rounded-full",
                      done ? "bg-[var(--color-success-500)]" : "bg-[var(--border-strong)]"
                    )}
                  />
                )}
              </li>
            );
          })}
        </ol>

        <form onSubmit={submit}>
          {step === 0 && (
            <Card>
              <CardHeader
                title="Confirm your details"
                description="Prefilled from your profile. Edit anything that's out of date — this is what the recruiter sees."
              />
              <div className="space-y-5">
                <Input label="Full name" required value={form.name} onChange={set("name")} />
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input
                    label="Email"
                    type="email"
                    required
                    value={form.email}
                    onChange={set("email")}
                  />
                  <Input label="Phone" type="tel" required value={form.phone} onChange={set("phone")} />
                </div>
                <Input
                  label="Enrollment number"
                  required
                  value={form.enrollment}
                  onChange={set("enrollment")}
                />
                <Input label="Address" required value={form.address} onChange={set("address")} />
              </div>
            </Card>
          )}

          {step === 1 && (
            <Card>
              <CardHeader
                title="Attach your resume"
                description="The recruiter receives a permanent copy of whatever you send, so later profile edits won't change it."
              />

              <div className="space-y-3">
                {savedResume && (
                  <button
                    type="button"
                    onClick={() => {
                      setUseSaved(true);
                      setFile(null);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3.5 rounded-[var(--radius-field)] border p-4 text-left transition-all",
                      useSaved
                        ? "border-[var(--brand)] bg-[var(--brand-subtle)]"
                        : "border-[var(--border-strong)] hover:border-[var(--text-tertiary)]"
                    )}
                  >
                    <FiFileText
                      aria-hidden="true"
                      className="size-5 shrink-0 text-[var(--brand)]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-[var(--text-primary)]">
                        {savedResume.filename || "Saved resume"}
                      </span>
                      <span className="text-xs text-[var(--text-tertiary)]">
                        Use the resume on your profile
                      </span>
                    </span>
                    {useSaved && (
                      <FiCheck aria-hidden="true" className="size-5 text-[var(--brand)]" />
                    )}
                  </button>
                )}

                <label
                  className={cn(
                    "flex cursor-pointer flex-col items-center gap-2 rounded-[var(--radius-field)] border-2 border-dashed p-7 text-center transition-colors",
                    !useSaved && file
                      ? "border-[var(--brand)] bg-[var(--brand-subtle)]"
                      : "border-[var(--border-strong)] hover:border-[var(--brand)]"
                  )}
                >
                  <FiUploadCloud
                    aria-hidden="true"
                    className="size-7 text-[var(--text-tertiary)]"
                  />
                  <span className="font-medium text-[var(--text-primary)]">
                    {file ? file.name : "Upload a different resume"}
                  </span>
                  <span className="text-xs text-[var(--text-tertiary)]">
                    PDF, PNG, JPEG or WebP · up to 4MB
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    onChange={pickFile}
                    className="sr-only"
                  />
                </label>
              </div>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader
                title="Why you're a fit"
                description="Between 30 and 500 characters. Be specific about this role."
              />
              <Textarea
                label="Cover letter"
                required
                rows={9}
                maxLength={500}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder={`Dear ${job?.company ?? "team"}, …`}
                hint="Saved as you type."
                error={
                  coverLetter.length > 0 && coverLetter.trim().length < 30
                    ? "At least 30 characters."
                    : undefined
                }
              />
            </Card>
          )}

          <div className="mt-6 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => (step === 0 ? navigate(`/app/jobs/${id}`) : setStep(step - 1))}
            >
              {step === 0 ? "Cancel" : "Back"}
            </Button>

            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={() => setStep(step + 1)} disabled={!canContinue}>
                Continue
              </Button>
            ) : (
              <Button type="submit" loading={submitting} disabled={!canContinue}>
                Submit application
              </Button>
            )}
          </div>
        </form>
      </div>
    </>
  );
};

export default Application;
