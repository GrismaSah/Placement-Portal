/**
 * Light/dark theme controller.
 *
 * The resolved theme is written to `data-theme` on <html>, which is the only
 * hook the CSS in styles/theme.css needs. Three modes are stored:
 *
 *   "light" | "dark"  — an explicit user choice, persisted
 *   "system"          — follow the OS, and keep following it live
 *
 * `applyStoredTheme()` is also inlined into index.html as a blocking script so
 * the correct palette is painted on the very first frame. Without it a dark
 * user gets a white flash on every hard load.
 */

const STORAGE_KEY = "jain-portal-theme";

export const THEME_MODES = ["light", "dark", "system"];

export function getStoredMode() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return THEME_MODES.includes(stored) ? stored : "system";
  } catch {
    // Private browsing / disabled storage — fall back rather than throw.
    return "system";
  }
}

export function systemPrefersDark() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches
  );
}

export function resolveTheme(mode) {
  if (mode === "system") return systemPrefersDark() ? "dark" : "light";
  return mode;
}

export function applyTheme(mode) {
  const resolved = resolveTheme(mode);
  const root = document.documentElement;

  root.setAttribute("data-theme", resolved);
  root.style.colorScheme = resolved;

  // Keeps the mobile browser chrome in brand instead of flashing white.
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", resolved === "dark" ? "#0A1330" : "#111E42");

  return resolved;
}

export function setStoredMode(mode) {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* storage unavailable — the in-memory state still applies for this session */
  }
  return applyTheme(mode);
}

/**
 * Watch the OS setting. Only meaningful while mode === "system"; the returned
 * teardown must be called or the listener outlives the component.
 */
export function watchSystemTheme(onChange) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};

  const query = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = (e) => onChange(e.matches ? "dark" : "light");

  query.addEventListener("change", handler);
  return () => query.removeEventListener("change", handler);
}
