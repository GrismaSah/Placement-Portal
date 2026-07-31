import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FiFilter, FiMapPin, FiSearch, FiX } from "react-icons/fi";
import { api } from "../../lib/api";
import { cn } from "../../lib/cn";
import { categoryIcon, categoryLabel, companyLogo } from "../../constants/jobTaxonomy";
import PageHeader from "../Layout/PageHeader";
import { Badge, Button, EmptyState, Input, Pagination, SkeletonGrid } from "../ui";

const PAGE_SIZE = 12;
const SEARCH_DEBOUNCE_MS = 300;

/** "₹12.5 L", "₹8 L – ₹12 L", or "Not disclosed". */
export function salaryLabel(job) {
  const fmt = (n) => {
    if (!n) return null;
    if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
    if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)} L`;
    return `₹${Number(n).toLocaleString("en-IN")}`;
  };

  if (job.fixedSalary) return fmt(job.fixedSalary);
  if (job.salaryFrom && job.salaryTo) return `${fmt(job.salaryFrom)} – ${fmt(job.salaryTo)}`;
  return "Not disclosed";
}

export const JobCard = ({ job }) => {
  const Logo = companyLogo(job.company);
  const deadline = job.applicationDeadline ? new Date(job.applicationDeadline) : null;
  const closingSoon =
    deadline && deadline > new Date() && deadline - new Date() < 7 * 864e5;

  return (
    <Link
      to={`/app/jobs/${job._id}`}
      className="surface-card group flex flex-col transition-all duration-[var(--duration-base)] ease-[var(--ease-spring)] hover:-translate-y-1 hover:border-[var(--brand)]/30 hover:shadow-[var(--shadow-lg)]"
    >
      <div className="flex items-start gap-3.5">
        <span
          aria-hidden="true"
          className="grid size-12 shrink-0 place-items-center rounded-xl bg-[var(--surface-hover)] text-[var(--text-secondary)] transition-colors group-hover:bg-[var(--brand)] group-hover:text-white"
        >
          <Logo className="size-6" />
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-[var(--text-primary)]">{job.title}</h3>
          <p className="truncate text-sm text-[var(--text-secondary)]">{job.company}</p>
        </div>
      </div>

      <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-[var(--text-secondary)]">
        {job.description}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge tone="brand" size="sm">
          {categoryLabel(job.category)}
        </Badge>
        {closingSoon && (
          <Badge tone="warning" size="sm" dot>
            Closing soon
          </Badge>
        )}
      </div>

      <div className="mt-auto flex items-end justify-between gap-3 border-t border-[var(--border)] pt-4 [margin-top:1rem]">
        <span className="flex min-w-0 items-center gap-1.5 text-sm text-[var(--text-tertiary)]">
          <FiMapPin aria-hidden="true" className="size-3.5 shrink-0" />
          <span className="truncate">
            {job.city}
            {job.country ? `, ${job.country}` : ""}
          </span>
        </span>

        <span
          data-numeric
          className="shrink-0 text-sm font-semibold text-[var(--text-primary)]"
        >
          {salaryLabel(job)}
        </span>
      </div>
    </Link>
  );
};

/**
 * Job listing.
 *
 * The URL remains the source of truth for every filter — that was the one
 * genuinely good pattern in the original screen. Filters survive a refresh,
 * are shareable, and the back button steps through them, which is why a
 * category tile on the landing page can be a plain <Link>.
 */
const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [facets, setFacets] = useState({ categories: [], companies: [] });
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category") || "";
  const company = searchParams.get("company") || "";
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page"), 10) || 1;

  // Local mirror so typing stays responsive; pushed to the URL on a debounce.
  const [searchInput, setSearchInput] = useState(search);
  useEffect(() => setSearchInput(search), [search]);

  const updateFilters = (changes) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    // Any filter change returns to page 1 — otherwise you land on page 4 of a
    // 2-page result set and see nothing.
    if (!("page" in changes)) next.delete("page");
    setSearchParams(next);
  };

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== search) updateFilters({ search: searchInput });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Filter options come from the same aggregate the landing page uses, so they
  // can only ever offer values that exist in the data.
  useEffect(() => {
    api
      .get("/api/v1/job/stats")
      .then(({ data }) =>
        setFacets({ categories: data.categories ?? [], companies: data.companies ?? [] })
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params = { page, limit: PAGE_SIZE };
    if (category) params.category = category;
    if (company) params.company = company;
    if (search) params.search = search;

    api
      .get("/api/v1/job/getall", { params })
      .then(({ data }) => {
        if (cancelled) return;
        setJobs(data.jobs ?? []);
        setMeta({
          total: data.total ?? 0,
          page: data.page ?? 1,
          pages: data.pages ?? data.totalPages ?? 1,
        });
      })
      .catch(() => !cancelled && setJobs([]))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [category, company, search, page]);

  const activeCount = [category, company, search].filter(Boolean).length;

  const filterPanel = (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2.5 text-sm font-semibold text-[var(--text-primary)]">Function</h2>
        <ul className="space-y-0.5">
          <li>
            <button
              type="button"
              onClick={() => updateFilters({ category: "" })}
              className={cn(
                "w-full rounded-[var(--radius-field)] px-3 py-2 text-left text-sm transition-colors",
                !category
                  ? "bg-[var(--brand-subtle)] font-semibold text-[var(--brand)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
              )}
            >
              All functions
            </button>
          </li>
          {facets.categories.map(({ name, count }) => {
            const Icon = categoryIcon(name);
            const active = category === name;
            return (
              <li key={name}>
                <button
                  type="button"
                  onClick={() => updateFilters({ category: active ? "" : name })}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-[var(--radius-field)] px-3 py-2 text-left text-sm transition-colors",
                    active
                      ? "bg-[var(--brand-subtle)] font-semibold text-[var(--brand)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                  )}
                >
                  <Icon aria-hidden="true" className="size-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{categoryLabel(name)}</span>
                  <span data-numeric className="text-xs text-[var(--text-tertiary)]">
                    {count}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <h2 className="mb-2.5 text-sm font-semibold text-[var(--text-primary)]">Company</h2>
        <ul className="space-y-0.5">
          <li>
            <button
              type="button"
              onClick={() => updateFilters({ company: "" })}
              className={cn(
                "w-full rounded-[var(--radius-field)] px-3 py-2 text-left text-sm transition-colors",
                !company
                  ? "bg-[var(--brand-subtle)] font-semibold text-[var(--brand)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
              )}
            >
              All companies
            </button>
          </li>
          {facets.companies.map(({ name, count }) => {
            const active = company === name;
            return (
              <li key={name}>
                <button
                  type="button"
                  onClick={() => updateFilters({ company: active ? "" : name })}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-[var(--radius-field)] px-3 py-2 text-left text-sm transition-colors",
                    active
                      ? "bg-[var(--brand-subtle)] font-semibold text-[var(--brand)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{name}</span>
                  <span data-numeric className="text-xs text-[var(--text-tertiary)]">
                    {count}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );

  return (
    <>
      <PageHeader
        title="Openings"
        description={
          loading
            ? "Loading roles…"
            : `${meta.total.toLocaleString("en-IN")} ${meta.total === 1 ? "role" : "roles"} currently open.`
        }
      />

      {/* Search + mobile filter trigger */}
      <div className="mb-6 flex gap-2.5">
        <Input
          wrapperClassName="flex-1"
          aria-label="Search roles"
          placeholder="Search by role, company or keyword…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          leadingIcon={<FiSearch className="size-4" />}
          trailingIcon={
            searchInput ? (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                aria-label="Clear search"
                className="pointer-events-auto text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              >
                <FiX className="size-4" />
              </button>
            ) : null
          }
        />

        <Button
          variant="outline"
          className="shrink-0 lg:hidden"
          onClick={() => setFiltersOpen((o) => !o)}
          leadingIcon={<FiFilter />}
        >
          Filters
          {activeCount > 0 && (
            <span
              data-numeric
              className="ml-1 grid size-5 place-items-center rounded-full bg-[var(--brand)] text-[0.625rem] font-bold text-white"
            >
              {activeCount}
            </span>
          )}
        </Button>
      </div>

      {/* Active filter chips */}
      {activeCount > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {category && (
            <button
              type="button"
              onClick={() => updateFilters({ category: "" })}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--brand)] hover:brightness-95"
            >
              {categoryLabel(category)} <FiX aria-hidden="true" className="size-3" />
            </button>
          )}
          {company && (
            <button
              type="button"
              onClick={() => updateFilters({ company: "" })}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--brand)] hover:brightness-95"
            >
              {company} <FiX aria-hidden="true" className="size-3" />
            </button>
          )}
          {search && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--brand)] hover:brightness-95"
            >
              &ldquo;{search}&rdquo; <FiX aria-hidden="true" className="size-3" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setSearchParams(new URLSearchParams())}
            className="text-xs font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="flex gap-8">
        {/* Filter rail */}
        <aside
          className={cn(
            "w-60 shrink-0 lg:block",
            filtersOpen
              ? "surface-card fixed inset-x-4 top-24 z-30 max-h-[70dvh] overflow-y-auto lg:static lg:max-h-none lg:w-60 lg:!border-0 lg:!bg-transparent lg:!p-0 lg:!shadow-none"
              : "hidden"
          )}
        >
          {filterPanel}
        </aside>

        {/* Results */}
        <div className="min-w-0 flex-1">
          {loading ? (
            <SkeletonGrid count={6} />
          ) : jobs.length === 0 ? (
            <EmptyState
              tone="card"
              icon={<FiSearch />}
              title="No roles match those filters"
              description="Try removing a filter or searching for something broader."
              action={activeCount > 0 ? "Clear all filters" : undefined}
              onAction={() => setSearchParams(new URLSearchParams())}
            />
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {jobs.map((job, i) => (
                  <div
                    key={job._id}
                    className="animate-fade-rise"
                    style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}
                  >
                    <JobCard job={job} />
                  </div>
                ))}
              </div>

              <Pagination
                page={meta.page}
                totalPages={meta.pages}
                onChange={(p) => {
                  updateFilters({ page: String(p) });
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="mt-10"
              />
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Jobs;
