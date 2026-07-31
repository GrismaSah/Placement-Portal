import axios from "axios";

/**
 * The single axios instance for the app.
 *
 * Replaces `axios.defaults.baseURL = "http://localhost:4000"` in App.jsx plus
 * ~15 literal `http://localhost:4000/...` strings scattered through the
 * components — which meant the app could not be deployed anywhere without a
 * find-and-replace.
 *
 * Set VITE_API_URL in frontend/.env to point at a deployed backend.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:4000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  // Auth is an httpOnly `token` cookie, so every request must carry credentials.
  withCredentials: true,
});

/** Pull a displayable message out of an axios error without ever throwing. */
export function apiError(error, fallback = "Something went wrong. Please try again.") {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

export default api;
