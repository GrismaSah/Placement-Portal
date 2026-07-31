import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiAward,
  FiBriefcase,
  FiCheckCircle,
  FiFileText,
  FiTrendingUp,
  FiUserCheck,
  FiUsers,
} from "react-icons/fi";
import { api } from "../../lib/api";
import { cn } from "../../lib/cn";
import { BRAND, BRAND_VALUES } from "../../constants/brand";
import { categoryIcon, categoryLabel, companyLogo } from "../../constants/jobTaxonomy";
import { Button, useCountUp } from "../ui";

/**
 * Public landing page.
 *
 * Previously "/" simply bounced to /login — a logged-out visitor saw nothing
 * at all. This mirrors the flow of the university's own site (navy hero →
 * proof → process → recruiters → CTA) so the portal reads as part of JAIN
 * rather than as a detached internal tool.
 */

const Stat = ({ value, label, suffix = "" }) => {
  const { ref, display } = useCountUp(value);
  return (
    <div ref={ref} className="text-center">
      <p
        data-numeric
        className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
      >
        {display.toLocaleString("en-IN")}
        {suffix}
      </p>
      <p className="mt-1 text-sm text-white/60">{label}</p>
    </div>
  );
};

const HOW_IT_WORKS = [
  {
    icon: FiFileText,
    role: "Students",
    title: "Build once, apply anywhere",
    body: "Create a structured profile and resume, then apply to verified openings in two clicks — and follow every application from submission to offer.",
  },
  {
    icon: FiBriefcase,
    role: "Recruiters",
    title: "Reach the right cohort",
    body: "Post a role with eligibility criteria, review applicants with their resumes inline, and move candidates through your pipeline without leaving the portal.",
  },
  {
    icon: FiUserCheck,
    role: "Placement Office",
    title: "Oversight, end to end",
    body: "Approve recruiting partners, monitor every drive in progress, and report on placement rate, packages and branch-wise outcomes in real time.",
  },
];

