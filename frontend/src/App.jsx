import { useContext, useEffect, Suspense, lazy } from "react";

import { Context } from "./main";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import { api } from "./lib/api";
import { disconnectSocket, getSocket } from "./socket.js";
import PublicShell from "./components/Layout/PublicShell.jsx";
import AppShell from "./components/Layout/AppShell.jsx";
import {
  ProtectedRoute,
  PublicOnlyRoute,
  RoleRoute,
} from "./components/routing/ProtectedRoute.jsx";
import { ROLES } from "./lib/roles";

/**
 * Routes are imported EAGERLY, on purpose.
 *
 * Every screen used to be React.lazy() behind a single <Suspense> that wrapped
 * the whole <Routes> block. That combination is what produced the white flash
 * on every navigation: the fallback replaced the entire tree — shell included
 * — while a separate chunk was fetched over the network.
 *
 * The whole app is ~95KB gzipped. Splitting that into twenty chunks costs a
 * round trip per navigation and saves nothing worth having, so the app now
 * ships as one bundle and route changes are instant, with no fallback at all.
 *
 * Only the design-system reference stays lazy: it is developer-facing, never
 * linked from the product, and would otherwise be dead weight for every user.
 */
import Landing from "./components/Landing/Landing.jsx";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import ForgotPassword from "./components/Forgot/ForgotPassword.jsx";
import Dashboard from "./components/Dashboard/Dashboard.jsx";
import Jobs from "./components/Job/Jobs";
import JobDetails from "./components/Job/JobDetails";
import Profile from "./components/Profile/Profile.jsx";
import Application from "./components/Application/Application";
import MyApplications from "./components/Application/MyApplications";
import PostJob from "./components/Job/PostJob";
import MyJobs from "./components/Job/MyJobs";
import JobApplications from "./components/Application/JobApplications";
import TnpApprovals from "./components/Officer/TnpApprovals";
import Analytics from "./components/Officer/Analytics";
import Students from "./components/Officer/Students";
import NotFound from "./components/NotFound/NotFound";

const DesignSystem = lazy(() => import("./components/DesignSystem/DesignSystem.jsx"));

