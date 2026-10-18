import { useMemo, useState } from "react";
import {
  BookMarked,
  RefreshCw,
  AlertCircle,
  Activity,
  Sparkles,
  Flame,
  Target,
  Users,
  Zap,
} from "lucide-react";

import { analyticsAPI } from "../../api/analyticsApi";
import useFetch from "../dashboard/hooks/useFetch";
import { formatNumber } from "../dashboard/utils/format";

import ReadingTrendChart from "../dashboard/ReadingTrendChart";
import TrendingBooks from "../dashboard/TrendingBooks";

/*  Period config                                                      */

const PERIODS = [
  { key: 7, label: "7 days" },
  { key: 30, label: "30 days" },
  { key: 90, label: "90 days" },
];

/*  Page                                                               */

export default function ReadingActivity() {
  const [period, setPeriod] = useState(30);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data, loading, error, reload } = useFetch(
    () => analyticsAPI.getOverview(),
    [refreshKey],
  );

  const overview = useMemo(() => {
    const raw = data || {};
    return raw.overview || raw.data || raw;
  }, [data]);

  const kpis = useMemo(() => buildReadingKpis(overview), [overview]);

  return (
    <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8 sm:py-8">
      {/* ================= HEADER ================= */}
      <header className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-2.5">
          <span className="grid w-10 h-10 rounded-2xl bg-mint place-items-center text-primary shrink-0">
            <BookMarked size={18} />
          </span>
          <div>
            <h1 className="text-2xl tracking-tight font-display sm:text-3xl text-primary">
              Reading Activity
            </h1>
            <p className="text-sm text-primary/60">
              How readers are engaging with your library
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period selector */}
          <div className="inline-flex bg-mint/60 rounded-xl p-0.5">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPeriod(p.key)}
                className={`px-3.5 py-2 rounded-lg text-xs font-medium transition ${
                  period === p.key
                    ? "bg-primary text-cream shadow-sm"
                    : "text-primary/60 hover:text-primary"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-cream border border-primary/10 text-primary px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-mint disabled:opacity-60 transition shadow-soft"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </header>

      {/* ================= ERROR ================= */}
      {error && (
        <div className="flex items-start gap-2 px-4 py-3 mb-6 text-sm text-red-600 border border-red-200 bg-red-50 rounded-2xl">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium">Couldn't load reading data</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
          <button
            type="button"
            onClick={reload}
            className="text-xs font-medium underline underline-offset-2 shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* ================= KPI CARDS ================= */}
      <section
        aria-label="Reading metrics"
        className="grid grid-cols-2 gap-3 mb-6 lg:grid-cols-4 sm:gap-4"
      >
        {kpis.map((k) => (
          <KpiCard
            key={k.key}
            label={k.label}
            value={k.value}
            icon={k.icon}
            tone={k.tone}
            sub={k.sub}
            loading={loading}
          />
        ))}
      </section>

      {/* ================= ENGAGEMENT BANNER ================= */}
      {!loading && !error && overview && (
        <EngagementBanner overview={overview} period={period} />
      )}

      {/* ================= TREND CHART ================= */}
      <section className="mt-6 sm:mt-8">
        <ReadingTrendChart
          refreshKey={`${refreshKey}-${period}`}
          defaultDays={period}
        />
      </section>

      {/* ================= TRENDING BOOKS ================= */}
      <section className="mt-6 sm:mt-8">
        <TrendingBooks
          refreshKey={`${refreshKey}-${period}`}
          defaultDays={period}
        />
      </section>
    </div>
  );
}

/*  KPI Card                                                           */

function KpiCard({ label, value, icon: Icon, tone = "primary", sub, loading }) {
  const toneStyles = {
    primary: "bg-mint text-primary",
    gold: "bg-gold/25 text-primary",
    accent: "bg-primary text-gold",
    emerald: "bg-emerald-50 text-emerald-600",
  };
  const toneCls = toneStyles[tone] || toneStyles.primary;

  return (
    <div className="relative p-4 transition border group bg-cream border-primary/10 rounded-2xl hover:shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-primary/50 font-medium">
            {label}
          </p>
          {loading ? (
            <div className="w-20 mt-2 rounded h-7 bg-primary/10 animate-pulse" />
          ) : (
            <p className="font-display text-2xl sm:text-3xl text-primary mt-1.5 tabular-nums">
              {formatNumber(value)}
            </p>
          )}
          {sub && !loading && (
            <p className="text-[10.5px] text-primary/40 mt-1">{sub}</p>
          )}
        </div>
        <span
          className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 ${toneCls}`}
        >
          <Icon size={15} />
        </span>
      </div>
    </div>
  );
}

