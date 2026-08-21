/**
 * Role vocabulary and navigation.
 *
 * Every human-facing label is produced here rather than inline:
 *
 *   Student   — applies to roles
 *   Recruiter — posts jobs and reviews applicants
 *   Admin     — the placement office; approves recruiters and owns
 *               placement reporting
 */

import {
  FiBarChart2,
  FiBriefcase,
  FiFileText,
  FiGrid,
  FiPlus,
  FiSearch,
  FiUser,
  FiUserCheck,
  FiUsers,
} from "react-icons/fi";

export const ROLES = {
  STUDENT: "Student",
  RECRUITER: "Recruiter",
  OFFICER: "Admin",
};

export const roleLabel = (role) =>
  ({
    Student: "Student",
    Recruiter: "Recruiter",
    Admin: "Placement Officer",
  })[role] ?? role ?? "";

/** The longer form, used where the role still needs explaining. */
export const roleLabelLong = (role) =>
  ({
    Student: "Student",
    Recruiter: "Recruiter",
    Admin: "Placement Officer (Admin)",
  })[role] ?? role ?? "";

// Kept as a complete set even though only two currently have callers — an
// asymmetric role API is the kind of thing that gets the missing one
// re-added inline somewhere else.
export const isStudent = (user) => user?.role === ROLES.STUDENT;
export const isRecruiter = (user) => user?.role === ROLES.RECRUITER;
export const isOfficer = (user) => user?.role === ROLES.OFFICER;

/**
 * Sidebar navigation per role.
 * `end` marks routes that must match exactly, so /app/jobs does not stay
 * highlighted while you are on /app/jobs/:id.
 */
export const navFor = (role) => {
  const common = [
    { to: "/app/dashboard", label: "Dashboard", icon: FiGrid, end: true },
  ];

  if (role === ROLES.STUDENT) {
    return [
      ...common,
      { to: "/app/jobs", label: "Openings", icon: FiSearch },
      { to: "/app/applications", label: "My applications", icon: FiFileText },
      { to: "/app/resume", label: "Resume", icon: FiUser },
    ];
  }

  if (role === ROLES.RECRUITER) {
    // A recruiter's own workflow is applicants + postings, not browsing every
    // other company's openings — /api/v1/application/recruiter/getall now
    // supports an omitted jobId for exactly this: every applicant across
    // every job this recruiter owns, in one table (see AllApplicants.jsx).
    return [
      ...common,
      { to: "/app/applicants", label: "Applicants", icon: FiUsers },
      { to: "/app/postings", label: "My postings", icon: FiBriefcase },
      { to: "/app/postings/new", label: "Post a role", icon: FiPlus },
    ];
  }

  if (role === ROLES.OFFICER) {
    return [
      { to: "/app/dashboard", label: "Dashboard", icon: FiGrid, end: true },
      { to: "/app/analytics", label: "Analytics", icon: FiBarChart2 },
      { to: "/app/approvals", label: "Recruiter approvals", icon: FiUserCheck },
      { to: "/app/students", label: "Students", icon: FiUsers },
      { to: "/app/jobs", label: "Openings", icon: FiSearch },
    ];
  }

  return common;
};

/** Up to four items for the mobile bottom bar — more than that is unusable. */
export const mobileNavFor = (role) => navFor(role).slice(0, 4);

/**
 * Where a signed-out user of this role goes to sign back in.
 *
 * /recruiter/login and /placement-office/login are deliberately unlinked from
 * every nav and from the student /login page (see the comment atop Login.jsx),
 * which made sending everyone to "/login" on logout a one-way door: /login
 * only accepts Students, so a Recruiter landed on "User with provided email
 * and Student not found!" and an Admin on "Invalid Email.", with no link
 * anywhere back to their real entry point. Unlinked is not the same as
 * unreachable — the app still has to return them to their own door.
 */
export const loginPathFor = (role) =>
  ({
    [ROLES.RECRUITER]: "/recruiter/login",
    [ROLES.OFFICER]: "/placement-office/login",
  })[role] ?? "/login";
