import PropTypes from "prop-types";

/**
 * Base Shimmer Skeleton primitive
 */
export function Skeleton({
  className = "",
  rounded = "rounded-xl",
  tone = "default",
  style,
  ...props
}) {
  const toneClass =
    tone === "light"
      ? "animate-shimmer-light bg-cream/10"
      : tone === "gold"
      ? "animate-shimmer-gold bg-gold/10"
      : "animate-shimmer bg-primary/5";

  return (
    <div
      aria-hidden="true"
      className={`${toneClass} ${rounded} ${className}`}
      style={style}
      {...props}
    />
  );
}

Skeleton.propTypes = {
  className: PropTypes.string,
  rounded: PropTypes.string,
  tone: PropTypes.oneOf(["default", "light", "gold"]),
  style: PropTypes.object,
};

/**
 * Text Lines Skeleton
 */
export function SkeletonText({
  lines = 2,
  className = "",
  lastLineWidth = "60%",
  lineHeight = "h-3.5",
  gap = "space-y-2",
  tone = "default",
}) {
  return (
    <div className={`${gap} ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => {
        const isLast = i === lines - 1;
        return (
          <Skeleton
            key={i}
            tone={tone}
            className={`${lineHeight} rounded`}
            style={{ width: isLast ? lastLineWidth : "100%" }}
          />
        );
      })}
    </div>
  );
}

SkeletonText.propTypes = {
  lines: PropTypes.number,
  className: PropTypes.string,
  lastLineWidth: PropTypes.string,
  lineHeight: PropTypes.string,
  gap: PropTypes.string,
  tone: PropTypes.oneOf(["default", "light", "gold"]),
};

/**
 * Circle / Avatar Skeleton
 */
export function SkeletonCircle({ size = 40, className = "", tone = "default" }) {
  return (
    <Skeleton
      tone={tone}
      rounded="rounded-full shrink-0"
      className={className}
      style={{ width: size, height: size }}
    />
  );
}

SkeletonCircle.propTypes = {
  size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  className: PropTypes.string,
  tone: PropTypes.oneOf(["default", "light", "gold"]),
};

export default Skeleton;
