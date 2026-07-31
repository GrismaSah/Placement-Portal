import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";
import { cn } from "../../lib/cn";
import JainLogo from "../brand/JainLogo";
import { Button, ThemeToggle } from "../ui";
import Footer from "./Footer";

/**
 * Frame for logged-out pages.
 *
 * The header is STICKY and opaque, not fixed-and-transparent. A transparent
 * bar over a navy hero left the wordmark and the nav illegible, and a fixed
 * bar sat on top of the first heading instead of pushing it down. Sticky keeps
 * it in the document flow — nothing can ever be hidden underneath it.
 *
 * It also scales with the viewport: 72px tall with full navigation on desktop,
 * 60px with a hamburger below `md`.
 */

const NAV = [
  { to: "/app/jobs", label: "Openings" },
  { to: "/#how-it-works", label: "How it works", hash: true },
  { to: "/#values", label: "About", hash: true },
];

const PublicShell = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => setMenuOpen(false), [location.pathname]);

  // Only used to deepen the shadow once you leave the top — the background is
  // always solid.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--surface)]">
      <a
        href="#main"
        className="sr-only-focusable z-[60] m-3 rounded-[var(--radius-field)] bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white"
      >
        Skip to content
      </a>

      <header
        className={cn(
          "sticky top-0 z-50 border-b bg-[var(--surface)]/95 backdrop-blur-md",
          "transition-shadow duration-[var(--duration-base)]",
          scrolled
            ? "border-[var(--border)] shadow-[var(--shadow-sm)]"
            : "border-transparent"
        )}
      >
        <div className="mx-auto flex h-15 w-full max-w-7xl items-center gap-4 px-4 sm:px-6 md:h-18 lg:px-8">
          <Link to="/" aria-label="JAIN Placement Portal — home" className="shrink-0">
            <JainLogo variant="full" height={32} className="md:hidden" />
            <JainLogo variant="full" height={40} className="hidden md:block" />
          </Link>

          {/* Desktop nav */}
          <nav aria-label="Main" className="ml-6 hidden lg:block">
            <ul className="flex items-center gap-1">
              {NAV.map(({ to, label, hash }) => (
                <li key={to}>
                  {hash ? (
                    <a
                      href={to.slice(1)}
                      className="rounded-[var(--radius-field)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                    >
                      {label}
                    </a>
                  ) : (
                    <NavLink
                      to={to}
                      className="rounded-[var(--radius-field)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                    >
                      {label}
                    </NavLink>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle variant="icon" />

            <Button to="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">
              Sign in
            </Button>
            <Button to="/register" size="sm" className="hidden sm:inline-flex">
              Get started
            </Button>

            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-controls="public-mobile-menu"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="grid size-10 place-items-center rounded-[var(--radius-field)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] lg:hidden"
            >
              {menuOpen ? <FiX className="size-5" /> : <FiMenu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div
            id="public-mobile-menu"
            className="animate-fade-in border-t border-[var(--border)] bg-[var(--surface)] lg:hidden"
          >
            <nav aria-label="Mobile" className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
              <ul className="space-y-1">
                {NAV.map(({ to, label, hash }) => (
                  <li key={to}>
                    {hash ? (
                      <a
                        href={to.slice(1)}
                        onClick={() => setMenuOpen(false)}
                        className="block rounded-[var(--radius-field)] px-3 py-2.5 font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                      >
                        {label}
                      </a>
                    ) : (
                      <Link
                        to={to}
                        className="block rounded-[var(--radius-field)] px-3 py-2.5 font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                      >
                        {label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>

              <div className="mt-3 grid gap-2 border-t border-[var(--border)] pt-3 sm:hidden">
                <Button to="/login" variant="outline" fullWidth>
                  Sign in
                </Button>
                <Button to="/register" fullWidth>
                  Get started
                </Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default PublicShell;
