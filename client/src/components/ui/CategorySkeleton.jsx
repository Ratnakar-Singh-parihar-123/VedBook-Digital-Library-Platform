import PropTypes from "prop-types";
import { Skeleton } from "./Skeleton";

/**
 * Single Category Card Skeleton
 */
export function CategoryCardSkeleton({ className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`relative bg-white border border-primary/5 rounded-3xl p-5 overflow-hidden flex flex-col justify-between ${className}`}
    >
      <div className="flex items-start gap-4">
        {/* Icon box */}
        <Skeleton className="w-12 h-12 shrink-0" rounded="rounded-2xl" />

        <div className="flex-1 min-w-0">
          <Skeleton className="w-3/4 h-5 mb-2 rounded-md" />
          <Skeleton className="w-4/5 h-3 rounded" />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 mt-6">
        <Skeleton className="w-16 h-3 rounded" />
        <Skeleton className="w-12 h-3 rounded" tone="gold" />
      </div>
    </div>
  );
}

CategoryCardSkeleton.propTypes = {
  className: PropTypes.string,
};

/**
 * Grid of Category Skeletons
 */
export default function CategorySkeleton({ count = 6, className = "" }) {
  return (
    <div
      role="status"
      aria-label="Loading categories"
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 ${className}`}
    >
      {Array.from({ length: count }).map((_, i) => (
        <CategoryCardSkeleton key={i} />
      ))}
    </div>
  );
}

CategorySkeleton.propTypes = {
  count: PropTypes.number,
  className: PropTypes.string,
};
