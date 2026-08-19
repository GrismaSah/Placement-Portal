import { useEffect, useState } from "react";
import { FiSearch, FiUsers } from "react-icons/fi";
import { useQuery } from "../../lib/useQuery";
import PageHeader from "../Layout/PageHeader";
import {
  Avatar,
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Pagination,
  Skeleton,
  Table,
} from "../ui";

/**
 * Student directory for the placement office.
 *
 * Search and paging are server-side — the office may be looking at thousands
 * of records, and the endpoint already returns per-student application counts
 * from a single aggregate rather than a query per row.
 */
const Students = () => {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isInitialLoading, error, refetch } = useQuery("/api/v1/admin/students", {
    params: { search: debounced, page, limit: 20 },
  });

  const students = data?.students ?? [];

  const columns = [
    {
      key: "name",
      header: "Student",
      render: (s) => (
        <span className="flex items-center gap-2.5">
          <Avatar user={s} size={32} />
          <span className="min-w-0">
            <span className="block truncate font-medium text-[var(--text-primary)]">
              {s.name}
            </span>
            <span className="block truncate text-xs text-[var(--text-tertiary)]">
              {s.email}
            </span>
          </span>
        </span>
      ),
    },
    { key: "enrollment", header: "Enrollment" },
    {
      key: "branch",
      header: "Branch",
      hideOnMobile: true,
      render: (s) => s.branch || "—",
    },
    {
      key: "cgpa",
      header: "CGPA",
      align: "right",
      render: (s) => (s.cgpa != null ? s.cgpa.toFixed(2) : "—"),
    },
    {
      key: "applications",
      header: "Applications",
      align: "right",
      render: (s) => <span data-numeric>{s.applications}</span>,
    },
    {
      key: "placementStatus",
      header: "Status",
      render: (s) =>
        s.placedCount > 0 || s.placementStatus === "Placed" ? (
          <Badge tone="accent" size="sm" dot>
            Placed
          </Badge>
        ) : (
          <Badge tone="neutral" size="sm">
            {s.placementStatus || "Unplaced"}
          </Badge>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Students"
        description={
          data?.total != null
            ? `${data.total.toLocaleString("en-IN")} registered.`
            : undefined
        }
      />

      <Input
        wrapperClassName="mb-6 max-w-md"
        aria-label="Search students"
        placeholder="Search by name, email or enrollment…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        leadingIcon={<FiSearch className="size-4" />}
      />

      {isInitialLoading ? (
        <Skeleton className="h-96" rounded="rounded-[var(--radius-card)]" />
      ) : error ? (
        <Card padded={false}>
          <ErrorState
            title="Couldn't load the student directory"
            error={error}
            onRetry={refetch}
          />
        </Card>
      ) : (
        <>
          <Card padded={false} className="overflow-hidden">
            <Table
              caption="Registered students"
              columns={columns}
              rows={students}
              empty={
                <EmptyState
                  icon={<FiUsers />}
                  title={debounced ? "No students match that search" : "No students yet"}
                  description={
                    debounced
                      ? "Try a different name, email or enrollment number."
                      : "Students appear here as they register on the portal."
                  }
                />
              }
            />
          </Card>

          <Pagination
            page={data?.page ?? 1}
            totalPages={data?.totalPages ?? 1}
            onChange={setPage}
            className="mt-6"
          />
        </>
      )}
    </>
  );
};

export default Students;
