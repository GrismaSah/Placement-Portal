import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  applyTheme,
  getStoredMode,
  resolveTheme,
  setStoredMode,
  watchSystemTheme,
} from "./theme";

const ThemeContext = createContext({
  mode: "system",
  theme: "light",
  setMode: () => {},
  toggle: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [mode, setModeState] = useState(getStoredMode);
  const [theme, setTheme] = useState(() => resolveTheme(getStoredMode()));

  useEffect(() => {
    setTheme(applyTheme(mode));
  }, [mode]);

  // While on "system", track the OS live so the app flips with it rather than
  // only at the next reload.
  useEffect(() => {
    if (mode !== "system") return;
    return watchSystemTheme(() => setTheme(applyTheme("system")));
  }, [mode]);

  const setMode = useCallback((next) => {
    setModeState(next);
    setTheme(setStoredMode(next));
  }, []);

  // Toggle resolves against what is *currently on screen*, so the first click
  // from "system" always visibly flips rather than appearing to do nothing.
  const toggle = useCallback(() => {
    setMode(resolveTheme(getStoredMode()) === "dark" ? "light" : "dark");
  }, [setMode]);

  return (
    <ThemeContext.Provider value={{ mode, theme, setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export default useTheme;
