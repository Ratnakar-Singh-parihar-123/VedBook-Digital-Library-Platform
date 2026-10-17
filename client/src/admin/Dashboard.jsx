import { useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  FileEdit,
  Archive,
  FolderTree,
  FolderCheck,
  Users,
  UserPlus,
  BookMarked,
  Eye,
  RefreshCw,
  Calendar,
} from "lucide-react";

import useFetch from "./dashboard/hooks/useFetch";
import { formatDate, pickObject } from "./dashboard/utils/format";
import { dashboardAPI } from "../api/dashboardApi";

import StatCard from "./dashboard/StatCard";
import ReadingTrendChart from "./dashboard/ReadingTrendChart";
import TrendingBooks from "./dashboard/TrendingBooks";
import UserGrowthChart from "./dashboard/UserGrowthChart";
import RecentActivity from "./dashboard/RecentActivity";
import ErrorState from "../components/ui/ErrorState";
import RefreshBanner from "../components/ui/RefreshBanner";

export default function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0);

  const { data, loading, isRefreshing, error, reload } = useFetch(
    () => dashboardAPI.getOverview(),
    [refreshKey],
  );

  // Backend: { success, overview: {...} }
  const overview = pickObject(data, ["overview", "data"]);
  const stats = buildStats(overview);

  return (
    <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8 sm:py-8">
      {/* ============ HEADER ============ */}
      <header className="flex flex-wrap items-start justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl tracking-tight font-display sm:text-3xl text-primary">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-primary/60">
            Overview of your digital library
          </p>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-xs text-primary/40 inline-flex items-center gap-1.5">
              <Calendar size={12} />
              {formatDate(new Date())}
            </p>
            {isRefreshing && (
              <RefreshBanner message="Updating dashboard..." />
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setRefreshKey((k) => k + 1)}
          disabled={loading || isRefreshing}
          className="inline-flex items-center gap-2 bg-cream border border-primary/10 text-primary px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-mint hover:border-primary/20 disabled:opacity-60 disabled:cursor-not-allowed transition shadow-soft"
        >
          <RefreshCw size={14} className={loading || isRefreshing ? "animate-spin text-gold" : ""} />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      {/* ============ ERROR ============ */}
      {error && (
        <div className="mb-6">
          <ErrorState
            compact
            title="Couldn't load overview stats"
            message={error}
            onRetry={reload}
            retrying={isRefreshing}
          />
        </div>
      )}

      {/* ============ STATS ============ */}
      <section
        aria-label="Overview statistics"
        className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 sm:gap-4"
      >
        {stats.map((s) => (
          <StatCard
            key={s.key}
            label={s.label}
            value={s.value}
            icon={s.icon}
            loading={loading}
            isRefreshing={isRefreshing}
          />
        ))}
      </section>

      {/* ============ CHARTS ============ */}
      <section className="grid grid-cols-1 gap-4 mt-6 sm:mt-8 lg:grid-cols-2 sm:gap-6">
        <ReadingTrendChart refreshKey={refreshKey} />
        <UserGrowthChart refreshKey={refreshKey} />
      </section>

      {/* ============ TRENDING ============ */}
      <section className="mt-6 sm:mt-8">
        <TrendingBooks refreshKey={refreshKey} />
      </section>

      {/* ============ RECENT ACTIVITY ============ */}
      <section className="mt-6 sm:mt-8">
        <RecentActivity refreshKey={refreshKey} />
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Build stat card list from overview                                */
/* ------------------------------------------------------------------ */
function buildStats(o = {}) {
  const books = o.books || o.bookStats || {};
  const cats = o.categories || o.categoryStats || {};
  const users = o.users || o.userStats || {};
  const read = o.reading || o.readingStats || o.reads || {};

  return [
    {
      key: "books.total",
      label: "Total Books",
      value: books.total ?? books.totalBooks ?? 0,
      icon: BookOpen,
    },
    {
      key: "books.published",
      label: "Published Books",
      value: books.published ?? books.publishedBooks ?? 0,
      icon: CheckCircle2,
    },
    {
      key: "books.draft",
      label: "Draft Books",
      value: books.draft ?? books.drafts ?? 0,
      icon: FileEdit,
    },
    {
      key: "books.archived",
      label: "Archived Books",
      value: books.archived ?? 0,
      icon: Archive,
    },
    {
      key: "categories.total",
      label: "Total Categories",
      value: cats.total ?? cats.totalCategories ?? 0,
      icon: FolderTree,
    },
    {
      key: "categories.active",
      label: "Active Categories",
      value: cats.active ?? cats.activeCategories ?? 0,
      icon: FolderCheck,
    },
    {
      key: "users.total",
      label: "Total Users",
      value: users.total ?? users.totalUsers ?? 0,
      icon: Users,
    },
    {
      key: "users.newLast30Days",
      label: "New Users (30d)",
      value: users.newLast30Days ?? users.newUsers ?? users.last30Days ?? 0,
      icon: UserPlus,
    },
    {
      key: "reading.totalSessions",
      label: "Reading Sessions",
      value: read.totalSessions ?? read.sessions ?? read.total ?? 0,
      icon: BookMarked,
    },
    {
      key: "reading.uniqueReaders",
      label: "Unique Readers",
      value: read.uniqueReaders ?? read.readers ?? read.unique ?? 0,
      icon: Eye,
    },
  ];
}
