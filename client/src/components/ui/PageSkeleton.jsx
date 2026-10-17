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
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 rounded-xl" />
            <Skeleton className="h-4 w-64 rounded-lg" />
          </div>
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>

        {/* Stat cards grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="p-4 bg-white/70 border border-primary/10 rounded-2xl space-y-3"
            >
              <div className="flex justify-between items-center">
                <Skeleton className="h-3 w-20 rounded" />
                <Skeleton className="w-8 h-8 rounded-lg" />
              </div>
              <Skeleton className="h-7 w-16 rounded-md" />
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 p-5 bg-white/70 border border-primary/10 rounded-3xl">
            <Skeleton className="h-5 w-36 rounded mb-4" />
            <Skeleton className="w-full h-52 rounded-2xl" />
          </div>
          <div className="h-72 p-5 bg-white/70 border border-primary/10 rounded-3xl">
            <Skeleton className="h-5 w-36 rounded mb-4" />
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
        <div className="h-44 p-8 bg-white/60 border border-primary/10 rounded-3xl space-y-3">
          <Skeleton className="h-4 w-28 rounded-full" />
          <Skeleton className="h-8 w-72 rounded-xl" />
          <Skeleton className="h-4 w-96 rounded-lg" />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl border border-primary/5 p-2.5 space-y-2.5"
            >
              <Skeleton className="w-full aspect-[5/7] rounded-2xl" />
              <Skeleton className="h-4 w-4/5 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
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
      <div className="space-y-3 text-center flex flex-col items-center">
        <Skeleton className="h-5 w-32 rounded-full" />
        <Skeleton className="h-10 w-3/4 max-w-md rounded-2xl" />
        <Skeleton className="h-4 w-2/3 max-w-sm rounded-lg" />
      </div>

      <div className="p-6 bg-white/60 border border-primary/10 rounded-3xl space-y-4">
        <SkeletonText lines={4} />
        <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
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