/*  Engagement banner — highlights reading behavior                   */

function EngagementBanner({ overview, period }) {
  const stats = useMemo(() => {
    const reading = overview.reading || {};
    const users = overview.users || {};
    const books = overview.books || {};

    const sessions = reading.totalSessions ?? 0;
    const readers = reading.uniqueReaders ?? 0;
    const totalUsers = users.total ?? 0;
    const publishedBooks = books.published ?? 0;

    const avgSessions = readers > 0 ? sessions / readers : 0;
    const readerRate = totalUsers > 0 ? (readers / totalUsers) * 100 : 0;
    const sessionsPerBook = publishedBooks > 0 ? sessions / publishedBooks : 0;

    return { avgSessions, readerRate, sessionsPerBook, sessions, readers };
  }, [overview]);

  const periodLabel =
    period === 7 ? "this week" : period === 30 ? "this month" : "this quarter";

  const cards = [
    {
      icon: Activity,
      tone: "primary",
      label: "Engagement",
      value: stats.avgSessions > 0 ? `${stats.avgSessions.toFixed(1)}` : "—",
      unit: "sessions / reader",
      hint:
        stats.avgSessions >= 3
          ? "Highly engaged readers"
          : stats.avgSessions >= 1
            ? "Moderate engagement"
            : "Room to grow",
    },
    {
      icon: Target,
      tone: "emerald",
      label: "Reader reach",
      value: stats.readerRate > 0 ? `${stats.readerRate.toFixed(1)}%` : "—",
      unit: "of users reading",
      hint:
        stats.readerRate >= 50
          ? "Great adoption"
          : stats.readerRate >= 20
            ? "Steady growth"
            : "Needs promotion",
    },
    {
      icon: Flame,
      tone: "gold",
      label: "Content pull",
      value:
        stats.sessionsPerBook > 0 ? `${stats.sessionsPerBook.toFixed(1)}` : "—",
      unit: "sessions / book",
      hint:
        stats.sessionsPerBook >= 5
          ? "Books in demand"
          : stats.sessionsPerBook >= 1
            ? "Healthy interest"
            : "Publish more titles",
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-3 md:grid-cols-3 sm:gap-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        const toneMap = {
          primary: {
            bg: "bg-mint/60",
            border: "border-primary/15",
            icon: "text-primary",
          },
          gold: {
            bg: "bg-gold/15",
            border: "border-gold/40",
            icon: "text-primary",
          },
          emerald: {
            bg: "bg-emerald-50",
            border: "border-emerald-200",
            icon: "text-emerald-600",
          },
        };
        const t = toneMap[c.tone] || toneMap.primary;
        return (
          <div key={i} className={`rounded-2xl border p-4 ${t.bg} ${t.border}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-primary/50 font-medium">
                  {c.label}
                </p>
                <p className="mt-1 text-2xl font-display text-primary tabular-nums">
                  {c.value}
                </p>
                <p className="text-[10.5px] text-primary/50 mt-0.5">{c.unit}</p>
              </div>
              <span
                className={`w-8 h-8 rounded-lg grid place-items-center bg-white/60 shrink-0 ${t.icon}`}
              >
                <Icon size={14} />
              </span>
            </div>
            <p className="text-[11px] text-primary/60 mt-3 inline-flex items-center gap-1.5">
              <Sparkles size={10} className="text-gold" />
              {c.hint} — {periodLabel}
            </p>
          </div>
        );
      })}
    </section>
  );
}

/*  Build reading-specific KPIs                                        */

function buildReadingKpis(o = {}) {
  const reading = o.reading || {};
  const users = o.users || {};

  const sessions = reading.totalSessions ?? 0;
  const readers = reading.uniqueReaders ?? 0;
  const avgSessions = readers > 0 ? sessions / readers : 0;

  return [
    {
      key: "reading.totalSessions",
      label: "Reading Sessions",
      value: sessions,
      icon: BookMarked,
      tone: "primary",
      sub: "total reads recorded",
    },
    {
      key: "reading.uniqueReaders",
      label: "Unique Readers",
      value: readers,
      icon: Users,
      tone: "gold",
      sub: users.total
        ? `${((readers / users.total) * 100).toFixed(0)}% of all users`
        : "active this period",
    },
    {
      key: "reading.avgSessions",
      label: "Avg per Reader",
      value: Number(avgSessions.toFixed(1)),
      icon: Activity,
      tone: "accent",
      sub: "sessions each",
    },
    {
      key: "reading.engagement",
      label: "Engagement Rate",
      value: users.total ? Math.round((readers / users.total) * 100) : 0,
      icon: Zap,
      tone: "emerald",
      sub: "readers vs signups",
    },
  ];
}
