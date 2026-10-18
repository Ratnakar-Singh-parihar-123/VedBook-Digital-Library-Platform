import PropTypes from "prop-types";
import { Skeleton, SkeletonText } from "./Skeleton";

/**
 * Editorial Page Skeleton for smooth initial page paints
 */
export default function PageSkeleton({
  type = "default", // 'default', 'catalog', 'dashboard', 'detail'
  className = "",
}) {
  if (type === "dashboard") {
    return (
      <div
        role="status"
        aria-label="Loading dashboard"
        className={`px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6 ${className}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="w-48 h-8 rounded-xl" />
            <Skeleton className="w-64 h-4 rounded-lg" />
          </div>
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>

        {/* Stat cards grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 sm:gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="p-4 space-y-3 border bg-white/70 border-primary/10 rounded-2xl"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="w-20 h-3 rounded" />
                <Skeleton className="w-8 h-8 rounded-lg" />
              </div>
              <Skeleton className="w-16 rounded-md h-7" />
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="p-5 border h-72 bg-white/70 border-primary/10 rounded-3xl">
            <Skeleton className="h-5 mb-4 rounded w-36" />
            <Skeleton className="w-full h-52 rounded-2xl" />
          </div>
          <div className="p-5 border h-72 bg-white/70 border-primary/10 rounded-3xl">
            <Skeleton className="h-5 mb-4 rounded w-36" />
            <Skeleton className="w-full h-52 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (type === "catalog") {
    return (
      <div
        role="status"
        aria-label="Loading catalog"
        className={`max-w-7xl mx-auto px-5 py-8 space-y-8 ${className}`}
      >
        {/* Banner */}
        <div className="p-8 space-y-3 border h-44 bg-white/60 border-primary/10 rounded-3xl">
          <Skeleton className="h-4 rounded-full w-28" />
          <Skeleton className="h-8 w-72 rounded-xl" />
          <Skeleton className="h-4 rounded-lg w-96" />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl border border-primary/5 p-2.5 space-y-2.5"
            >
              <Skeleton className="w-full aspect-[5/7] rounded-2xl" />
              <Skeleton className="w-4/5 h-4 rounded" />
              <Skeleton className="w-1/2 h-3 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default Editorial Page Skeleton
  return (
    <div
      role="status"
      aria-label="Loading page"
      className={`min-h-[60vh] max-w-5xl mx-auto px-5 py-12 space-y-8 ${className}`}
    >
      <div className="flex flex-col items-center space-y-3 text-center">
        <Skeleton className="w-32 h-5 rounded-full" />
        <Skeleton className="w-3/4 h-10 max-w-md rounded-2xl" />
        <Skeleton className="w-2/3 h-4 max-w-sm rounded-lg" />
      </div>

      <div className="p-6 space-y-4 border bg-white/60 border-primary/10 rounded-3xl">
        <SkeletonText lines={4} />
        <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-3">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

PageSkeleton.propTypes = {
  type: PropTypes.oneOf(["default", "catalog", "dashboard", "detail"]),
  className: PropTypes.string,
};
