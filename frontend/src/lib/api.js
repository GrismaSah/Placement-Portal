import axios from "axios";

/**
 * The single axios instance for the app.
 *
 * Replaces `axios.defaults.baseURL = "http://localhost:4000"` in App.jsx plus
 * ~15 literal `http://localhost:4000/...` strings scattered through the
 * components — which meant the app could not be deployed anywhere without a
 * find-and-replace.
 *
 * Resolution order:
 *   1. VITE_API_URL, if set — for pointing a local frontend at a deployed API.
 *   2. In production, the empty string: the API is served from /api on the
 *      same origin as the site, so requests stay same-origin. That is what
 *      lets the auth cookie use SameSite=Lax instead of the far weaker None,
 *      and removes CORS from the picture entirely.
 *   3. In development, localhost:4000, where Vite (5173) and the API (4000)
 *      are genuinely different origins.
 */
const configured = import.meta.env.VITE_API_URL?.replace(/\/$/, "");

export const API_BASE_URL =
  configured || (import.meta.env.PROD ? "" : "http://localhost:4000");

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
