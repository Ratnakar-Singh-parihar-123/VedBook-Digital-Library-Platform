import PropTypes from "prop-types";

/**
 * VedBook Unified Professional Loader
 *
 * Designed to fit the warm cream & forest-green editorial aesthetic.
 *
 * Usage:
 *  - Inline button: <Loader inline size="sm" label="Saving..." />
 *  - Section / Card: <Loader center label="Loading books..." />
 *  - Fullscreen blocking: <Loader fullScreen label="Please wait..." sublabel="Securing session" />
 *  - Direct spinner: <Loader size={24} tone="gold" />
 */
export default function Loader({
  size = 28,
  tone = "dark",
  label,
  sublabel,
  fullScreen = false,
  center = false,
  inline = false,
  className = "",
}) {
  // Normalize size
  let numericSize = typeof size === "number" ? size : 28;
  if (size === "xs") numericSize = 14;
  else if (size === "sm") numericSize = 18;
  else if (size === "md") numericSize = 28;
  else if (size === "lg") numericSize = 38;
  else if (size === "xl") numericSize = 48;

  // Palette tones
  const isLight = tone === "light";
  const isGold = tone === "gold";

  const strokeColor = isLight
    ? "#FAF8F3"
    : isGold
    ? "#A8833E"
    : "#193F34";

  const trackColor = isLight
    ? "rgba(250, 248, 243, 0.2)"
    : isGold
    ? "rgba(168, 131, 62, 0.2)"
    : "rgba(25, 63, 52, 0.15)";

  const textColor = isLight
    ? "text-cream/90"
    : isGold
    ? "text-gold"
    : "text-primary";

  const subtextColor = isLight
    ? "text-cream/60"
    : isGold
    ? "text-gold/70"
    : "text-primary/60";

  // SVG Spinner Graphic
  const spinnerSvg = (
    <svg
      width={numericSize}
      height={numericSize}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="animate-spin shrink-0"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9.5"
        stroke={trackColor}
        strokeWidth="2.75"
        strokeLinecap="round"
      />
      <path
        d="M12 2.5C17.2467 2.5 21.5 6.75329 21.5 12"
        stroke={strokeColor}
        strokeWidth="2.75"
        strokeLinecap="round"
      />
    </svg>
  );

  // Inline mode (perfect for buttons or breadcrumbs)
  if (inline) {
    return (
      <span
        role="status"
        aria-live="polite"
        className={`inline-flex items-center gap-2 ${className}`}
      >
        {spinnerSvg}
        {label && (
          <span className={`text-xs font-medium tracking-wide ${textColor}`}>
            {label}
          </span>
        )}
        <span className="sr-only">{label || "Loading"}</span>
      </span>
    );
  }

  // Full-screen blocking overlay
  if (fullScreen) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`fixed inset-0 z-[120] flex flex-col items-center justify-center p-6 backdrop-blur-md transition-all ${
          isLight ? "bg-primary/80" : "bg-cream/85"
        } ${className}`}
      >
        <div className="relative flex flex-col items-center gap-3 p-8 bg-white/70 border border-primary/10 rounded-3xl shadow-card backdrop-blur-lg max-w-xs w-full text-center">
          <div className="relative">
            {spinnerSvg}
            <div className="absolute inset-0 rounded-full blur-md bg-gold/20 -z-10 animate-pulse" />
          </div>

          {label && (
            <p className={`font-display text-base font-semibold ${textColor}`}>
              {label}
            </p>
          )}

          {sublabel && (
            <p className={`text-xs ${subtextColor} max-w-[200px]`}>
              {sublabel}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Container center mode or standalone
  return (
    <div
      role="status"
      aria-live="polite"
      className={`${
        center
          ? "w-full min-h-[160px] flex flex-col items-center justify-center py-8"
          : "inline-flex flex-col items-center justify-center gap-2"
      } ${className}`}
    >
      {spinnerSvg}
      {label && (
        <p
          className={`text-xs font-medium tracking-wider uppercase mt-2.5 font-sans ${textColor}`}
        >
          {label}
        </p>
      )}
      {sublabel && (
        <p className={`text-[11px] ${subtextColor} max-w-xs text-center mt-0.5`}>
          {sublabel}
        </p>
      )}
      <span className="sr-only">{label || "Loading"}</span>
    </div>
  );
}

Loader.propTypes = {
  size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  tone: PropTypes.oneOf(["dark", "light", "gold"]),
  label: PropTypes.node,
  sublabel: PropTypes.node,
  fullScreen: PropTypes.bool,
  center: PropTypes.bool,
  inline: PropTypes.bool,
  className: PropTypes.string,
};
