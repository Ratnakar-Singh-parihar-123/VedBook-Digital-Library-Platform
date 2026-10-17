import PropTypes from "prop-types";
import { Skeleton, SkeletonText } from "./Skeleton";

/**
 * Single Grid Book Card Skeleton
 */
export function BookCardGridSkeleton({ className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`bg-white rounded-3xl border border-primary/5 p-2.5 flex flex-col ${className}`}
    >
      {/* Cover Skeleton with spine shadow line */}
      <div className="relative w-full aspect-[5/7] rounded-2xl overflow-hidden bg-surface">
        <Skeleton className="w-full h-full" rounded="rounded-2xl" />
        <div className="absolute top-0 bottom-0 left-0 w-[5px] bg-primary/10" />
        <div className="absolute top-2.5 left-2.5 w-10 h-5 rounded-lg bg-white/70" />
      </div>

      {/* Title & Author */}
      <div className="px-1.5 pt-3 pb-1 flex-1 flex flex-col justify-between">
        <div>
          <Skeleton className="h-4 w-4/5 rounded mb-1.5" />
          <Skeleton className="h-3 w-1/2 rounded" />
        </div>

        {/* Footer meta */}
        <div className="flex items-center justify-between pt-3 mt-2 border-t border-primary/5">
          <Skeleton className="h-2.5 w-16 rounded" />
          <Skeleton className="h-3 w-10 rounded" tone="gold" />
        </div>
      </div>
    </div>
  );
}

BookCardGridSkeleton.propTypes = {
  className: PropTypes.string,
};

/**
 * Single Row Book Card Skeleton (for List view)
 */
export function BookCardRowSkeleton({ className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`flex gap-4 p-3 bg-white border rounded-2xl border-primary/5 ${className}`}
    >
      {/* Thumbnail */}
      <div className="relative w-16 h-22 sm:w-20 sm:h-28 rounded-xl overflow-hidden shrink-0 bg-surface">
        <Skeleton className="w-full h-full" rounded="rounded-xl" />
        <div className="absolute top-0 bottom-0 left-0 w-1 bg-primary/10" />
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 min-w-0 py-0.5">
        <div className="flex items-start justify-between gap-3">
          <div className="w-full">
            <Skeleton className="h-4 w-2/3 sm:w-1/2 rounded mb-1.5" />
            <Skeleton className="h-3 w-1/3 rounded" />
          </div>
          <Skeleton className="w-10 h-5 rounded-lg shrink-0" />
        </div>

        <div className="hidden sm:block mt-3">
          <SkeletonText lines={2} lastLineWidth="80%" lineHeight="h-2.5" />
        </div>

        <div className="flex items-center justify-between gap-3 pt-3 mt-auto">
          <div className="flex items-center gap-2">
            <Skeleton className="h-2.5 w-14 rounded" />
            <Skeleton className="h-2.5 w-12 rounded" />
          </div>
          <Skeleton className="h-3 w-12 rounded" tone="gold" />
        </div>
      </div>
    </div>
  );
}

BookCardRowSkeleton.propTypes = {
  className: PropTypes.string,
};

/**
 * Composite BookCardSkeleton list/grid
 */
export default function BookCardSkeleton({
  count = 8,
  view = "grid",
  className = "",
}) {
  if (view === "list") {
    return (
      <div
        role="status"
        aria-label="Loading books"
        className={`space-y-3 ${className}`}
      >
        {Array.from({ length: count }).map((_, i) => (
          <BookCardRowSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-label="Loading books"
      className={`grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 md:gap-5 ${className}`}
    >
      {Array.from({ length: count }).map((_, i) => (
        <BookCardGridSkeleton key={i} />
      ))}
    </div>
  );
}

BookCardSkeleton.propTypes = {
  count: PropTypes.number,
  view: PropTypes.oneOf(["grid", "list"]),
  className: PropTypes.string,
};
