import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Context } from "../../main";
import LoaderPage from "../Loader/LoaderPage";

/**
 * Route guards.
 *
 * Replaces the pattern used across the old pages, which called
 * `navigateTo("/")` in the middle of the render body — React processed the
 * whole render first, so every protected page visibly flashed its content
 * before bouncing, and a direct refresh could bounce a logged-in user because
 * `isAuthorized` starts false.
 *
 * Both problems come down to the same thing: "not logged in" and "not checked
 * yet" are different states. `authChecked` distinguishes them.
 */
export const ProtectedRoute = ({ children }) => {
  const { isAuthorized, authChecked } = useContext(Context);
  const location = useLocation();

  if (!authChecked) return <LoaderPage />;

  if (!isAuthorized) {
    // Remember where they were headed so login can send them back.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

/**
 * Additionally requires one of `allow`. Sends an authenticated user with the
 * wrong role to their own dashboard rather than to login — being logged in as
 * the wrong role is not an authentication failure.
 */
export const RoleRoute = ({ allow = [], children }) => {
  const { isAuthorized, authChecked, user } = useContext(Context);
  const location = useLocation();

  if (!authChecked) return <LoaderPage />;
  if (!isAuthorized) return <Navigate to="/login" state={{ from: location }} replace />;

  if (allow.length && !allow.includes(user?.role)) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return children;
};

/** For /login and /register — a signed-in user should never see them. */
export const PublicOnlyRoute = ({ children }) => {
  const { isAuthorized, authChecked } = useContext(Context);
  const location = useLocation();

  if (!authChecked) return <LoaderPage />;

  if (isAuthorized) {
    const to = location.state?.from?.pathname ?? "/app/dashboard";
    return <Navigate to={to} replace />;
  }

  return children;
};

export default ProtectedRoute;
