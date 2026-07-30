import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import ResumeModal from "../Application/ResumeModal";

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
  experience: { role: "", company: "", startDate: "", endDate: "", current: false, description: "" },
  projects: { title: "", link: "", description: "" },
};

const prettyBytes = (n) => {
  if (!n && n !== 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

/** `resume` is owned by Profile so socket pushes re-render this section. */
const ResumeSection = ({ resume, setResume }) => {
  const [draft, setDraft] = useState(EMPTY);
  const [skillInput, setSkillInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewing, setViewing] = useState(false);
  const fileInputRef = useRef(null);

  // Re-seed from server state, including when a push arrives from another device.
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

  const save = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await axios.put(
        "/api/v1/resume/me",
        {
          headline: draft.headline,
          summary: draft.summary,
          education: draft.education,
          experience: draft.experience,
          projects: draft.projects,
          skills: draft.skills,
          links: draft.links,
        },
        { withCredentials: true }
      );
      setResume(res.data.resume);
      toast.success(res.data.message || "Resume saved.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not save resume.");
    } finally {
      setSaving(false);
    }
  };

  const uploadFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const form = new FormData();
    form.append("resume", file);

    try {
      setUploading(true);
      const res = await axios.post("/api/v1/resume/me/file", form, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResume(res.data.resume);
      toast.success(res.data.message || "Resume uploaded.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not upload resume.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const deleteFile = async () => {
    try {
      const res = await axios.delete("/api/v1/resume/me/file", { withCredentials: true });
      setResume(res.data.resume);
      toast.success(res.data.message || "Resume file removed.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not remove file.");
    }
  };

  const deleteAll = async () => {
    try {
      const res = await axios.delete("/api/v1/resume/me", { withCredentials: true });
      setResume(res.data.resume ?? null);
      toast.success(res.data.message || "Resume deleted.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not delete resume.");
    }
  };

  const file = resume?.file?.fileId ? resume.file : null;

  return (
    <div className="panel resume_panel">
      <h3>My Resume</h3>

      {/* ---- attached file ---- */}
      <div className="resume_file">
        {file ? (
          <div className="resume_file_card">
            <div className="resume_file_meta">
              <p className="resume_file_name">{file.filename}</p>
              <p className="resume_file_sub">
                {prettyBytes(file.size)}
                {file.uploadedAt
                  ? ` · uploaded ${new Date(file.uploadedAt).toLocaleDateString("en-IN")}`
                  : ""}
              </p>
            </div>
            <div className="resume_file_actions">
              <button type="button" onClick={() => setViewing(true)}>View</button>
              <button type="button" onClick={() => fileInputRef.current?.click()}>
                Replace
              </button>
              <button type="button" className="danger" onClick={deleteFile}>
                Delete
              </button>
            </div>
          </div>
        ) : (
          <div className="resume_file_empty">
            <p>No resume file attached.</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Uploading…" : "Upload PDF"}
            </button>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,image/png,image/jpeg,image/webp"
          onChange={uploadFile}
          hidden
        />
        <small className="hint">PDF, PNG, JPEG or WebP · up to 5MB</small>
      </div>

      {/* ---- structured builder ---- */}
      <form onSubmit={save} className="resume_form">
        <label>
          Headline
          <input
            type="text"
            value={draft.headline}
            onChange={(e) => setField("headline", e.target.value)}
            placeholder="Final-year CSE student · aspiring backend engineer"
          />
        </label>

        <label>
          Summary
          <textarea
            rows={3}
            value={draft.summary}
            onChange={(e) => setField("summary", e.target.value)}
            placeholder="A short paragraph about you."
          />
        </label>

        {[
          { key: "education", title: "Education", fields: ["degree", "institution", "startYear", "endYear", "score"] },
          { key: "experience", title: "Experience", fields: ["role", "company", "startDate", "endDate", "description"] },
          { key: "projects", title: "Projects", fields: ["title", "link", "description"] },
        ].map(({ key, title, fields }) => (
          <fieldset key={key} className="resume_group">
            <legend>{title}</legend>
            {draft[key].length === 0 && <p className="resume_empty_row">Nothing added yet.</p>}
            {draft[key].map((row, index) => (
              <div className="resume_row" key={index}>
                {fields.map((f) =>
                  f === "description" ? (
                    <textarea
                      key={f}
                      rows={2}
                      className="wide"
                      value={row[f] ?? ""}
                      onChange={(e) => setRow(key, index, f, e.target.value)}
                      placeholder={f}
                    />
                  ) : (
                    <input
                      key={f}
                      type="text"
                      value={row[f] ?? ""}
                      onChange={(e) => setRow(key, index, f, e.target.value)}
                      placeholder={f}
                    />
                  )
                )}
                <button
                  type="button"
                  className="danger row_remove"
                  onClick={() => removeRow(key, index)}
                  aria-label={`Remove ${title} entry ${index + 1}`}
                >
                  Remove
                </button>
              </div>
            ))}
            <button type="button" className="ghost" onClick={() => addRow(key)}>
              + Add {title.replace(/s$/, "")}
            </button>
          </fieldset>
        ))}

        <fieldset className="resume_group">
          <legend>Skills</legend>
          <div className="skill_tags">
            {draft.skills.map((s) => (
              <span className="skill_tag" key={s}>
                {s}
                <button
                  type="button"
                  onClick={() => setField("skills", draft.skills.filter((x) => x !== s))}
                  aria-label={`Remove ${s}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="skill_input">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                // Enter must not submit the whole form here.
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSkill();
                }
              }}
              placeholder="Type a skill and press Enter"
            />
            <button type="button" className="ghost" onClick={addSkill}>
              Add
            </button>
          </div>
        </fieldset>

        <fieldset className="resume_group">
          <legend>Links</legend>
          {["github", "linkedin", "portfolio"].map((k) => (
            <input
              key={k}
              type="url"
              value={draft.links?.[k] ?? ""}
              onChange={(e) => setField("links", { ...draft.links, [k]: e.target.value })}
              placeholder={`${k} URL`}
            />
          ))}
        </fieldset>

        <div className="resume_actions">
          <button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save Resume"}
          </button>
          {resume && (
            <button type="button" className="danger" onClick={deleteAll}>
              Delete Entire Resume
            </button>
          )}
        </div>
      </form>

      {viewing && file && (
        <ResumeModal
          fileId={file.fileId}
          contentType={file.contentType}
          filename={file.filename}
          onClose={() => setViewing(false)}
        />
      )}
    </div>
  );
};

export default ResumeSection;
