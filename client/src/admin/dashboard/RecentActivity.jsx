import { Activity } from "lucide-react";
import useFetch from "./hooks/useFetch";
import { formatDateTime } from "./utils/format";
import { dashboardAPI } from "../../api/dashboardApi";
import ErrorState from "../../components/ui/ErrorState";
import EmptyState from "../../components/ui/EmptyState";

export default function RecentActivity({ refreshKey = 0, limit = 10 }) {
  const { data, loading, isRefreshing, error, reload } = useFetch(
    () => dashboardAPI.getRecentActivity(limit),
    [limit, refreshKey],
  );

  // Backend: { success, count, activities: [...] }
  const rawArr = Array.isArray(data?.activities)
    ? data.activities
    : Array.isArray(data)
      ? data
      : [];

  const items = rawArr.map((a) => ({
    id: a._id || a.id,
    action: a.action || a.type || a.activity || "—",
    entityType:
      a.entityType || a.entity_type || a.targetType || a.target?.type || "—",
    entityId:
      a.entityId ||
      a.entity_id ||
      a.targetId ||
      a.target?.id ||
      a.bookId ||
      "—",
    createdAt: a.createdAt || a.created_at || a.timestamp || a.date || a.time,
  }));

  return (
    <section className="p-4 border bg-cream border-primary/10 rounded-2xl sm:p-5">
      <header className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="grid w-8 h-8 rounded-lg bg-mint place-items-center text-primary shrink-0">
            <Activity size={14} />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold truncate text-primary">
              Recent admin activity
            </h3>
            <p className="text-xs truncate text-primary/50">
              Latest actions across the console
            </p>
          </div>
        </div>

        {isRefreshing && (
          <span className="text-[11px] text-primary/50 animate-pulse hidden sm:inline">
            Updating...
          </span>
        )}
      </header>

      {loading && items.length === 0 && (
        <div className="space-y-2.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-12 rounded-lg animate-shimmer bg-primary/5"
            />
          ))}
        </div>
      )}

      {error && items.length === 0 && (
        <div className="py-6">
          <ErrorState
            compact
            title="Couldn't load activity"
            message={error}
            onRetry={reload}
            retrying={isRefreshing}
          />
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <EmptyState
          compact
          icon={Activity}
          title="No recent activity"
          description="Actions will appear here as you manage the library."
        />
      )}

      {items.length > 0 && (
        <div className={isRefreshing ? "opacity-75 transition-opacity" : ""}>
          <ul className="divide-y divide-primary/5">
            {items.map((a) => (
              <li key={a.id} className="flex items-start gap-3 py-3">
                <span className="w-8 h-8 rounded-lg bg-mint grid place-items-center text-primary shrink-0 mt-0.5">
                  <Activity size={13} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-primary">
                    <span className="font-medium">{humanise(a.action)}</span>
                    <span className="text-primary/30 mx-1.5">·</span>
                    <span className="text-primary/60">{a.entityType}</span>
                  </p>
                  <p className="text-xs text-primary/40 mt-0.5 truncate">
                    ID: {String(a.entityId)}
                  </p>
                </div>
                <span className="text-xs text-primary/40 whitespace-nowrap shrink-0">
                  {formatDateTime(a.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function humanise(str) {
  if (!str) return "—";
  return String(str)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
