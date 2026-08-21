import { BRAND } from "../../constants/brand";

/**
 * The institutional wordmark, drawn as inline SVG.
 *
 * This replaces the previous institution's PNG crest and the six inconsistent
 * ways it used to be referenced: an absolute path in the navbar, relative
 * paths in the auth screens (which 404'd on any nested route), and three files
 * importing out of `public/`, which made Vite emit the same asset twice.
 *
 * Drawn rather than loaded because it has to render crisply from a 20px
 * sidebar rail up to a 64px hero lockup, invert for dark mode, and cost no
 * network request — none of which a 100KB PNG does.
 *
 * If the official Jain artwork is dropped at `public/jain-logo.svg`, swap the
 * `<svg>` below for an `<img>`; the props and call sites stay identical.
 *
 * @param {"full"|"compact"|"mark"} variant  full = wordmark + descriptor,
 *   compact = wordmark only, mark = the J badge (favicon / avatar fallback).
 * @param {"navy"|"white"|"auto"} tone  `auto` inherits currentColor.
 */
const JainLogo = ({
  variant = "full",
  tone = "auto",
  height,
  className = "",
  ...rest
}) => {
  const wordColor =
    tone === "white" ? "#FFFFFF" : tone === "navy" ? BRAND.colors.navy : "currentColor";
  const accent = BRAND.colors.gold;

  const a11y = {
    role: "img",
    "aria-label": `${BRAND.name} ${BRAND.product}`,
  };

  if (variant === "mark") {
    const size = height ?? 32;
    return (
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        className={className}
        {...a11y}
        {...rest}
      >
        <rect width="64" height="64" rx="14" fill={tone === "white" ? "#FFFFFF" : BRAND.colors.navy} />
        <path
          d="M38.4 14v25.9c0 6.4-4.1 10.3-10.6 10.3-5.3 0-9.1-2.6-10.4-7.1l6.6-2.2c.6 2 1.9 3 3.7 3 2.3 0 3.6-1.5 3.6-4.2V20.6h-8.4V14h15.5z"
          fill={tone === "white" ? BRAND.colors.navy : "#FFFFFF"}
        />
        <circle cx="46.5" cy="45.5" r="4.5" fill={accent} />
      </svg>
    );
  }

  const isFull = variant === "full";
  const h = height ?? (isFull ? 40 : 26);
  const viewBoxHeight = isFull ? 58 : 34;

  return (
    <svg
      viewBox={`0 0 220 ${viewBoxHeight}`}
      height={h}
      className={className}
      style={{ width: "auto" }}
      {...a11y}
      {...rest}
    >
      {/* JAIN — bold capitals. The brand guidelines call for a heavy grotesque
          in caps to read as "confidence, leadership, autonomy". */}
      <text
        x="0"
        y="27"
        fill={wordColor}
        fontFamily='Inter, "Helvetica Neue", Helvetica, Arial, sans-serif'
        fontSize="34"
        fontWeight="800"
        letterSpacing="1.5"
      >
        JAIN
      </text>

      {/* The gold full-stop: the one place the accent appears in the mark. */}
      <circle cx="97" cy="24" r="4.6" fill={accent} />

      {isFull && (
        <text
          x="1"
          y="46"
          fill={wordColor}
          opacity="0.72"
          fontFamily='Inter, "Helvetica Neue", Helvetica, Arial, sans-serif'
          fontSize="8.5"
          fontWeight="600"
          letterSpacing="2.6"
        >
          DEEMED-TO-BE UNIVERSITY
        </text>
      )}
    </svg>
  );
};

// A `JainLockup` wrapper (logo + divider + product name) used to be exported
// here, documented as "used in the app header, auth panel and footer". It was
// imported by none of them — each composes <JainLogo> with its own spacing
// instead. A component whose docstring claims call sites it does not have is
// worse than no component, so it was removed rather than left to mislead.

export default JainLogo;
