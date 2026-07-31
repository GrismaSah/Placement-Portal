import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/cn";

/**
 * Dropdown menu.
 *
 * Generalises the dismissal behaviour that already existed on the account
 * dropdown — outside-click plus Escape-returns-focus-to-trigger. That was the
 * one properly accessible interaction in the old codebase; this makes it
 * reusable instead of copy-pasted.
 */
export const Menu = ({ trigger, children, align = "end", className, menuLabel }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const triggerRef = useRef(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e) => {
      if (
        menuRef.current?.contains(e.target) ||
        triggerRef.current?.contains(e.target)
      ) {
        return;
      }
      setOpen(false);
    };

    const onKeyDown = (e) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      // Returning focus to the trigger is what stops this being a keyboard trap.
      triggerRef.current?.focus();
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        className="inline-flex rounded-full"
      >
        {trigger}
      </button>

      {open && (
        <div
          ref={menuRef}
          id={id}
          role="menu"
          aria-label={menuLabel}
          onClick={() => setOpen(false)}
          className={cn(
            "animate-scale-in absolute top-[calc(100%+0.5rem)] z-40 min-w-56 origin-top",
            "overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)]",
            "bg-[var(--surface-overlay)] p-1.5 shadow-[var(--shadow-lg)]",
            align === "end" ? "right-0" : "left-0",
            className
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
};

const ITEM_CLASS =
  "flex w-full items-center gap-2.5 rounded-[calc(var(--radius-field)-2px)] px-3 py-2 " +
  "text-sm font-medium text-[var(--text-secondary)] transition-colors " +
  "hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] [&>svg]:size-4 [&>svg]:shrink-0";

export const MenuItem = ({ to, onClick, danger, children, ...rest }) => {
  const className = cn(
    ITEM_CLASS,
    danger &&
      "text-[var(--color-danger-500)] hover:bg-[var(--color-danger-50)] hover:text-[var(--color-danger-500)]"
  );

  if (to) {
    return (
      <Link to={to} role="menuitem" className={className} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" role="menuitem" onClick={onClick} className={className} {...rest}>
      {children}
    </button>
  );
};

export const MenuLabel = ({ children }) => (
  <p className="px-3 pt-2 pb-1 text-xs font-semibold tracking-wide text-[var(--text-tertiary)] uppercase">
    {children}
  </p>
);

export const MenuSeparator = () => (
  <hr className="my-1.5 border-t border-[var(--border)]" role="separator" />
);

export default Menu;
