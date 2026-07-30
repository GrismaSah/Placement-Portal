import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Context } from "../../main";
import { categoryLabel } from "../../constants/jobTaxonomy";

const PAGE_SIZE = 12;
const SEARCH_DEBOUNCE_MS = 300;

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [facets, setFacets] = useState({ categories: [], companies: [] });

  const { isAuthorized } = useContext(Context);
  const navigateTo = useNavigate();

  // The URL is the state. Filters survive refresh, are shareable, and the back
  // button steps through them — which is also why a home page tile can just be
  // a plain <Link> with no extra wiring.
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category") || "";
  const company = searchParams.get("company") || "";
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page"), 10) || 1;

  // Local mirror so typing stays responsive; pushed to the URL on a debounce.
  const [searchInput, setSearchInput] = useState(search);
  useEffect(() => setSearchInput(search), [search]);

  // Dropdown options come from the same aggregate the home page uses, so they
  // can only ever offer values that actually exist in the data.
  useEffect(() => {
    let cancelled = false;
    axios
      .get("/api/v1/job/stats")
      .then((res) => {
        if (!cancelled) {
          setFacets({
            categories: res.data.categories ?? [],
            companies: res.data.companies ?? [],
          });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params = { page, limit: PAGE_SIZE };
    if (category) params.category = category;
    if (company) params.company = company;
    if (search) params.search = search;

    axios
      .get("/api/v1/job/getall", { params, withCredentials: true })
      .then((res) => {
        if (cancelled) return;
        setJobs(res.data.jobs ?? []);
        setMeta({
          total: res.data.total ?? 0,
          page: res.data.page ?? 1,
          pages: res.data.pages ?? 1,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setJobs([]);
        setMeta({ total: 0, page: 1, pages: 1 });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [category, company, search, page]);

  // Any filter change resets to page 1 — otherwise narrowing the results while
  // on page 3 lands the user on an empty page.
  const updateFilters = (changes) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    next.delete("page");
    setSearchParams(next);
  };

  // Deliberately keyed on searchInput alone. Including `search` or the
  // (re-created every render) `updateFilters` would restart the timer on the
  // very update it schedules, so the debounce would never settle.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (searchInput === search) return;
    const timer = setTimeout(
      () => updateFilters({ search: searchInput }),
      SEARCH_DEBOUNCE_MS
    );
    return () => clearTimeout(timer);
  }, [searchInput]);

  const goToPage = (nextPage) => {
    const next = new URLSearchParams(searchParams);
    if (nextPage <= 1) next.delete("page");
    else next.set("page", String(nextPage));
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const hasFilters = Boolean(category || company || search);
  const clearFilters = () => setSearchParams(new URLSearchParams());

  if (!isAuthorized) {
    navigateTo("/");
  }

  return (
    <section className="jobs page">
      <div className="container">
        <h1>ALL AVAILABLE JOBS</h1>

        <div className="filters">
          <input
            type="text"
            className="filter_search"
            placeholder="Search by role, company or city"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />

          <select
            value={company}
            onChange={(e) => updateFilters({ company: e.target.value })}
          >
            <option value="">All Companies</option>
            {facets.companies.map((c) => (
              <option value={c.name} key={c.name}>
                {c.name} ({c.count})
              </option>
            ))}
          </select>

          <select
            value={category}
            onChange={(e) => updateFilters({ category: e.target.value })}
          >
            <option value="">All Categories</option>
            {facets.categories.map((c) => (
              <option value={c.name} key={c.name}>
                {categoryLabel(c.name)} ({c.count})
              </option>
            ))}
          </select>

          {hasFilters && (
            <button type="button" className="clear_filters" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>

        <p className="result_count">
          {loading
            ? "Loading jobs…"
            : meta.total === 0
            ? "No jobs found"
            : `Showing ${jobs.length} of ${meta.total} ${
                meta.total === 1 ? "job" : "jobs"
              }`}
        </p>

        {!loading && meta.total === 0 ? (
          <div className="empty">
            <p>No jobs match these filters.</p>
            {hasFilters && (
              <button type="button" onClick={clearFilters}>
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="banner">
            {jobs.map((element) => {
              return (
                <div className="card" key={element._id}>
                  <p>{element.company}</p>
                  <p>{categoryLabel(element.category)}</p>
                  <p>{element.title}</p>
                  <Link to={`/job/${element._id}`}>Job Details</Link>
                </div>
              );
            })}
          </div>
        )}

        {meta.pages > 1 && (
          <div className="pagination">
            <button
              type="button"
              onClick={() => goToPage(meta.page - 1)}
              disabled={meta.page <= 1}
            >
              Previous
            </button>
            <span>
              Page {meta.page} of {meta.pages}
            </span>
            <button
              type="button"
              onClick={() => goToPage(meta.page + 1)}
              disabled={meta.page >= meta.pages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Jobs;
