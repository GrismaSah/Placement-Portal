import React, { createContext, useState } from "react";
import ReactDOM from "react-dom/client";

// The app's only stylesheet. The design tokens and every component style live
// here; the legacy App.css this comment used to describe is gone, and nothing
// imports it any more.
import "./styles/theme.css";

import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
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
    {/* Outermost, so a throw inside the providers is caught too. Without it a
        render-phase error unmounts the tree and leaves a blank white page. */}
    <ErrorBoundary>
      <AppWrapper />
    </ErrorBoundary>
  </React.StrictMode>
);
