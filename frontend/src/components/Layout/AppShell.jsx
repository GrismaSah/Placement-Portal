import { useContext, useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiChevronsLeft, FiLogOut, FiMenu, FiUser, FiX } from "react-icons/fi";
import { Context } from "../../main";
import { api, apiError } from "../../lib/api";
import { cn } from "../../lib/cn";
import { invalidate } from "../../lib/useQuery";
import { loginPathFor, mobileNavFor, navFor, roleLabel } from "../../lib/roles";
import { displayName } from "../../utils/avatar";
import JainLogo from "../brand/JainLogo";
import { Avatar, Menu, MenuItem, MenuLabel, MenuSeparator, ThemeToggle } from "../ui";
import NotificationBell from "../Notifications/NotificationBell";

/**
 * The authenticated application frame.
 *
 * Replaces the old approach of a single top navbar that was hidden with
 * `className={isAuthorized ? "navbarShow" : "navbarHide"}` — the markup was
 * always mounted, just visually hidden, so its links stayed in the tab order
 * for logged-out users.
 *
 * Layout: persistent sidebar from `lg`, off-canvas drawer below that, and a
 * bottom tab bar on phones so the primary destinations stay thumb-reachable.
 */

const SidebarLink = ({ to, label, icon: Icon, end, collapsed, onNavigate }) => (
  <NavLink
    to={to}
    end={end}
    onClick={onNavigate}
    className={({ isActive }) =>
      cn(
        "group relative flex items-center gap-3 rounded-[var(--radius-field)] px-3 py-2.5",
        "text-sm font-medium transition-colors duration-[var(--duration-fast)]",
        "focus-visible:outline-[var(--focus-ring-inverse)]",
        isActive
          ? "bg-white/10 text-white"
          : "text-white/60 hover:bg-white/5 hover:text-white"
      )
    }
  >
    {({ isActive }) => (
      <>
        {/* The gold rail is the only place the accent appears in the nav. */}
        <span
          aria-hidden="true"
          className={cn(
            "absolute left-0 h-5 w-0.5 rounded-r-full bg-[var(--color-gold-500)] transition-opacity",
            isActive ? "opacity-100" : "opacity-0"
          )}
        />
        <Icon className="size-[18px] shrink-0" aria-hidden="true" />
        <span className={cn("truncate", collapsed && "lg:sr-only")}>{label}</span>
      </>
    )}
  </NavLink>
);