const Landing = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api
      .get("/api/v1/job/stats")
      .then(({ data }) => setStats(data))
      .catch(() => setStats(null));
  }, []);

  const totals = stats?.totals ?? {};
  const companies = (stats?.companies ?? []).slice(0, 12);
  const categories = (stats?.categories ?? []).slice(0, 8);

  return (
    <>
      {/* ================= HERO ================= */}
      <section className="bg-brand-gradient relative overflow-hidden">
        {/* Faint grid, so a large navy field has texture without decoration. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(ellipse at 50% 0%, black 40%, transparent 75%)",
          }}
        />

        {/* No top offset: the header is sticky and in normal flow, so it can
            never overlap this. */}
        <div className="relative mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-gold-500)]/30 bg-[var(--color-gold-500)]/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-[var(--color-gold-400)] uppercase">
              <FiAward aria-hidden="true" className="size-3.5" />
              Training &amp; Placement Office
            </span>

            <h1 className="text-display mt-6 font-bold tracking-tight text-white text-balance-pretty">
              Where JAIN talent
              <br />
              meets <span className="text-[var(--color-gold-500)]">industry</span>.
            </h1>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-white/70 sm:text-lg text-balance-pretty">
              One place for students, recruiters and the placement office. Browse verified
              openings, apply with a single profile, and track every application from
              submission through to offer.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button to="/register" size="lg" trailingIcon={<FiArrowRight />}>
                Create your account
              </Button>
              <Button to="/login" size="lg" variant="inverse">
                Sign in
              </Button>
            </div>
          </div>

          {/* Stat band */}
          <div className="mt-14 grid grid-cols-2 gap-6 border-t border-white/10 pt-8 sm:mt-16 sm:grid-cols-4 sm:gap-8 sm:pt-10">
            <Stat value={totals.openRoles ?? 0} label="Open roles" />
            <Stat value={totals.companies ?? 0} label="Recruiting partners" />
            <Stat value={totals.students ?? 0} label="Students registered" />
            <Stat value={totals.applications ?? 0} label="Applications" />
          </div>
        </div>
      </section>

      {/* ================= RECRUITERS ================= */}
      {companies.length > 0 && (
        <section className="border-b border-[var(--border)] bg-[var(--surface)] py-14">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-center text-xs font-semibold tracking-[0.2em] text-[var(--text-tertiary)] uppercase">
              Recruiting on campus
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-x-10 gap-y-7">
              {companies.map(({ name }) => {
                const Logo = companyLogo(name);
                return (
                  <div
                    key={name}
                    className="flex items-center gap-2.5 text-[var(--text-secondary)] opacity-70 transition-opacity hover:opacity-100"
                  >
                    <Logo aria-hidden="true" className="size-6" />
                    <span className="text-base font-semibold tracking-tight">{name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ================= HOW IT WORKS ================= */}
      <section
        id="how-it-works"
        className="scroll-mt-20 bg-[var(--surface-sunken)] py-16 sm:py-24"
      >
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-h1 font-bold tracking-tight text-[var(--text-primary)] text-balance-pretty">
              How the placement cell works
            </h2>
            <p className="mt-4 text-lg text-[var(--text-secondary)] text-balance-pretty">
              Three roles, one system — so nothing is tracked in a spreadsheet and nobody
              is left wondering where an application stands.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {HOW_IT_WORKS.map(({ icon: Icon, role, title, body }, i) => (
              <div
                key={role}
                className="surface-card animate-fade-rise relative overflow-hidden !p-7"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-1 bg-[var(--accent)]"
                />
                <span
                  aria-hidden="true"
                  className="grid size-12 place-items-center rounded-2xl bg-[var(--brand)] text-white"
                >
                  <Icon className="size-5" />
                </span>

                <p className="mt-6 text-xs font-semibold tracking-[0.14em] text-[var(--text-tertiary)] uppercase">
                  {role}
                </p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight text-[var(--text-primary)]">
                  {title}
                </h3>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-[var(--text-secondary)] text-balance-pretty">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CATEGORIES ================= */}
      {categories.length > 0 && (
        <section className="bg-[var(--surface)] py-20 sm:py-24">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-2xl">
                <h2 className="text-h1 font-bold tracking-tight text-[var(--text-primary)]">
                  Explore by function
                </h2>
                <p className="mt-3 text-lg text-[var(--text-secondary)]">
                  Live openings across every discipline recruiting this season.
                </p>
              </div>

              <Link
                to="/app/jobs"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--brand)] hover:underline"
              >
                View all openings <FiArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map(({ name: key, count }) => {
                const Icon = categoryIcon(key);

                return (
                  <Link
                    key={key}
                    to={`/app/jobs?category=${encodeURIComponent(key)}`}
                    className="surface-card group flex items-center gap-4 transition-all duration-[var(--duration-base)] hover:-translate-y-1 hover:border-[var(--brand)]/30 hover:shadow-[var(--shadow-lg)]"
                  >
                    <span
                      aria-hidden="true"
                      className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--brand-subtle)] text-[var(--brand)] transition-colors group-hover:bg-[var(--brand)] group-hover:text-white"
                    >
                      <Icon className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-[var(--text-primary)]">
                        {categoryLabel(key)}
                      </span>
                      <span
                        data-numeric
                        className="text-sm text-[var(--text-tertiary)]"
                      >
                        {count} {count === 1 ? "opening" : "openings"}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ================= BRAND VALUES ================= */}
      <section id="values" className="scroll-mt-20 bg-[var(--surface-sunken)] py-16 sm:py-24">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-h1 font-bold tracking-tight text-[var(--text-primary)]">
              What JAIN stands for
            </h2>
            <p className="mt-3 text-lg text-[var(--text-secondary)] text-balance-pretty">
              The values the university is built on — and the standard the placement cell
              holds itself to.
            </p>
          </div>

          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {BRAND_VALUES.map(({ title, body }, i) => (
              <li
                key={title}
                className={cn(
                  "surface-card !p-5",
                  // Seven items into a four-column grid: let the last one span
                  // so the row does not end on a ragged gap.
                  i === BRAND_VALUES.length - 1 && "sm:col-span-2 lg:col-span-1"
                )}
              >
                <span
                  aria-hidden="true"
                  className="inline-grid size-8 place-items-center rounded-lg bg-[var(--accent-subtle)] text-[var(--color-gold-700)]"
                >
                  <FiCheckCircle className="size-4" />
                </span>
                <h3 className="mt-3.5 font-semibold text-[var(--text-primary)]">{title}</h3>
                <p className="mt-1.5 text-sm text-[var(--text-secondary)] text-balance-pretty">
                  {body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="bg-[var(--surface)] pb-24">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bg-brand-gradient relative overflow-hidden rounded-[var(--radius-panel)] px-8 py-16 text-center sm:px-16">
            <div className="relative mx-auto max-w-2xl">
              <FiTrendingUp
                aria-hidden="true"
                className="mx-auto size-10 text-[var(--color-gold-500)]"
              />
              <h2 className="text-h1 mt-6 font-bold tracking-tight text-white text-balance-pretty">
                Your next role starts here
              </h2>
              <p className="mt-4 text-lg text-white/70 text-balance-pretty">
                Join {(totals.students ?? 0).toLocaleString("en-IN")} students already using
                the {BRAND.shortName} {BRAND.product}.
              </p>

              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <Button to="/register" size="lg" trailingIcon={<FiArrowRight />}>
                  Create your account
                </Button>
                <Button to="/app/jobs" size="lg" variant="inverse" leadingIcon={<FiUsers />}>
                  Browse openings
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Landing;
