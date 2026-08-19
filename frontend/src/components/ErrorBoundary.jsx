import React from "react";

/**
 * Last line of defence against a blank page.
 *
 * React unmounts the whole tree when a render throws and nothing catches it,
 * so a single bad value — a CGPA that arrives as a string and meets
 * `.toFixed()`, an unexpected role that leaves a lookup undefined — took the
 * entire app down to white. Nothing above this point rendered any fallback.
 *
 * Deliberately a class: `componentDidCatch` / `getDerivedStateFromError` have
 * no hook equivalent, and this is the one place in the codebase that needs it.
 *
 * Reloading rather than resetting state is the honest option here. We do not
 * know which subtree corrupted, and a boundary that clears its own error only
 * to re-render the same broken props loops silently.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // No error-reporting service is wired up, so the console is the only place
    // this can go. Without it the stack is lost entirely once the UI swaps out.
    console.error("Unhandled render error:", error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        role="alert"
        className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--surface-sunken,#F4F6FA)] px-6 text-center"
      >
        <h1 className="text-xl font-semibold text-[var(--text-primary,#1E1916)]">
          Something went wrong
        </h1>
        <p className="max-w-sm text-sm text-[var(--text-secondary,#525579)]">
          The page hit an unexpected error and could not finish loading.
          Reloading usually clears it.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-[var(--radius-control,0.625rem)] bg-[var(--brand,#111E42)] px-5 py-2.5 text-sm font-semibold text-white"
        >
          Reload the page
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