const App = () => {
  const { isAuthorized, setIsAuthorized, setUser, setAuthChecked } =
    useContext(Context);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get("/api/v1/user/getuser");
        let user = response.data.user;

        // A TPO's token verifies against a different collection, so /getuser
        // resolves to null for them. That null is the signal to try /tpo/me.
        // Both endpoints answer "is there a session?" with 200 + user: null
        // rather than a 401 — there being no session yet is the normal state
        // on first load, not an error — so authorization now has to be
        // decided from the payload instead of from a caught exception.
        if (user === null) {
          const tpo = await api.get("/api/v1/tpo/me");
          user = tpo.data.user;
        }

        setUser(user);
        setIsAuthorized(user !== null);
      } catch {
        setIsAuthorized(false);
      } finally {
        // Distinguishes "not logged in" from "not checked yet", which is what
        // stops a refresh on a protected route bouncing the user to /login.
        setAuthChecked(true);
      }
    };
    fetchUser();
    // Runs once. Re-running on isAuthorized meant every sign-in and sign-out
    // fired a redundant round trip before the UI could settle.
  }, []);

  // Live profile sync. The server pushes only to `user:<id>` rooms, so this
  // receives this user's own edits made from any other device or tab.
  useEffect(() => {
    if (!isAuthorized) {
      disconnectSocket();
      return;
    }

    const socket = getSocket();
    const onProfileUpdated = (updated) => {
      setUser(updated);
      toast.success("Profile updated", { id: "profile-sync" });
    };

    socket.on("profile:updated", onProfileUpdated);
    if (!socket.connected) socket.connect();

    return () => {
      socket.off("profile:updated", onProfileUpdated);
    };
  }, [isAuthorized]);

  return (
    <BrowserRouter>
      <Routes>
        {/* ================= PUBLIC ================= */}
        <Route element={<PublicShell />}>
          <Route path="/" element={<Landing />} />
        </Route>

        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login allowedRoles={["Student"]} />
            </PublicOnlyRoute>
          }
        />
        {/*
          Deliberately not linked from any nav, footer, or the student /login
          page — see the comment atop Login.jsx. Reached only by a direct URL
          given to recruiters/officers out of band.
        */}
        <Route
          path="/recruiter/login"
          element={
            <PublicOnlyRoute>
              <Login allowedRoles={["TNP"]} />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/placement-office/login"
          element={
            <PublicOnlyRoute>
              <Login allowedRoles={["TPO"]} />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <Register />
            </PublicOnlyRoute>
          }
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* ================= AUTHENTICATED ================= */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="jobs/:id" element={<JobDetails />} />
          <Route path="profile" element={<Profile />} />

          {/* ---- Student ---- */}
          <Route
            path="jobs/:id/apply"
            element={
              <RoleRoute allow={[ROLES.STUDENT]}>
                <Application />
              </RoleRoute>
            }
          />
          <Route
            path="applications"
            element={
              <RoleRoute allow={[ROLES.STUDENT]}>
                <MyApplications />
              </RoleRoute>
            }
          />
          <Route
            path="resume"
            element={
              <RoleRoute allow={[ROLES.STUDENT]}>
                <Profile />
              </RoleRoute>
            }
          />

          {/* ---- Recruiter ---- */}
          <Route
            path="postings"
            element={
              <RoleRoute allow={[ROLES.RECRUITER]}>
                <MyJobs />
              </RoleRoute>
            }
          />
          <Route
            path="postings/new"
            element={
              <RoleRoute allow={[ROLES.RECRUITER]}>
                <PostJob />
              </RoleRoute>
            }
          />
          <Route
            path="postings/:jobId/applicants"
            element={
              <RoleRoute allow={[ROLES.RECRUITER]}>
                <JobApplications />
              </RoleRoute>
            }
          />

          {/* ---- Placement Officer ---- */}
          <Route
            path="approvals"
            element={
              <RoleRoute allow={[ROLES.OFFICER]}>
                <TnpApprovals />
              </RoleRoute>
            }
          />
          <Route
            path="analytics"
            element={
              <RoleRoute allow={[ROLES.OFFICER]}>
                <Analytics />
              </RoleRoute>
            }
          />
          <Route
            path="students"
            element={
              <RoleRoute allow={[ROLES.OFFICER]}>
                <Students />
              </RoleRoute>
            }
          />
        </Route>

        {/* ================= LEGACY REDIRECTS ================= */}
        {/* The old flat routes stay working — students bookmark job links. */}
        <Route path="/job/getall" element={<Navigate to="/app/jobs" replace />} />
        <Route path="/job/post" element={<Navigate to="/app/postings/new" replace />} />
        <Route path="/job/me" element={<Navigate to="/app/postings" replace />} />
        <Route
          path="/applications/me"
          element={<Navigate to="/app/applications" replace />}
        />
        <Route path="/profile" element={<Navigate to="/app/profile" replace />} />
        <Route path="/tpo/login" element={<Navigate to="/placement-office/login" replace />} />
        <Route path="/tpo/register" element={<Navigate to="/register" replace />} />

        <Route
          path="/design-system"
          element={
            <Suspense fallback={null}>
              <DesignSystem />
            </Suspense>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>

      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: "var(--surface-overlay)",
            color: "var(--text-primary)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-card)",
            boxShadow: "var(--shadow-lg)",
            fontSize: "0.9375rem",
            maxWidth: "26rem",
          },
          success: { iconTheme: { primary: "var(--color-success-500)", secondary: "#fff" } },
          error: { iconTheme: { primary: "var(--color-danger-500)", secondary: "#fff" } },
        }}
      />
    </BrowserRouter>
  );
};

export default App;
