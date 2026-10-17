import { useState } from "react";
import { UserPlus } from "lucide-react";
import useFetch from "./hooks/useFetch";
import { normaliseSeries, formatNumber } from "./utils/format";
import { dashboardAPI } from "../../api/dashboardApi";
import {
  Header,
  ChartSkeleton,
  ChartError,
  ChartEmpty,
} from "./ReadingTrendChart";

export default function UserGrowthChart({ refreshKey = 0, defaultDays = 30 }) {
  const [days, setDays] = useState(defaultDays);

  const { data, loading, isRefreshing, error } = useFetch(
    () => dashboardAPI.getUserGrowth(days),
    [days, refreshKey],
  );

  // Backend: { success, days, growth: [...] }
  const points = normaliseSeries(data?.growth ?? [], [
    "newUsers",
    "count",
    "users",
    "registrations",
  ]);
  const max = Math.max(1, ...points.map((p) => p.value));

  return (
    <section className="p-4 border bg-cream border-primary/10 rounded-2xl sm:p-5">
      <Header
        icon={UserPlus}
        title="User growth"
        subtitle="New registrations"
        days={days}
        setDays={setDays}
        isRefreshing={isRefreshing}
      />

      {loading && points.length === 0 && <ChartSkeleton />}
      {!loading && error && points.length === 0 && <ChartError message={error} />}
      {!loading && !error && points.length === 0 && (
        <ChartEmpty label="No user registrations in this period." />
      )}

      {points.length > 0 && (
        <div className={isRefreshing ? "opacity-75 transition-opacity" : ""}>
          <div className="mt-2 h-48 sm:h-56 flex items-end gap-0.5 sm:gap-1">
            {points.map((p, i) => {
              const h = (p.value / max) * 100;
              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-1.5 min-w-0 group"
                >
                  <div className="relative flex items-end flex-1 w-full">
                    <div
                      className="w-full transition-all rounded-t-md bg-gold/70 group-hover:bg-gold"
                      style={{ height: `${Math.max(2, h)}%` }}
                      title={`${p.label}: ${formatNumber(p.value)}`}
                    />
                  </div>
                  {points.length <= 30 && (
                    <span className="text-[9px] sm:text-[10px] text-primary/40 truncate max-w-full">
                      {p.shortLabel}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-3 text-xs text-primary/50">
            <span>
              New in range:{" "}
              <span className="font-medium text-primary">
                {formatNumber(points.reduce((s, p) => s + p.value, 0))}
              </span>
            </span>
            <span>
              Peak day:{" "}
              <span className="font-medium text-primary">
                {formatNumber(max)}
              </span>
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
