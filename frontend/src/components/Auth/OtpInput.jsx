import { useEffect, useRef } from "react";
import { cn } from "../../lib/cn";

/**
 * Six-box verification code entry.
 *
 * Replaces a single free-text field. Handles the things people actually do
 * with these: pasting the whole code, backspacing across boxes, and arrowing
 * between them. `inputMode="numeric"` brings up the number pad on phones.
 */
const OtpInput = ({ value = "", onChange, length = 6, autoFocus = true, error }) => {
  const refs = useRef([]);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const setChar = (index, char) => {
    const next = value.padEnd(length, " ").split("");
    next[index] = char;
    onChange(next.join("").replace(/\s/g, "").slice(0, length));
  };

  const handleChange = (index, raw) => {
    const digits = raw.replace(/\D/g, "");
    if (!digits) return;

    if (digits.length > 1) {
      // Pasting into any box fills from that box onward.
      const merged = (value.slice(0, index) + digits).slice(0, length);
      onChange(merged);
      refs.current[Math.min(merged.length, length - 1)]?.focus();
      return;
    }

    setChar(index, digits);
    if (index < length - 1) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (value[index]) {
        // Clear this box first; a second press moves back.
        onChange(value.slice(0, index) + value.slice(index + 1));
      } else if (index > 0) {
        onChange(value.slice(0, index - 1) + value.slice(index));
        refs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      refs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      refs.current[index + 1]?.focus();
    }
  };

  return (
    <div>
      <div
        className="flex gap-2 sm:gap-3"
        role="group"
        aria-label={`${length}-digit verification code`}
      >
        {Array.from({ length }).map((_, i) => (
          <input
            key={i}
            ref={(el) => (refs.current[i] = el)}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={length}
            value={value[i] ?? ""}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onFocus={(e) => e.target.select()}
            aria-label={`Digit ${i + 1}`}
            aria-invalid={error ? true : undefined}
            className={cn(
              "h-14 w-full rounded-[var(--radius-field)] border text-center text-xl font-bold",
              "bg-[var(--surface-raised)] text-[var(--text-primary)]",
              "transition-[border-color,box-shadow] duration-[var(--duration-fast)]",
              error
                ? "border-[var(--color-danger-500)]"
                : "border-[var(--border-strong)] focus:border-[var(--brand)] focus:shadow-[0_0_0_3px_var(--brand-subtle)]"
            )}
          />
        ))}
      </div>

      {error && (
        <p className="mt-2 text-xs font-medium text-[var(--color-danger-500)]">{error}</p>
      )}
    </div>
  );
};

export default OtpInput;
