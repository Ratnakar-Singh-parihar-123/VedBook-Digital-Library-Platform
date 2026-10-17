import { useMemo, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  BookMarked,
  Eye,
  RefreshCw,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Sparkles,
  Clock,
  Library,
} from "lucide-react";

import { analyticsAPI } from "../../api/analyticsApi";
import useFetch from "../dashboard/hooks/useFetch";
import { formatNumber } from "../dashboard/utils/format";

import ReadingTrendChart from "../dashboard/ReadingTrendChart";
import UserGrowthChart from "../dashboard/UserGrowthChart";
import TrendingBooks from "../dashboard/TrendingBooks";
import RecentActivity from "../dashboard/RecentActivity";

/* ------------------------------------------------------------------ */
/*  Period config                                                      */
/* ------------------------------------------------------------------ */
const PERIODS = [
  { key: 7, label: "7 days" },
  { key: 30, label: "30 days" },
  { key: 90, label: "90 days" },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function Analytics() {
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

  const kpis = useMemo(() => buildKpis(overview), [overview]);

  return (
    <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8 sm:py-8">
      {/* ================= HEADER ================= */}
      <header className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-2.5">
          <span className="grid w-10 h-10 rounded-2xl bg-mint place-items-center text-primary shrink-0">
            <BarChart3 size={18} />
          </span>
          <div>
            <h1 className="text-2xl tracking-tight font-display sm:text-3xl text-primary">
              Analytics & Trends
            </h1>
            <p className="text-sm text-primary/60">
              Deep dive into library performance
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
            <p className="font-medium">Couldn't load analytics</p>
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
        aria-label="Key metrics"
        className="grid grid-cols-2 gap-3 mb-6 lg:grid-cols-4 sm:gap-4"
      >
        {kpis.map((k) => (
          <KpiCard
            key={k.key}
            label={k.label}
            value={k.value}
            icon={k.icon}
            trend={k.trend}
            tone={k.tone}
            loading={loading}
          />
        ))}
      </section>

      {/* ================= INSIGHT BANNER ================= */}
      {!loading && !error && overview && <InsightBanner overview={overview} />}

      {/* ================= CHARTS ROW ================= */}
      <section className="grid grid-cols-1 gap-4 mt-6 sm:mt-8 lg:grid-cols-2 sm:gap-6">
        <ReadingTrendChart
          refreshKey={`${refreshKey}-${period}`}
          defaultDays={period}
        />
        <UserGrowthChart
          refreshKey={`${refreshKey}-${period}`}
          defaultDays={period}
        />
      </section>

      {/* ================= TRENDING + ACTIVITY ================= */}
      <section className="grid grid-cols-1 gap-4 mt-6 sm:mt-8 lg:grid-cols-3 sm:gap-6">
        <div className="lg:col-span-2">
          <TrendingBooks
            refreshKey={`${refreshKey}-${period}`}
            defaultDays={period}
          />
        </div>
        <div className="lg:col-span-1">
          <RecentActivity refreshKey={refreshKey} />
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  KPI Card                                                           */
/* ------------------------------------------------------------------ */
function KpiCard({
  label,
  value,
  icon: Icon,
  trend,
  tone = "primary",
  loading,
}) {
  const toneStyles = {
    primary: "bg-mint text-primary",
    gold: "bg-gold/25 text-primary",
    accent: "bg-primary text-gold",
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
        </div>
        <span
          className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 ${toneCls}`}
        >
          <Icon size={15} />
        </span>
      </div>

      {trend != null && !loading && (
        <div className="mt-2.5 flex items-center gap-1.5 text-[11px]">
          {trend >= 0 ? (
            <>
              <ArrowUpRight size={12} className="text-emerald-600" />
              <span className="font-medium text-emerald-600">+{trend}%</span>
            </>
          ) : (
            <>
              <ArrowDownRight size={12} className="text-red-500" />
              <span className="font-medium text-red-500">{trend}%</span>
            </>
          )}
          <span className="text-primary/40">vs last period</span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Insight Banner — auto-generated tips from data                    */
/* ------------------------------------------------------------------ */
function InsightBanner({ overview }) {
  const insights = useMemo(() => {
    const list = [];

    const books = overview.books || {};
    const users = overview.users || {};
    const reading = overview.reading || {};

    const totalBooks = books.total ?? 0;
    const publishedBooks = books.published ?? 0;
    const draftBooks = books.draft ?? 0;
    const totalUsers = users.total ?? 0;
    const newUsers = users.newLast30Days ?? 0;
    const sessions = reading.totalSessions ?? 0;
    const readers = reading.uniqueReaders ?? 0;

    if (totalBooks > 0 && publishedBooks / totalBooks < 0.5) {
      list.push({
        icon: Sparkles,
        tone: "gold",
        text: `Only ${Math.round((publishedBooks / totalBooks) * 100)}% of books are published. Consider publishing drafts.`,
      });
    }

    if (totalUsers > 0 && newUsers > 0) {
      const rate = ((newUsers / totalUsers) * 100).toFixed(1);
      list.push({
        icon: TrendingUp,
        tone: "emerald",
        text: `${newUsers} new users in last 30 days — ${rate}% growth.`,
      });
    }

    if (sessions > 0 && readers > 0) {
      const avg = (sessions / readers).toFixed(1);
      list.push({
        icon: Activity,
        tone: "primary",
        text: `Readers average ${avg} sessions each — engagement is healthy.`,
      });
    }

    if (draftBooks > 5) {
      list.push({
        icon: Clock,
        tone: "gold",
        text: `${draftBooks} drafts awaiting review. Publish to grow the library.`,
      });
    }

    if (
      publishedBooks > 0 &&
      totalBooks > 0 &&
      publishedBooks / totalBooks >= 0.8
    ) {
      list.push({
        icon: Sparkles,
        tone: "emerald",
        text: `Great! ${Math.round((publishedBooks / totalBooks) * 100)}% of your books are published.`,
      });
    }

    return list.slice(0, 3);
  }, [overview]);

  if (!insights.length) return null;

  const toneMap = {
    gold: { bg: "bg-gold/15", border: "border-gold/40", icon: "text-primary" },
    emerald: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      icon: "text-emerald-600",
    },
    primary: {
      bg: "bg-mint/60",
      border: "border-primary/15",
      icon: "text-primary",
    },
  };

  return (
    <section className="grid grid-cols-1 gap-3 md:grid-cols-3 sm:gap-4">
      {insights.map((ins, i) => {
        const t = toneMap[ins.tone] || toneMap.primary;
        const Icon = ins.icon;
        return (
          <div
            key={i}
            className={`flex items-start gap-3 rounded-2xl border p-4 ${t.bg} ${t.border}`}
          >
            <span
              className={`w-8 h-8 rounded-lg grid place-items-center bg-white/60 shrink-0 ${t.icon}`}
            >
              <Icon size={15} />
            </span>
            <p className="text-xs leading-relaxed text-primary/80">
              {ins.text}
            </p>
          </div>
        );
      })}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Build KPIs from overview                                           */
/* ------------------------------------------------------------------ */
function buildKpis(o = {}) {
  const books = o.books || {};
  const users = o.users || {};
  const reading = o.reading || {};

  return [
    {
      key: "books.total",
      label: "Total Books",
      value: books.total ?? 0,
      icon: Library,
      tone: "primary",
    },
    {
      key: "users.total",
      label: "Total Users",
      value: users.total ?? 0,
      icon: Users,
      tone: "gold",
    },
    {
      key: "reading.totalSessions",
      label: "Reading Sessions",
      value: reading.totalSessions ?? 0,
      icon: BookMarked,
      tone: "accent",
    },
    {
      key: "reading.uniqueReaders",
      label: "Unique Readers",
      value: reading.uniqueReaders ?? 0,
      icon: Eye,
      tone: "primary",
    },
  ];
}
