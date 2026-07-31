import { Link } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { BRAND } from "../../constants/brand";
import JainLogo from "../brand/JainLogo";
import { ThemeToggle } from "../ui";

/**
 * Split-screen frame for every auth screen.
 *
 * Left: a navy brand panel carrying the institution and one piece of proof.
 * Right: the form, and nothing else. On phones the panel collapses to a
 * compact header so the form is above the fold.
 */
const AuthLayout = ({ title, subtitle, children, footer }) => (
  <div className="flex min-h-dvh flex-col lg:flex-row">
    {/* ---- Brand panel ---- */}
    <div className="bg-brand-gradient relative flex flex-col justify-between overflow-hidden px-6 py-8 sm:px-10 lg:w-[46%] lg:px-14 lg:py-12">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse at 30% 20%, black 30%, transparent 70%)",
        }}
      />

      <div className="relative flex items-center justify-between gap-4">
        <Link to="/" aria-label="Home">
          <JainLogo variant="full" tone="white" height={38} />
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-white/60 transition-colors hover:text-white focus-visible:outline-[var(--focus-ring-inverse)]"
        >
          <FiArrowLeft aria-hidden="true" className="size-4" /> Home
        </Link>
      </div>

      <div className="relative hidden lg:block">
        <p className="text-h1 font-bold tracking-tight text-white text-balance-pretty">
          Where JAIN talent meets{" "}
          <span className="text-[var(--color-gold-500)]">industry</span>.
        </p>
        <p className="mt-5 max-w-md text-white/60 text-balance-pretty">
          {BRAND.description}
        </p>
      </div>

      <p className="relative hidden text-sm text-white/40 lg:block">
        © {new Date().getFullYear()} {BRAND.legalName}
      </p>
    </div>

    {/* ---- Form panel ---- */}
    <div className="flex flex-1 flex-col bg-[var(--surface)]">
      <div className="flex justify-end px-6 pt-6 sm:px-10">
        <ThemeToggle variant="icon" />
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <h1 className="text-h2 font-bold tracking-tight text-[var(--text-primary)]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-[0.9375rem] text-[var(--text-secondary)] text-balance-pretty">
              {subtitle}
            </p>
          )}

          <div className="mt-8">{children}</div>

          {footer && (
            <div className="mt-8 text-center text-sm text-[var(--text-secondary)]">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default AuthLayout;
