import { useState } from "react";
import { TrendingUp } from "lucide-react";
import useFetch from "./hooks/useFetch";
import { formatNumber } from "./utils/format";
import { dashboardAPI } from "../../api/dashboardApi";
import ErrorState from "../../components/ui/ErrorState";
import EmptyState from "../../components/ui/EmptyState";

const RANGES = [7, 30, 90];

export default function TrendingBooks({ refreshKey = 0, defaultDays = 30 }) {
  const [days, setDays] = useState(defaultDays);

  const { data, loading, isRefreshing, error, reload } = useFetch(
    () => dashboardAPI.getTrendingBooks(days, 10),
    [days, refreshKey],
  );

  // Backend: { success, days, count, books: [...] }
  const rawArr = Array.isArray(data?.books)
    ? data.books
    : Array.isArray(data)
      ? data
      : [];

  const rows = rawArr.map((b) => ({
    id: b._id || b.id || b.bookId || b.book?._id || b.title,
    title: b.title || b.book?.title || b.bookTitle || b.name || "Untitled",
    author:
      b.author ||
      b.book?.author ||
      b.bookAuthor ||
      (typeof b.author === "object" ? b.author?.name : "") ||
      "—",
    sessions:
      b.sessions ??
      b.count ??
      b.readingSessions ??
      b.totalSessions ??
      b.reads ??
      b.total ??
      0,
  }));

  return (
    <section className="p-4 border bg-cream border-primary/10 rounded-2xl sm:p-5">
      <header className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="grid w-8 h-8 rounded-lg bg-mint place-items-center text-primary shrink-0">
            <TrendingUp size={14} />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold truncate text-primary">
              Trending books
            </h3>
            <p className="text-xs truncate text-primary/50">Most-read titles</p>
          </div>
        </div>

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
      </header>

      {loading && rows.length === 0 && <SkeletonRows />}

      {error && rows.length === 0 && (
        <div className="py-6">
          <ErrorState
            compact
            title="Couldn't load trending books"
            message={error}
            onRetry={reload}
            retrying={isRefreshing}
          />
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <EmptyState
          compact
          icon={TrendingUp}
          title="No reading data for this period"
          description="Data appears once readers start engaging with books."
        />
      )}

      {rows.length > 0 && (
        <div className={isRefreshing ? "opacity-75 transition-opacity" : ""}>
          {/* Desktop table */}
          <div className="hidden -mx-1 overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs tracking-wider text-left uppercase border-b text-primary/50 border-primary/10">
                  <th className="py-2.5 px-2 font-medium w-10">#</th>
                  <th className="py-2.5 px-2 font-medium">Title</th>
                  <th className="py-2.5 px-2 font-medium">Author</th>
                  <th className="py-2.5 px-2 font-medium text-right w-28">
                    Sessions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {rows.map((r, i) => (
                  <tr key={r.id} className="transition hover:bg-mint/30">
                    <td className="px-2 py-3 font-medium text-primary/40 tabular-nums">
                      {i + 1}
                    </td>
                    <td className="max-w-xs px-2 py-3 font-medium truncate text-primary">
                      {r.title}
                    </td>
                    <td className="max-w-xs px-2 py-3 truncate text-primary/60">
                      {r.author}
                    </td>
                    <td className="px-2 py-3 text-right tabular-nums">
                      <span className="inline-flex items-center justify-center min-w-[2.5rem] bg-mint text-primary text-xs font-semibold px-2 py-1 rounded-lg">
                        {formatNumber(r.sessions)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile list */}
          <ul className="divide-y md:hidden divide-primary/5">
            {rows.map((r, i) => (
              <li key={r.id} className="flex items-start gap-3 py-3">
                <span className="w-6 h-6 rounded-lg bg-mint grid place-items-center text-[11px] font-semibold text-primary tabular-nums shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-primary">
                    {r.title}
                  </p>
                  <p className="text-xs text-primary/50 truncate mt-0.5">
                    {r.author}
                  </p>
                </div>
                <span className="px-2 py-1 text-xs font-semibold rounded-lg text-primary bg-mint tabular-nums shrink-0">
                  {formatNumber(r.sessions)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-10 rounded-lg animate-shimmer bg-primary/5"
          style={{ animationDelay: `${i * 60}ms` }}
        />
      ))}
    </div>
  );
}
