import PropTypes from "prop-types";
import { Skeleton, SkeletonCircle } from "./Skeleton";

/**
 * Reusable Table Skeleton for Desktop & Mobile views
 */
export default function TableSkeleton({
  rows = 6,
  columns = 5,
  variant = "mixed", // 'table', 'cards', 'mixed' (table on md, cards on mobile)
  hasThumbnail = true,
  className = "",
}) {
  return (
    <div
      role="status"
      aria-label="Loading table data"
      className={`divide-y divide-primary/5 ${className}`}
    >
      {/* Desktop Table View */}
      <div
        className={`${
          variant === "cards"
            ? "hidden"
            : variant === "mixed"
              ? "hidden md:block"
              : "block"
        } overflow-x-auto`}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-primary/10 bg-mint/40">
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-4 py-3.5 text-left">
                  <Skeleton className="w-20 h-3 rounded" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/5">
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r} className="transition-colors hover:bg-mint/10">
                {/* Column 1: Item with thumbnail / icon */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {hasThumbnail ? (
                      <Skeleton className="w-10 rounded-md h-13 shrink-0" />
                    ) : (
                      <SkeletonCircle size={36} />
                    )}
                    <div className="space-y-1.5 flex-1 min-w-[120px]">
                      <Skeleton className="h-3.5 w-3/4 rounded" />
                      <Skeleton className="h-2.5 w-1/2 rounded" />
                    </div>
                  </div>
                </td>

                {/* Other columns */}
                {Array.from({ length: Math.max(1, columns - 2) }).map(
                  (_, c) => (
                    <td key={c} className="px-4 py-3">
                      <Skeleton
                        className="h-3 rounded"
                        style={{ width: `${45 + ((c + r) % 3) * 15}%` }}
                      />
                    </td>
                  ),
                )}

                {/* Last column: Actions */}
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-2">
                    <Skeleton className="rounded-lg w-7 h-7" />
                    <Skeleton className="rounded-lg w-7 h-7" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div
        className={`${
          variant === "table"
            ? "hidden"
            : variant === "mixed"
              ? "block md:hidden"
              : "block"
        } p-4 space-y-3`}
      >
        {Array.from({ length: Math.min(rows, 5) }).map((_, i) => (
          <div
            key={i}
            className="p-3.5 bg-white/70 border border-primary/10 rounded-2xl flex items-start gap-3.5"
          >
            {hasThumbnail ? (
              <Skeleton className="w-14 h-18 rounded-xl shrink-0" />
            ) : (
              <SkeletonCircle size={44} />
            )}
            <div className="flex-1 min-w-0 space-y-2 py-0.5">
              <Skeleton className="w-4/5 h-4 rounded" />
              <Skeleton className="w-1/2 h-3 rounded" />
              <div className="flex items-center gap-2 pt-1">
                <Skeleton className="h-5 rounded-full w-14" />
                <Skeleton className="w-16 h-5 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

TableSkeleton.propTypes = {
  rows: PropTypes.number,
  columns: PropTypes.number,
  variant: PropTypes.oneOf(["table", "cards", "mixed"]),
  hasThumbnail: PropTypes.bool,
  className: PropTypes.string,
};
