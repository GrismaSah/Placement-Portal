import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiAlertCircle } from "react-icons/fi";
import { Context } from "../../main";
import { api, apiError } from "../../lib/api";
import { invalidate } from "../../lib/useQuery";
import { cn } from "../../lib/cn";
import { JOB_CATEGORIES } from "../../constants/jobTaxonomy";
import PageHeader from "../Layout/PageHeader";
import { Button, Card, CardHeader, Input, Select, Textarea } from "../ui";

/**
 * Create a posting.
 *
 * Adds the drive fields the schema never had — closing date, drive date,
 * openings and eligibility — so students can see what they are applying to and
 * whether they qualify.
 */

const SALARY_MODES = [
  { value: "fixed", label: "Fixed" },
  { value: "range", label: "Range" },
];

const BRANCHES = [
  "Computer Science",
  "Information Science",
  "Electronics",
  "Electrical",
  "Mechanical",
  "Civil",
  "Aerospace",
  "Biotechnology",
];

const PostJob = () => {
  const { user } = useContext(Context);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    company: "",
    category: "",
    city: "",
    country: "India",
    description: "",
    fixedSalary: "",
    salaryFrom: "",
    salaryTo: "",
    applicationDeadline: "",
    driveDate: "",
    openings: "",
    minCgpa: "",
    maxBacklogs: "",
  });
  const [salaryMode, setSalaryMode] = useState("fixed");
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const notApproved = user?.status && user.status !== "Approved";

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // The server rejects fixed and ranged salary sent together, so only the
    // selected mode's fields are included at all.
    const salary =
      salaryMode === "fixed"
        ? { fixedSalary: Number(form.fixedSalary) }
        : { salaryFrom: Number(form.salaryFrom), salaryTo: Number(form.salaryTo) };

    const eligibility = {};
    if (form.minCgpa) eligibility.minCgpa = Number(form.minCgpa);
    if (form.maxBacklogs !== "") eligibility.maxBacklogs = Number(form.maxBacklogs);
    if (branches.length) eligibility.allowedBranches = branches;

    try {
      const { data } = await api.post("/api/v1/job/post", {
        title: form.title,
        company: form.company,
        category: form.category,
        city: form.city,
        country: form.country,
        description: form.description,
        ...salary,
        applicationDeadline: form.applicationDeadline || undefined,
        driveDate: form.driveDate || undefined,
        openings: form.openings ? Number(form.openings) : undefined,
        eligibility: Object.keys(eligibility).length ? eligibility : undefined,
      });
      invalidate("/api/v1/job");
      toast.success(data.message || "Posting published");
      navigate("/app/postings");
    } catch (err) {
      toast.error(apiError(err, "Could not publish the posting."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "My postings", to: "/app/postings" }, { label: "New" }]}
        title="Post a role"
        description="Published postings are visible to every eligible student immediately."
      />

      {notApproved && (
        <Card className="mb-6 border-[var(--color-warning-500)]/30 bg-[var(--color-warning-50)]">
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
                The Placement Office must approve your account before you can publish a
                posting.
              </p>
            </div>
          </div>
        </Card>
      )}

      <form onSubmit={submit} className="mx-auto max-w-3xl space-y-6">
        <Card>
          <CardHeader title="The role" />
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Job title"
                required
                maxLength={30}
                value={form.title}
                onChange={set("title")}
                placeholder="Software Engineer Intern"
              />
              <Input
                label="Company"
                required
                value={form.company}
                onChange={set("company")}
                placeholder="Acme Corp"
              />
            </div>

            <Select
              label="Function"
              required
              value={form.category}
              onChange={set("category")}
              placeholder="Select a function"
              options={JOB_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <Input label="City" required value={form.city} onChange={set("city")} />
              <Input label="Country" required value={form.country} onChange={set("country")} />
            </div>

            <Textarea
              label="Description"
              required
              rows={6}
              maxLength={500}
              value={form.description}
              onChange={set("description")}
              hint="Between 30 and 500 characters."
              placeholder="What the role involves, the team, and what you're looking for…"
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Package" />

          <div
            role="radiogroup"
            aria-label="Salary type"
            className="mb-5 inline-flex gap-1 rounded-[var(--radius-field)] bg-[var(--surface-hover)] p-1"
          >
            {SALARY_MODES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={salaryMode === value}
                onClick={() => setSalaryMode(value)}
                className={cn(
                  "h-9 rounded-[calc(var(--radius-field)-3px)] px-4 text-sm font-medium transition-colors",
                  salaryMode === value
                    ? "bg-[var(--surface-raised)] text-[var(--text-primary)] shadow-[var(--shadow-xs)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {salaryMode === "fixed" ? (
            <Input
              label="Annual CTC (₹)"
              type="number"
              required
              min={1000}
              value={form.fixedSalary}
              onChange={set("fixedSalary")}
              placeholder="1200000"
              hint="In rupees, e.g. 1200000 for ₹12 L."
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="From (₹)"
                type="number"
                required
                min={1000}
                value={form.salaryFrom}
                onChange={set("salaryFrom")}
              />
              <Input
                label="To (₹)"
                type="number"
                required
                min={1000}
                value={form.salaryTo}
                onChange={set("salaryTo")}
              />
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Drive details"
            description="All optional — leave blank if they don't apply."
          />
          <div className="grid gap-5 sm:grid-cols-3">
            <Input
              label="Apply by"
              type="date"
              value={form.applicationDeadline}
              onChange={set("applicationDeadline")}
            />
            <Input
              label="Drive date"
              type="date"
              value={form.driveDate}
              onChange={set("driveDate")}
            />
            <Input
              label="Openings"
              type="number"
              min={1}
              value={form.openings}
              onChange={set("openings")}
            />
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Eligibility"
            description="Shown on the posting so students know before they apply. Leave blank for no restriction."
          />
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Minimum CGPA"
                type="number"
                step="0.1"
                min={0}
                max={10}
                value={form.minCgpa}
                onChange={set("minCgpa")}
                placeholder="7.5"
              />
              <Input
                label="Maximum active backlogs"
                type="number"
                min={0}
                value={form.maxBacklogs}
                onChange={set("maxBacklogs")}
                placeholder="0"
              />
            </div>

            <fieldset>
              <legend className="mb-2 text-sm font-medium text-[var(--text-primary)]">
                Open to branches
              </legend>
              <div className="flex flex-wrap gap-2">
                {BRANCHES.map((b) => {
                  const on = branches.includes(b);
                  return (
                    <button
                      key={b}
                      type="button"
                      aria-pressed={on}
                      onClick={() =>
                        setBranches((prev) =>
                          on ? prev.filter((x) => x !== b) : [...prev, b]
                        )
                      }
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                        on
                          ? "border-[var(--brand)] bg-[var(--brand-subtle)] text-[var(--brand)]"
                          : "border-[var(--border-strong)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]"
                      )}
                    >
                      {b}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-[var(--text-tertiary)]">
                {branches.length === 0
                  ? "Open to all branches."
                  : `${branches.length} selected.`}
              </p>
            </fieldset>
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => navigate("/app/postings")}>
            Cancel
          </Button>
          <Button type="submit" size="lg" loading={loading} disabled={notApproved}>
            Publish posting
          </Button>
        </div>
      </form>
    </>
  );
};

export default PostJob;