const AppShell = () => {
  const { user, setUser, setIsAuthorized } = useContext(Context);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("jain-sidebar-collapsed") === "1"
  );
  const location = useLocation();
  const navigate = useNavigate();

  const items = navFor(user?.role);
  const mobileItems = mobileNavFor(user?.role);

  // Close the drawer on navigation, otherwise it covers the page you just
  // asked for.
  useEffect(() => setDrawerOpen(false), [location.pathname]);

  useEffect(() => {
    localStorage.setItem("jain-sidebar-collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e) => e.key === "Escape" && setDrawerOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const handleLogout = async () => {
    // Admins live in a separate collection with their own logout handler.
    const endpoint = user?.role === "Admin" ? "/api/v1/admin/logout" : "/api/v1/user/logout";
    // Read before setUser({}) wipes it: each role signs back in at its own
    // unlinked route, so "/login" for everyone stranded Recruiters and Admins.
    const backToLogin = loginPathFor(user?.role);
    try {
      const { data } = await api.get(endpoint);
      toast.success(data.message || "Signed out");
      setUser({});
      setIsAuthorized(false);
      navigate(backToLogin, { replace: true });
    } catch (error) {
      toast.error(apiError(error, "Could not sign out"));
    } finally {
      // The module-level useQuery cache outlives a client-side route change,
      // so the next account on this browser would see the previous one's data.
      invalidate();
    }
  };

  const sidebarBody = (
    <>
      <div
        className={cn(
          "flex h-16 shrink-0 items-center gap-2 px-4",
          collapsed && "lg:justify-center lg:px-2"
        )}
      >
        <NavLink to="/app/dashboard" className="flex items-center focus-visible:outline-[var(--focus-ring-inverse)]">
          {collapsed ? (
            <JainLogo variant="mark" height={32} />
          ) : (
            <JainLogo variant="full" tone="white" height={34} />
          )}
        </NavLink>

        <button
          type="button"
          onClick={() => setDrawerOpen(false)}
          className="ml-auto grid size-9 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Close navigation"
        >
          <FiX className="size-5" />
        </button>
      </div>

      <nav aria-label="Main" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) => (
          <SidebarLink
            key={item.to}
            {...item}
            collapsed={collapsed}
            onNavigate={() => setDrawerOpen(false)}
          />
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/10 p-3">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="hidden w-full items-center gap-3 rounded-[var(--radius-field)] px-3 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white lg:flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <FiChevronsLeft
            className={cn("size-[18px] shrink-0 transition-transform", collapsed && "rotate-180")}
            aria-hidden="true"
          />
          <span className={cn(collapsed && "sr-only")}>Collapse</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-dvh bg-[var(--surface-sunken)]">
      <a href="#main" className="sr-only-focusable z-[60] m-3 rounded-[var(--radius-field)] bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white">
        Skip to content
      </a>

      {/* ---- Sidebar: fixed from lg ---- */}
      <aside
        className={cn(
          "bg-brand-gradient fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-white/10 transition-[width] duration-[var(--duration-base)] lg:flex",
          collapsed ? "w-[76px]" : "w-64"
        )}
      >
        {sidebarBody}
      </aside>

      {/* ---- Drawer: below lg ---- */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="animate-fade-in absolute inset-0 bg-[var(--color-navy-990)]/70 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside className="bg-brand-gradient animate-fade-rise absolute inset-y-0 left-0 flex w-72 flex-col border-r border-white/10">
            {sidebarBody}
          </aside>
        </div>
      )}

      {/* ---- Content column ---- */}
      <div className={cn("transition-[padding] duration-[var(--duration-base)]", collapsed ? "lg:pl-[76px]" : "lg:pl-64")}>
        <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--surface)]/85 backdrop-blur-md">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="grid size-10 place-items-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] lg:hidden"
              aria-label="Open navigation"
            >
              <FiMenu className="size-5" />
            </button>

            <div className="lg:hidden">
              <JainLogo variant="mark" height={30} />
            </div>

            <div className="ml-auto flex items-center gap-1.5">
              <ThemeToggle variant="icon" />
              <NotificationBell />

              <Menu
                menuLabel="Account"
                trigger={
                  <span className="flex items-center gap-2 rounded-full p-0.5 transition-colors hover:bg-[var(--surface-hover)]">
                    <Avatar user={user} size={36} />
                  </span>
                }
              >
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <Avatar user={user} size={40} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                      {displayName(user) || "Your account"}
                    </p>
                    <p className="truncate text-xs text-[var(--text-tertiary)]">{user?.email}</p>
                  </div>
                </div>

                <MenuSeparator />
                <MenuLabel>{roleLabel(user?.role)}</MenuLabel>

                <MenuItem to="/app/profile">
                  <FiUser /> My profile
                </MenuItem>

                <MenuSeparator />

                <div className="px-3 py-2">
                  <ThemeToggle />
                </div>

                <MenuSeparator />

                <MenuItem danger onClick={handleLogout}>
                  <FiLogOut /> Sign out
                </MenuItem>
              </Menu>
            </div>
          </div>
        </header>

        <main id="main" className="mx-auto max-w-7xl px-4 pt-6 pb-24 sm:px-6 lg:pb-10">
          <Outlet />
        </main>
      </div>

      {/* ---- Mobile bottom bar ---- */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="flex">
          {mobileItems.map(({ to, label, icon: Icon, end }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center gap-1 py-2.5 text-[0.6875rem] font-medium transition-colors",
                    isActive
                      ? "text-[var(--brand)]"
                      : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        "grid h-7 w-12 place-items-center rounded-full transition-colors",
                        isActive && "bg-[var(--brand-subtle)]"
                      )}
                    >
                      <Icon className="size-[18px]" aria-hidden="true" />
                    </span>
                    <span className="truncate px-1">{label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default AppShell;
