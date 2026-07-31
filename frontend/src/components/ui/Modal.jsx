import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";
import { cn } from "../../lib/cn";
import Button from "./Button";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), ' +
  'select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible dialog.
 *
 * Rendered in a portal on document.body so it can never be clipped by an
 * ancestor's overflow or stacking context — the previous ResumeModal was
 * nested inside the page and inherited the global `overflow-x: hidden`.
 *
 * Handles the four things a dialog must: focus moves in on open, Tab is
 * trapped inside, Escape closes, and focus returns to whatever opened it.
 */
const Modal = ({
  open,
  onClose,
  title,
  description,
  size = "md",
  footer,
  children,
  closeOnBackdrop = true,
  className,
}) => {
  const panelRef = useRef(null);
  const previouslyFocused = useRef(null);
  const titleId = useRef(`modal-title-${Math.random().toString(36).slice(2)}`).current;

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose?.();
        return;
      }

      if (e.key !== "Tab") return;

      const nodes = panelRef.current?.querySelectorAll(FOCUSABLE);
      if (!nodes?.length) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      // Wrap in both directions, otherwise Tab escapes to the page behind.
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement;

    // Lock the page behind the dialog, compensating for the scrollbar so the
    // layout does not shift sideways as it disappears.
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    const { overflow, paddingRight } = document.body.style;
    document.body.style.overflow = "hidden";
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;

    const focusTimer = requestAnimationFrame(() => {
      const target = panelRef.current?.querySelector(FOCUSABLE) ?? panelRef.current;
      target?.focus();
    });

    return () => {
      cancelAnimationFrame(focusTimer);
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-6xl",
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6"
      onKeyDown={handleKeyDown}
    >
      <div
        className="animate-fade-in absolute inset-0 bg-[var(--color-navy-990)]/70 backdrop-blur-sm"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn(
          "animate-scale-in relative flex max-h-[92dvh] w-full flex-col",
          "rounded-t-[var(--radius-panel)] sm:rounded-[var(--radius-panel)]",
          "border border-[var(--border)] bg-[var(--surface-overlay)] shadow-[var(--shadow-lg)]",
          sizes[size],
          className
        )}
      >
        {(title || onClose) && (
          <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] p-5 sm:p-6">
            <div className="min-w-0">
              {title && (
                <h2
                  id={titleId}
                  className="text-lg font-semibold tracking-tight text-[var(--text-primary)]"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close dialog"
              className="-mr-2 -mt-1 shrink-0"
            >
              <FiX className="size-5" />
            </Button>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">{children}</div>

        {footer && (
          <div className="flex flex-wrap justify-end gap-3 border-t border-[var(--border)] p-5 sm:p-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
