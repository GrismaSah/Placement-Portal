import React, { createContext, useState } from "react";
import ReactDOM from "react-dom/client";

// Design tokens first, legacy App.css second (App.jsx imports it). Until the
// last screen is migrated in Phase 9 the two stylesheets coexist, and the
// later import has to win on the rules they both define.
import "./styles/theme.css";

import App from "./App.jsx";
import { ThemeProvider } from "./lib/useTheme.jsx";

export const Context = createContext({
  isAuthorized: false,
});

const AppWrapper = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [user, setUser] = useState({});
  // False until the initial /getuser call settles. Protected pages must wait for
  // this: isAuthorized starts false, so redirecting on it immediately bounces a
  // logged-in user off any page they load or refresh directly.
  const [authChecked, setAuthChecked] = useState(false);

  return (
    <Context.Provider
      value={{
        isAuthorized,
        setIsAuthorized,
        user,
        setUser,
        authChecked,
        setAuthChecked,
      }}
    >
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </Context.Provider>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);
