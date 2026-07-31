import { useState } from "react";
import {
  FiBriefcase,
  FiCheckCircle,
  FiDownload,
  FiFileText,
  FiInbox,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";
import {
  APPLICATION_STAGES,
  Avatar,
  AvatarGroup,
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Input,
  Menu,
  MenuItem,
  MenuSeparator,
  Modal,
  Pagination,
  Select,
  SkeletonCard,
  StatCard,
  StatusBadge,
  StatusTimeline,
  Stepper,
  Table,
  Tabs,
  TERMINAL_STAGES,
  Textarea,
  ThemeToggle,
} from "../ui";
import JainLogo from "../brand/JainLogo";
import { BRAND } from "../../constants/brand";

/**
 * Living reference for the design system.
 *
 * Not linked from the app's navigation — it exists so every primitive can be
 * checked in both themes, at every breakpoint, and with a keyboard, in one
 * place. Delete it only when the design system stops changing.
 */

const Section = ({ title, description, children }) => (
  <section className="border-t border-[var(--border)] py-10 first:border-0">
    <h2 className="text-h3 font-semibold tracking-tight text-[var(--text-primary)]">
      {title}
    </h2>
    {description && (
      <p className="mt-1.5 max-w-2xl text-sm text-[var(--text-secondary)]">{description}</p>
    )}
    <div className="mt-6">{children}</div>
  </section>
);

const Row = ({ children }) => (
  <div className="flex flex-wrap items-center gap-3">{children}</div>
);

const SAMPLE_USER = { name: "Aditya Rao", email: "aditya@jain.test", role: "Student" };
const SAMPLE_PEOPLE = [
  { _id: "1", name: "Aditya Rao" },
  { _id: "2", name: "Meera Nair" },
  { _id: "3", name: "Kabir Shah" },
  { _id: "4", name: "Sana Iqbal" },
  { _id: "5", name: "Rohan Gupta" },
  { _id: "6", name: "Ishita Menon" },
];

const SAMPLE_HISTORY = [
  { status: "Applied", changedAt: "2026-07-02T09:15:00Z" },
  { status: "Shortlisted", changedAt: "2026-07-08T11:40:00Z", note: "Resume cleared screening." },
  { status: "Interview", changedAt: "2026-07-16T06:30:00Z", note: "Technical round scheduled." },
];

const DesignSystem = () => {
  const [tab, setTab] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(3);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-dvh bg-[var(--surface-sunken)]">
      {/* Header */}
      <header className="bg-brand-gradient text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-10 sm:px-8">
          <div>
            <JainLogo variant="full" tone="white" height={40} />
            <h1 className="text-h1 mt-5 font-bold tracking-tight">Design system</h1>
            <p className="mt-2 max-w-xl text-white/70 text-balance-pretty">
              Every primitive, every state. {BRAND.name} — JGI Blue {BRAND.colors.navy},
              JGI Yellow {BRAND.colors.gold}.
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        {/* ---- Colour ---- */}
        <Section
          title="Palette"
          description="Navy is the surface, gold is the single action colour. Gold never becomes a background wash."
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {[
              ["navy-900", "#111E42", "Primary"],
              ["navy-950", "#0A1330", "Deep surface"],
              ["gold-500", "#F6C100", "Accent"],
              ["gold-400", "#FFCC1F", "Accent hover"],
              ["ink", "#1E1916", "Wordmark"],
              ["hairline", "#E4E5E9", "Borders"],
            ].map(([name, hex, use]) => (
              <div key={name} className="surface-card overflow-hidden !p-0">
                <div className="h-16 w-full" style={{ backgroundColor: hex }} />
                <div className="p-3">
                  <p className="text-xs font-semibold text-[var(--text-primary)]">{name}</p>
                  <p className="mt-0.5 font-mono text-[0.6875rem] text-[var(--text-tertiary)]">
                    {hex}
                  </p>
                  <p className="mt-1 text-[0.6875rem] text-[var(--text-secondary)]">{use}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {[...APPLICATION_STAGES, ...TERMINAL_STAGES].map((s) => (
              <div key={s.value} className="surface-card !p-3">
                <span
                  className="block h-8 w-full rounded-md"
                  style={{ backgroundColor: s.color }}
                />
                <p className="mt-2 text-[0.6875rem] font-medium text-[var(--text-secondary)]">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </Section>

        {/* ---- Type ---- */}
        <Section title="Typography" description="Fluid scale — resize the window to see it respond.">
          <div className="surface-card space-y-4">
            <p className="text-display font-bold tracking-tight">Display</p>
            <p className="text-h1 font-bold tracking-tight">Heading one</p>
            <p className="text-h2 font-semibold tracking-tight">Heading two</p>
            <p className="text-h3 font-semibold tracking-tight">Heading three</p>
            <p className="text-base text-[var(--text-secondary)]">
              Body copy. {BRAND.description}
            </p>
            <p className="text-sm text-[var(--text-tertiary)]">
              Small print and helper text.
            </p>
            <p data-numeric className="text-2xl font-bold">
              ₹12,50,000 · 1,284 · 96.4%
            </p>
          </div>
        </Section>

        {/* ---- Buttons ---- */}
        <Section title="Buttons" description="One primary per screen. Tab through to check focus rings.">
          <div className="space-y-4">
            <Row>
              <Button variant="primary">Apply now</Button>
              <Button variant="secondary">Save draft</Button>
              <Button variant="outline">Cancel</Button>
              <Button variant="ghost">Skip</Button>
              <Button variant="danger" leadingIcon={<FiTrash2 />}>
                Withdraw
              </Button>
            </Row>
            <Row>
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg" leadingIcon={<FiPlus />}>
                Large with icon
              </Button>
              <Button size="icon" variant="outline" aria-label="Search">
                <FiSearch />
              </Button>
            </Row>
            <Row>
              <Button disabled>Disabled</Button>
              <Button loading>Submitting</Button>
              <Button
                loading={loading}
                onClick={() => {
                  setLoading(true);
                  setTimeout(() => setLoading(false), 1800);
                }}
              >
                Click to load
              </Button>
            </Row>
            <div className="bg-brand-gradient rounded-[var(--radius-card)] p-6">
              <Row>
                <Button variant="primary">On navy</Button>
                <Button variant="inverse">Inverse</Button>
              </Row>
            </div>
          </div>
        </Section>

        {/* ---- Forms ---- */}
        <Section
          title="Form fields"
          description="Labels are real labels; errors are announced, not just coloured red."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Full name" placeholder="Aditya Rao" required />
            <Input
              label="Email"
              type="email"
              placeholder="you@jain.test"
              leadingIcon={<FiSearch className="size-4" />}
              hint="Use your university address."
            />
            <Input label="Enrollment" defaultValue="23BTRCN001" disabled />
            <Input label="CGPA" error="Must be between 0 and 10." defaultValue="12.4" />
            <Select
              label="Branch"
              placeholder="Select a branch"
              defaultValue=""
              options={["Computer Science", "Electronics", "Mechanical", "Civil"]}
            />
            <Input label="Phone" type="tel" placeholder="+91 98765 43210" />
            <div className="sm:col-span-2">
              <Textarea
                label="Cover letter"
                placeholder="Tell the recruiter why you're a fit…"
                maxLength={500}
                value={text}
                onChange={(e) => setText(e.target.value)}
                hint="Between 30 and 500 characters."
              />
            </div>
          </div>
        </Section>

        {/* ---- Stats ---- */}
        <Section title="Stat cards" description="Counters animate once, on scroll into view.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Open roles" value={128} icon={<FiBriefcase />} />
            <StatCard
              label="Offers made"
              value={342}
              icon={<FiCheckCircle />}
              trend={{ direction: "up", value: "12%" }}
              hint="vs last season"
            />
            <StatCard label="Students placed" value={1284} icon={<FiUsers />} tone="brand" />
            <StatCard
              label="Highest package"
              value={4500000}
              prefix="₹"
              icon={<FiTrendingUp />}
              tone="accent"
            />
          </div>
        </Section>

        {/* ---- Pipeline ---- */}
        <Section
          title="Application pipeline"
          description="The core of the student experience — the old portal gave applicants no status at all."
        >
          <div className="space-y-6">
            <Card>
              <CardHeader title="In progress" description="Interview stage" />
              <Stepper status="Interview" history={SAMPLE_HISTORY} />
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader title="Placed" />
                <Stepper status="Placed" history={SAMPLE_HISTORY} />
              </Card>
              <Card>
                <CardHeader title="Terminal state" />
                <Stepper
                  status="Rejected"
                  history={[...SAMPLE_HISTORY, { status: "Rejected" }]}
                />
              </Card>
            </div>

            <Card>
              <CardHeader title="Status timeline" />
              <StatusTimeline history={SAMPLE_HISTORY} />
            </Card>
          </div>
        </Section>

        {/* ---- Badges ---- */}
        <Section title="Badges" description="Colour is never the only carrier of meaning.">
          <div className="space-y-4">
            <Row>
              {[...APPLICATION_STAGES, ...TERMINAL_STAGES].map((s) => (
                <StatusBadge key={s.value} status={s.value} />
              ))}
            </Row>
            <Row>
              <Badge tone="neutral">Neutral</Badge>
              <Badge tone="brand">Brand</Badge>
              <Badge tone="accent">Accent</Badge>
              <Badge tone="success">Approved</Badge>
              <Badge tone="warning">Pending</Badge>
              <Badge tone="danger">Declined</Badge>
              <Badge tone="info">Info</Badge>
            </Row>
          </div>
        </Section>

        {/* ---- Avatars & menu ---- */}
        <Section title="Avatars, tabs and menus">
          <div className="space-y-6">
            <Row>
              <Avatar user={SAMPLE_USER} size={56} />
              <Avatar user={{ name: "Meera Nair" }} size={44} />
              <Avatar user={{ firstname: "Ravi", lastname: "Kumar" }} size={36} />
              <AvatarGroup users={SAMPLE_PEOPLE} />
            </Row>

            <Tabs
              ariaLabel="Applications"
              value={tab}
              onChange={setTab}
              items={[
                { value: "all", label: "All", count: 24 },
                { value: "active", label: "Active", count: 8 },
                { value: "offers", label: "Offers", count: 2 },
                { value: "closed", label: "Closed", count: 14 },
              ]}
            />

            <Tabs
              variant="pill"
              ariaLabel="View"
              value={tab}
              onChange={setTab}
              items={[
                { value: "all", label: "All" },
                { value: "active", label: "Active" },
                { value: "offers", label: "Offers" },
                { value: "closed", label: "Closed" },
              ]}
            />

            <Menu
              menuLabel="Account"
              trigger={<Avatar user={SAMPLE_USER} size={44} />}
            >
              <MenuItem to="/profile">
                <FiFileText /> My profile
              </MenuItem>
              <MenuItem to="/app/resume">
                <FiDownload /> Resume
              </MenuItem>
              <MenuSeparator />
              <MenuItem danger onClick={() => {}}>
                <FiTrash2 /> Sign out
              </MenuItem>
            </Menu>
          </div>
        </Section>

        {/* ---- Table ---- */}
        <Section
          title="Table"
          description="Resize below 768px — rows become stacked cards rather than scrolling sideways."
        >
          <Card padded={false} className="overflow-hidden">
            <Table
              caption="Applicants"
              columns={[
                {
                  key: "name",
                  header: "Applicant",
                  render: (r) => (
                    <span className="flex items-center gap-2.5">
                      <Avatar user={r} size={30} />
                      <span className="font-medium">{r.name}</span>
                    </span>
                  ),
                },
                { key: "role", header: "Role" },
                { key: "cgpa", header: "CGPA", align: "right" },
                {
                  key: "status",
                  header: "Status",
                  render: (r) => <StatusBadge status={r.status} size="sm" />,
                },
              ]}
              rows={[
                { _id: "1", name: "Aditya Rao", role: "SDE Intern", cgpa: "8.9", status: "Shortlisted" },
                { _id: "2", name: "Meera Nair", role: "Data Analyst", cgpa: "9.2", status: "Offered" },
                { _id: "3", name: "Kabir Shah", role: "SDE Intern", cgpa: "7.8", status: "Applied" },
                { _id: "4", name: "Sana Iqbal", role: "Product Intern", cgpa: "8.4", status: "Rejected" },
              ]}
            />
          </Card>

          <Pagination page={page} totalPages={12} onChange={setPage} className="mt-6" />
        </Section>

        {/* ---- Feedback ---- */}
        <Section title="Empty, loading and dialog states">
          <div className="grid gap-5 lg:grid-cols-2">
            <Card padded={false}>
              <EmptyState
                icon={<FiInbox />}
                title="No applications yet"
                description="Once you apply to a role it will appear here, with live status updates at every stage."
                action="Browse openings"
                actionTo="/app/jobs"
              />
            </Card>

            <SkeletonCard />
          </div>

          <div className="mt-5">
            <Button variant="outline" onClick={() => setModalOpen(true)}>
              Open dialog
            </Button>
          </div>

          <Modal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Withdraw application?"
            description="This cannot be undone."
            footer={
              <>
                <Button variant="ghost" onClick={() => setModalOpen(false)}>
                  Keep it
                </Button>
                <Button variant="danger" onClick={() => setModalOpen(false)}>
                  Withdraw
                </Button>
              </>
            }
          >
            <p className="text-sm text-[var(--text-secondary)]">
              Your application to <strong className="text-[var(--text-primary)]">SDE Intern
              at Google</strong> will be removed, and the recruiter will no longer see your
              resume. Tab around — focus is trapped in here, and Escape closes.
            </p>
          </Modal>
        </Section>
      </div>
    </div>
  );
};

export default DesignSystem;
