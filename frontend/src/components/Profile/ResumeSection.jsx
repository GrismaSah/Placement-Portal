import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  FiCheckCircle,
  FiEye,
  FiFileText,
  FiPlus,
  FiTrash2,
  FiUploadCloud,
  FiX,
} from "react-icons/fi";
import { api, apiError } from "../../lib/api";
import { cn } from "../../lib/cn";
import { Button, Card, CardHeader, Input, Textarea } from "../ui";
import ResumeModal from "../Application/ResumeModal";

/**
 * Structured resume builder.
 *
 * `resume` is owned by Profile so socket pushes from the user's other devices
 * re-render this section.
 */

const EMPTY = {
  headline: "",
  summary: "",
  education: [],
  experience: [],
  projects: [],
  skills: [],
  links: { github: "", linkedin: "", portfolio: "" },
  file: null,
};

const BLANK_ROW = {
  education: { degree: "", institution: "", startYear: "", endYear: "", score: "" },
  experience: {
    role: "",
    company: "",
    startDate: "",
    endDate: "",
    current: false,
    description: "",
  },
  projects: { title: "", link: "", description: "" },
};

const prettyBytes = (n) => {
  if (!n && n !== 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

const SectionRows = ({ title, description, rows, onAdd, children }) => (
  <Card>
    <CardHeader
      title={title}
      description={description}
      actions={
        <Button type="button" size="sm" variant="outline" leadingIcon={<FiPlus />} onClick={onAdd}>
          Add
        </Button>
      }
    />
    {rows.length === 0 ? (
      <p className="rounded-[var(--radius-field)] bg-[var(--surface-hover)] px-4 py-5 text-center text-sm text-[var(--text-tertiary)]">
        Nothing added yet.
      </p>
    ) : (
      <div className="space-y-5">{children}</div>
    )}
  </Card>
);

const RowShell = ({ index, onRemove, children }) => (
  <div className="relative rounded-[var(--radius-field)] border border-[var(--border)] p-4">
    <button
      type="button"
      onClick={() => onRemove(index)}
      aria-label={`Remove entry ${index + 1}`}
      className="absolute top-3 right-3 grid size-8 place-items-center rounded-full text-[var(--text-tertiary)] transition-colors hover:bg-[var(--color-danger-50)] hover:text-[var(--color-danger-500)]"
    >
      <FiX className="size-4" />
    </button>
    <div className="space-y-4 pr-8">{children}</div>
  </div>
);

const ResumeSection = ({ resume, onChange }) => {
  const [draft, setDraft] = useState(EMPTY);
  const [skillInput, setSkillInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewing, setViewing] = useState(false);
  const fileInputRef = useRef(null);

  // Re-seed from server state, including on a push from another device.
  useEffect(() => {
    setDraft({
      ...EMPTY,
      ...(resume ?? {}),
      links: { ...EMPTY.links, ...(resume?.links ?? {}) },
      education: resume?.education ?? [],
      experience: resume?.experience ?? [],
      projects: resume?.projects ?? [],
      skills: resume?.skills ?? [],
    });
  }, [resume]);

  const setField = (field, value) => setDraft((d) => ({ ...d, [field]: value }));

  const setRow = (section, index, field, value) =>
    setDraft((d) => {
      const rows = [...d[section]];
      rows[index] = { ...rows[index], [field]: value };
      return { ...d, [section]: rows };
    });

  const addRow = (section) =>
    setDraft((d) => ({ ...d, [section]: [...d[section], { ...BLANK_ROW[section] }] }));

  const removeRow = (section, index) =>
    setDraft((d) => ({ ...d, [section]: d[section].filter((_, i) => i !== index) }));

  const addSkill = () => {
    const value = skillInput.trim();
    if (!value) return;
    if (draft.skills.includes(value)) {
      setSkillInput("");
      return;
    }
    setDraft((d) => ({ ...d, skills: [...d.skills, value] }));
    setSkillInput("");
  };

  const file = resume?.file?.fileId ? resume.file : null;

  // Drives the completeness meter on this screen only. Deliberately NOT the
  // same set as the dashboard ring in StudentDashboard: that one scores the
  // whole profile (10 checks, including name/email/phone/address/enrollment),
  // whereas this one scores only the résumé fields editable on this form. The
  // two percentages will differ for the same student, and that is correct —
  // but do not describe them as identical, which an earlier comment here did.
  const completeness = useMemo(() => {
    const checks = [
      Boolean(draft.headline),
      Boolean(draft.summary),
      draft.education.length > 0,
      draft.experience.length > 0 || draft.projects.length > 0,
      draft.skills.length > 0,
      Boolean(file),
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [draft, file]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put("/api/v1/resume/me", {
        headline: draft.headline,
        summary: draft.summary,
        education: draft.education,
        experience: draft.experience,
        projects: draft.projects,
        skills: draft.skills,
        links: draft.links,
      });
      onChange?.(data.resume);
      toast.success(data.message || "Resume saved");
    } catch (err) {
      toast.error(apiError(err, "Could not save your resume."));
    } finally {
      setSaving(false);
    }
  };

  const uploadFile = async (e) => {
    const picked = e.target.files?.[0];
    if (!picked) return;

    const body = new FormData();
    body.append("resume", picked);

    setUploading(true);
    try {
      const { data } = await api.post("/api/v1/resume/me/file", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChange?.(data.resume);
      toast.success(data.message || "Resume uploaded");
    } catch (err) {
      toast.error(apiError(err, "Could not upload the file."));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const deleteFile = async () => {
    try {
      const { data } = await api.delete("/api/v1/resume/me/file");
      onChange?.(data.resume);
      toast.success(data.message || "File removed");
    } catch (err) {
      toast.error(apiError(err, "Could not remove the file."));
    }
  };

  return (
    <form onSubmit={save} className="space-y-6">
      {/* ---- Completeness + file ---- */}
      <Card>
        <CardHeader
          title="Resume file"
          description="Attach a PDF once and reuse it on every application."
        />

        <div className="mb-5">
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-sm font-medium text-[var(--text-primary)]">
              Profile completeness
            </span>
            <span data-numeric className="text-sm font-bold text-[var(--text-primary)]">
              {completeness}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-active)]">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-[700ms] ease-[var(--ease-spring)]"
              style={{ width: `${completeness}%` }}
            />
          </div>
        </div>

        {file ? (
          <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius-field)] border border-[var(--border)] p-4">
            <FiFileText aria-hidden="true" className="size-6 shrink-0 text-[var(--brand)]" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-[var(--text-primary)]">
                {file.filename}
              </p>
              <p className="text-xs text-[var(--text-tertiary)]">
                {prettyBytes(file.size)}
                {file.uploadedAt
                  ? ` · uploaded ${new Date(file.uploadedAt).toLocaleDateString("en-IN")}`
                  : ""}
              </p>
            </div>
            <div className="flex gap-1.5">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                leadingIcon={<FiEye />}
                onClick={() => setViewing(true)}
              >
                View
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                loading={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                Replace
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                aria-label="Delete resume file"
                className="text-[var(--color-danger-500)] hover:bg-[var(--color-danger-50)]"
                onClick={deleteFile}
              >
                <FiTrash2 className="size-4" />
              </Button>
            </div>
          </div>
        ) : (
          <label
            className={cn(
              "flex cursor-pointer flex-col items-center gap-2 rounded-[var(--radius-field)]",
              "border-2 border-dashed border-[var(--border-strong)] p-8 text-center",
              "transition-colors hover:border-[var(--brand)]"
            )}
          >
            <FiUploadCloud aria-hidden="true" className="size-7 text-[var(--text-tertiary)]" />
            <span className="font-medium text-[var(--text-primary)]">
              {uploading ? "Uploading…" : "Upload your resume"}
            </span>
            <span className="text-xs text-[var(--text-tertiary)]">
              PDF, PNG, JPEG or WebP · up to 4MB
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={uploadFile}
              className="sr-only"
            />
          </label>
        )}

        {/* Kept mounted for the "Replace" path above. */}
        {file && (
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            onChange={uploadFile}
            className="sr-only"
          />
        )}
      </Card>

      {/* ---- Basics ---- */}
      <Card>
        <CardHeader title="About you" />
        <div className="space-y-5">
          <Input
            label="Headline"
            maxLength={150}
            value={draft.headline}
            onChange={(e) => setField("headline", e.target.value)}
            placeholder="Final-year CS student · Full-stack developer"
          />
          <Textarea
            label="Summary"
            rows={5}
            maxLength={2000}
            value={draft.summary}
            onChange={(e) => setField("summary", e.target.value)}
            placeholder="A few lines on what you build and what you're looking for."
          />
        </div>
      </Card>

      {/* ---- Skills ---- */}
      <Card>
        <CardHeader title="Skills" description="Press Enter to add each one." />
        <div className="flex gap-2">
          <Input
            wrapperClassName="flex-1"
            aria-label="Add a skill"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSkill();
              }
            }}
            placeholder="React, Python, SQL…"
          />
          <Button type="button" variant="outline" onClick={addSkill} className="shrink-0">
            Add
          </Button>
        </div>

        {draft.skills.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {draft.skills.map((skill) => (
              <li key={skill}>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-subtle)] py-1.5 pr-1.5 pl-3 text-sm font-medium text-[var(--brand)]">
                  {skill}
                  <button
                    type="button"
                    onClick={() =>
                      setField(
                        "skills",
                        draft.skills.filter((s) => s !== skill)
                      )
                    }
                    aria-label={`Remove ${skill}`}
                    className="grid size-5 place-items-center rounded-full transition-colors hover:bg-[var(--brand)] hover:text-white"
                  >
                    <FiX className="size-3" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* ---- Education ---- */}
      <SectionRows
        title="Education"
        rows={draft.education}
        onAdd={() => addRow("education")}
      >
        {draft.education.map((row, i) => (
          <RowShell key={i} index={i} onRemove={(idx) => removeRow("education", idx)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Degree"
                value={row.degree ?? ""}
                onChange={(e) => setRow("education", i, "degree", e.target.value)}
                placeholder="B.Tech Computer Science"
              />
              <Input
                label="Institution"
                value={row.institution ?? ""}
                onChange={(e) => setRow("education", i, "institution", e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Start year"
                type="number"
                value={row.startYear ?? ""}
                onChange={(e) => setRow("education", i, "startYear", e.target.value)}
              />
              <Input
                label="End year"
                type="number"
                value={row.endYear ?? ""}
                onChange={(e) => setRow("education", i, "endYear", e.target.value)}
              />
              <Input
                label="Score"
                value={row.score ?? ""}
                onChange={(e) => setRow("education", i, "score", e.target.value)}
                placeholder="8.9 CGPA"
              />
            </div>
          </RowShell>
        ))}
      </SectionRows>

      {/* ---- Experience ---- */}
      <SectionRows
        title="Experience"
        description="Internships, part-time work, freelance."
        rows={draft.experience}
        onAdd={() => addRow("experience")}
      >
        {draft.experience.map((row, i) => (
          <RowShell key={i} index={i} onRemove={(idx) => removeRow("experience", idx)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Role"
                value={row.role ?? ""}
                onChange={(e) => setRow("experience", i, "role", e.target.value)}
              />
              <Input
                label="Company"
                value={row.company ?? ""}
                onChange={(e) => setRow("experience", i, "company", e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Start date"
                type="month"
                value={(row.startDate ?? "").slice(0, 7)}
                onChange={(e) => setRow("experience", i, "startDate", e.target.value)}
              />
              <Input
                label="End date"
                type="month"
                disabled={row.current}
                value={(row.endDate ?? "").slice(0, 7)}
                onChange={(e) => setRow("experience", i, "endDate", e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2.5 text-sm text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={Boolean(row.current)}
                onChange={(e) => setRow("experience", i, "current", e.target.checked)}
                className="size-4 rounded border-[var(--border-strong)] accent-[var(--brand)]"
              />
              I currently work here
            </label>
            <Textarea
              label="What you did"
              rows={3}
              value={row.description ?? ""}
              onChange={(e) => setRow("experience", i, "description", e.target.value)}
            />
          </RowShell>
        ))}
      </SectionRows>

      {/* ---- Projects ---- */}
      <SectionRows title="Projects" rows={draft.projects} onAdd={() => addRow("projects")}>
        {draft.projects.map((row, i) => (
          <RowShell key={i} index={i} onRemove={(idx) => removeRow("projects", idx)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Title"
                value={row.title ?? ""}
                onChange={(e) => setRow("projects", i, "title", e.target.value)}
              />
              <Input
                label="Link"
                type="url"
                value={row.link ?? ""}
                onChange={(e) => setRow("projects", i, "link", e.target.value)}
                placeholder="https://github.com/…"
              />
            </div>
            <Textarea
              label="Description"
              rows={3}
              value={row.description ?? ""}
              onChange={(e) => setRow("projects", i, "description", e.target.value)}
            />
          </RowShell>
        ))}
      </SectionRows>

      {/* ---- Links ---- */}
      <Card>
        <CardHeader title="Links" />
        <div className="grid gap-5 sm:grid-cols-3">
          {["github", "linkedin", "portfolio"].map((key) => (
            <Input
              key={key}
              label={key[0].toUpperCase() + key.slice(1)}
              type="url"
              value={draft.links?.[key] ?? ""}
              onChange={(e) =>
                setField("links", { ...draft.links, [key]: e.target.value })
              }
              placeholder="https://…"
            />
          ))}
        </div>
      </Card>

      {/* Sticky save bar — the form is long enough that a footer button would
          be permanently off-screen while editing. */}
      <div className="sticky bottom-20 z-10 flex justify-end lg:bottom-4">
        <Button type="submit" size="lg" loading={saving} leadingIcon={<FiCheckCircle />}>
          Save resume
        </Button>
      </div>

      {viewing && file && (
        <ResumeModal
          open
          fileId={file.fileId}
          contentType={file.contentType}
          filename={file.filename}
          onClose={() => setViewing(false)}
        />
      )}
    </form>
  );
};

export default ResumeSection;
