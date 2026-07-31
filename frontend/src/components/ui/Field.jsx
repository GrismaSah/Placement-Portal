import { forwardRef, useId } from "react";
import { cn } from "../../lib/cn";

/**
 * Form field primitives.
 *
 * The wiring here is the whole point: label→control, control→hint and
 * control→error are linked by generated ids, and `aria-invalid` is set from
 * the same `error` prop that colors the border. A screen reader hears the
 * error; it is not conveyed by red alone. The old forms had no labels at all —
 * placeholders were doing that job, which vanishes as soon as you type.
 */

const CONTROL_BASE =
  "w-full rounded-[var(--radius-field)] border bg-[var(--surface-raised)] " +
  "text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] " +
  "transition-[border-color,box-shadow] duration-[var(--duration-fast)] " +
  "disabled:cursor-not-allowed disabled:bg-[var(--surface-hover)] disabled:opacity-60";

const stateClasses = (error) =>
  error
    ? "border-[var(--color-danger-500)] focus:border-[var(--color-danger-500)] " +
      "focus:shadow-[0_0_0_3px_var(--color-danger-50)]"
    : "border-[var(--border-strong)] hover:border-[var(--text-tertiary)] " +
      "focus:border-[var(--brand)] focus:shadow-[0_0_0_3px_var(--brand-subtle)]";

export const FieldShell = ({
  label,
  hint,
  error,
  required,
  htmlFor,
  hintId,
  errorId,
  className,
  children,
}) => (
  <div className={cn("w-full", className)}>
    {label && (
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
      >
        {label}
        {required && (
          <span className="ml-0.5 text-[var(--color-danger-500)]" aria-hidden="true">
            *
          </span>
        )}
      </label>
    )}

    {children}

    {hint && !error && (
      <p id={hintId} className="mt-1.5 text-xs text-[var(--text-tertiary)]">
        {hint}
      </p>
    )}

    {error && (
      <p
        id={errorId}
        className="mt-1.5 text-xs font-medium text-[var(--color-danger-500)]"
      >
        {error}
      </p>
    )}
  </div>
);

/** Shared id plumbing for every control below. */
function useFieldIds(id, { hint, error }) {
  const auto = useId();
  const fieldId = id || auto;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  return {
    fieldId,
    hintId,
    errorId,
    describedBy: cn(errorId, hintId) || undefined,
  };
}

export const Input = forwardRef(function Input(
  {
    label,
    hint,
    error,
    required,
    id,
    leadingIcon,
    trailingIcon,
    className,
    wrapperClassName,
    size = "md",
    ...rest
  },
  ref
) {
  const { fieldId, hintId, errorId, describedBy } = useFieldIds(id, { hint, error });
  const heights = { sm: "h-9 text-sm", md: "h-11", lg: "h-12" };

  return (
    <FieldShell
      label={label}
      hint={hint}
      error={error}
      required={required}
      htmlFor={fieldId}
      hintId={hintId}
      errorId={errorId}
      className={wrapperClassName}
    >
      <div className="relative">
        {leadingIcon && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-[var(--text-tertiary)]"
          >
            {leadingIcon}
          </span>
        )}

        <input
          ref={ref}
          id={fieldId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            CONTROL_BASE,
            stateClasses(error),
            heights[size],
            "px-3.5",
            leadingIcon && "pl-10",
            trailingIcon && "pr-10",
            className
          )}
          {...rest}
        />

        {trailingIcon && (
          <span className="absolute inset-y-0 right-3.5 flex items-center text-[var(--text-tertiary)]">
            {trailingIcon}
          </span>
        )}
      </div>
    </FieldShell>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, hint, error, required, id, rows = 5, maxLength, value, className, ...rest },
  ref
) {
  const { fieldId, hintId, errorId, describedBy } = useFieldIds(id, { hint, error });

  return (
    <FieldShell
      label={label}
      hint={hint}
      error={error}
      required={required}
      htmlFor={fieldId}
      hintId={hintId}
      errorId={errorId}
    >
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        required={required}
        maxLength={maxLength}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(CONTROL_BASE, stateClasses(error), "resize-y px-3.5 py-3", className)}
        {...rest}
      />

      {/* The old cover-letter field had a 30–500 char server rule and no client
          feedback, so users only discovered it on a failed submit. */}
      {maxLength != null && (
        <p
          className="mt-1.5 text-right text-xs text-[var(--text-tertiary)]"
          data-numeric
        >
          {(value?.length ?? 0).toLocaleString()} / {maxLength.toLocaleString()}
        </p>
      )}
    </FieldShell>
  );
});

export const Select = forwardRef(function Select(
  { label, hint, error, required, id, options = [], placeholder, className, children, ...rest },
  ref
) {
  const { fieldId, hintId, errorId, describedBy } = useFieldIds(id, { hint, error });

  return (
    <FieldShell
      label={label}
      hint={hint}
      error={error}
      required={required}
      htmlFor={fieldId}
      hintId={hintId}
      errorId={errorId}
    >
      <div className="relative">
        <select
          ref={ref}
          id={fieldId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            CONTROL_BASE,
            stateClasses(error),
            "h-11 cursor-pointer appearance-none px-3.5 pr-10",
            className
          )}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) =>
            typeof opt === "string" ? (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ) : (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            )
          )}
          {children}
        </select>

        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--text-tertiary)]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="m5 7.5 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </FieldShell>
  );
});

export default Input;
