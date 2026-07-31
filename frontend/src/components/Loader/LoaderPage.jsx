import JainLogo from "../brand/JainLogo";

/**
 * Boot splash, shown only while the initial auth check is in flight.
 *
 * Branded rather than blank — this used to be a bare teal spinner on a white
 * page, which read as a broken load. It paints on the themed surface, so a
 * dark mode user never gets a white flash.
 */
const LoaderPage = () => (
  <div
    className="grid min-h-dvh place-items-center bg-[var(--surface-sunken)]"
    role="status"
    aria-label="Loading"
  >
    <div className="flex flex-col items-center gap-5">
      <JainLogo variant="full" height={44} />
      <span
        aria-hidden="true"
        className="block h-0.5 w-28 overflow-hidden rounded-full bg-[var(--surface-active)]"
      >
        <span className="block h-full w-1/3 rounded-full bg-[var(--accent)] [animation:loader-sweep_1.1s_ease-in-out_infinite]" />
      </span>
    </div>

    <style>{`
      @keyframes loader-sweep {
        0%   { transform: translateX(-100%); }
        100% { transform: translateX(300%); }
      }
    `}</style>
  </div>
);

export default LoaderPage;
