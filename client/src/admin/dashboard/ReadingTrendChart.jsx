import { useState } from "react";
import { BarChart3, AlertCircle } from "lucide-react";
import useFetch from "./hooks/useFetch";
import { normaliseSeries, formatNumber } from "./utils/format";
import { dashboardAPI } from "../../api/dashboardApi";

const RANGES = [7, 30, 90];

export default function ReadingTrendChart({ refreshKey = 0, defaultDays = 7 }) {
  const [days, setDays] = useState(defaultDays);

  const { data, loading, isRefreshing, error } = useFetch(
    () => dashboardAPI.getReadingTrend(days),
    [days, refreshKey],
  );

  // Backend: { success, days, trend: [...] }
  const points = normaliseSeries(data?.trend ?? [], [
    "sessions",
    "count",
    "readingSessions",
    "totalSessions",
    "reads",
  ]);
  const max = Math.max(1, ...points.map((p) => p.value));

  return (
    <section className="p-4 border bg-cream border-primary/10 rounded-2xl sm:p-5">
      <Header
        icon={BarChart3}
        title="Reading activity"
        subtitle="Sessions over time"
        days={days}
        setDays={setDays}
        isRefreshing={isRefreshing}
      />

      {loading && points.length === 0 && <ChartSkeleton />}
      {!loading && error && points.length === 0 && <ChartError message={error} />}
      {!loading && !error && points.length === 0 && (
        <ChartEmpty label="No reading activity yet." />
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
                      className="w-full transition-all rounded-t-md bg-primary/60 group-hover:bg-primary"
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
              Total:{" "}
              <span className="font-medium text-primary">
                {formatNumber(points.reduce((s, p) => s + p.value, 0))}
              </span>
            </span>
            <span>
              Peak:{" "}
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

/* ---------- Shared sub-components ---------- */
export function Header({ icon: Icon, title, subtitle, days, setDays, isRefreshing = false }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-2">
        <span className="grid w-8 h-8 rounded-lg bg-mint place-items-center text-primary shrink-0">
          <Icon size={14} />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold truncate text-primary">
            {title}
          </h3>
          <p className="text-xs truncate text-primary/50">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isRefreshing && (
          <span className="text-[11px] text-primary/50 animate-pulse hidden sm:inline">
            Updating...
          </span>
        )}
        <div className="inline-flex bg-mint/60 rounded-xl p-0.5">
          {RANGES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                days === d
                  ? "bg-primary text-cream shadow-sm"
                  : "text-primary/60 hover:text-primary"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

export function ChartSkeleton() {
  return (
    <div className="h-48 sm:h-56 flex items-end gap-0.5 sm:gap-1">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="flex-1 bg-primary/10 rounded-t-md animate-shimmer"
          style={{ height: `${30 + ((i * 37) % 60)}%` }}
        />
      ))}
    </div>
  );
}

export function ChartError({ message }) {
  return (
    <div className="grid h-48 sm:h-56 place-items-center">
      <div className="flex flex-col items-center gap-2 text-center text-primary/50">
        <AlertCircle size={20} />
        <p className="text-sm">{message || "Could not load chart."}</p>
      </div>
    </div>
  );
}

export function ChartEmpty({ label }) {
  return (
    <div className="grid h-48 sm:h-56 place-items-center">
      <div className="text-center">
        <div className="grid w-12 h-12 mx-auto mb-3 rounded-2xl bg-mint place-items-center">
          <BarChart3 size={18} className="text-primary/50" />
        </div>
        <p className="text-sm text-primary/50">{label}</p>
      </div>
    </div>
  );
}
