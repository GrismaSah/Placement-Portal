import { useContext } from "react";
import { Context } from "../../main";
import JainLogo from "../brand/JainLogo";
import { Button } from "../ui";

/**
 * 404.
 *
 * Sends the visitor somewhere useful based on whether they're signed in,
 * rather than always to "/" — which, for an authenticated user, just bounced
 * them through a redirect to their dashboard anyway.
 */
const NotFound = () => {
  const { isAuthorized } = useContext(Context);

  return (
    <div className="grid min-h-dvh place-items-center bg-[var(--surface-sunken)] px-6">
      <div className="w-full max-w-md text-center">
        <JainLogo variant="full" height={40} className="mx-auto" />

        <p
          data-numeric
          className="text-display mt-10 font-bold tracking-tight text-[var(--brand)]"
        >
          404
        </p>

        <h1 className="text-h2 mt-2 font-bold tracking-tight text-[var(--text-primary)]">
          Page not found
        </h1>
        <p className="mt-3 text-[var(--text-secondary)] text-balance-pretty">
          The page you&rsquo;re looking for doesn&rsquo;t exist, or may have moved.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button to={isAuthorized ? "/app/dashboard" : "/"}>
            {isAuthorized ? "Back to dashboard" : "Back to home"}
          </Button>
          <Button to="/app/jobs" variant="outline">
            Browse openings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
