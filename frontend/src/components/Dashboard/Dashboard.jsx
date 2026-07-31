import { useContext } from "react";
import { Context } from "../../main";
import { ROLES } from "../../lib/roles";
import StudentDashboard from "./StudentDashboard";
import RecruiterDashboard from "./RecruiterDashboard";
import OfficerDashboard from "./OfficerDashboard";

/**
 * Role switch for /app/dashboard.
 *
 * Each role gets a genuinely different dashboard rather than one screen with
 * conditionals — the questions a student, a recruiter and the placement office
 * bring to this page have almost nothing in common.
 */
const Dashboard = () => {
  const { user } = useContext(Context);

  if (user?.role === ROLES.RECRUITER) return <RecruiterDashboard user={user} />;
  if (user?.role === ROLES.OFFICER) return <OfficerDashboard user={user} />;
  return <StudentDashboard user={user} />;
};

export default Dashboard;
