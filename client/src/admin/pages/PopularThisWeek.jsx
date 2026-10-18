import { useEffect, useMemo, useState } from "react";
import {
  Flame,
  Star,
  RefreshCw,
  AlertCircle,
  Award,
  TrendingUp,
  Sparkles,
  BookOpen,
  Trophy,
  ArrowUpRight,
} from "lucide-react";

import Loader from "../../components/ui/Loader";
import { reviewsAPI } from "../../api/reviewsApi";

/*  Page                                                              */

export default function PopularThisWeek() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await reviewsAPI.getPopularBooks();
        if (cancelled) return;

        const raw = res?.data || {};
        const list =
          (Array.isArray(raw.books) && raw.books) ||
          (Array.isArray(raw.popular) && raw.popular) ||
          (Array.isArray(raw.ranking) && raw.ranking) ||
          (Array.isArray(raw.data) && raw.data) ||
          (Array.isArray(raw) && raw) ||
          [];

        setBooks(list);
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Could not load popular books");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  /* Normalise */
  const ranked = useMemo(() => {
    return books.map((b, idx) => ({
      id: b.id || b._id || b.book_id || idx,
      rank: Number(b.rank) || idx + 1,
      title: b.title || b.book_title || "Untitled",
      author: b.author || b.book_author || "—",
      reviewCount: Number(
        b.review_count ?? b.reviewCount ?? b.total_reviews ?? b.reviews ?? 0,
      ),
      avgRating: Number(b.avg_rating ?? b.avgRating ?? b.rating ?? 0),
      approvedCount: Number(
        b.approved_count ?? b.approvedCount ?? b.approved_reviews ?? 0,
      ),
    }));
  }, [books]);

  /* Aggregate stat */
  const avgRating = useMemo(() => {
    const rated = ranked.filter((b) => b.avgRating > 0);
    if (!rated.length) return 0;
    const sum = rated.reduce((s, b) => s + b.avgRating, 0);
    return sum / rated.length;
  }, [ranked]);

  return (
    <div className="max-w-5xl px-4 py-6 mx-auto sm:px-6 lg:px-8 sm:py-8">
      {/* ================= HEADER ================= */}
      <header className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="relative grid w-10 h-10 rounded-2xl bg-gradient-to-br from-gold to-gold/70 place-items-center text-primary shrink-0 shadow-soft">
            <Flame size={18} />
            <span className="absolute flex items-center justify-center w-3 h-3 rounded-full -top-1 -right-1 bg-primary ring-2 ring-cream">
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            </span>
          </span>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-primary/50 font-medium">
              VedBook Admin
            </p>
            <h1 className="text-2xl tracking-tight font-display sm:text-3xl text-primary">
              Popular This Week
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setRefreshKey((k) => k + 1)}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center gap-2 bg-cream border border-primary/10 text-primary px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-mint disabled:opacity-60 transition shadow-soft"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </header>

      {/* ================= HERO STRIP ================= */}
      <section className="relative p-6 mb-6 overflow-hidden bg-primary rounded-3xl sm:p-8">
        <div className="absolute w-64 h-64 rounded-full pointer-events-none -top-20 -right-20 bg-gold/20 blur-3xl" />
        <div className="absolute w-64 h-64 rounded-full pointer-events-none -bottom-20 -left-20 bg-mint/10 blur-3xl" />

        <div className="relative grid items-end gap-5 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <div className="inline-flex items-center gap-1.5 bg-cream/10 border border-cream/15 text-gold text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full">
              <Sparkles size={10} />
              Reading Circle
            </div>
            <h2 className="mt-3 text-2xl leading-tight font-display sm:text-3xl text-cream">
              Volumes most reviewed by our reading circle
            </h2>
            <p className="max-w-md mt-3 text-xs text-cream/60 sm:text-sm">
              Ranking is auto-calculated from approved reviews in the last 7
              days. Hidden reviews do not count toward a book's popularity.
            </p>
          </div>

          <div className="flex gap-4 sm:flex-col sm:gap-3 sm:items-end">
            <HeroStat label="Top books" value={ranked.length} />
            <HeroStat
              label="Avg rating"
              value={avgRating > 0 ? avgRating.toFixed(1) : "—"}
              icon={Star}
            />
          </div>
        </div>
      </section>

      {/* ================= ERROR ================= */}
      {error && (
        <div className="flex items-start gap-2 px-4 py-3 mb-5 text-sm text-red-600 border border-red-200 bg-red-50 rounded-2xl">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium">Couldn't load popular books</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            className="text-xs font-medium underline underline-offset-2 shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* ================= RANKING SECTION ================= */}
      <section className="p-4 border bg-cream border-primary/10 rounded-3xl sm:p-6 shadow-soft">
        <header className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="grid w-8 h-8 rounded-lg bg-gold/25 place-items-center text-primary shrink-0">
              <Trophy size={14} />
            </span>
            <div>
              <h3 className="text-base font-display text-primary">
                Weekly Rankings
              </h3>
              <p className="text-[11px] text-primary/50">
                Auto-updated · read-only
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider bg-mint text-primary px-2 py-1 rounded-full">
            <TrendingUp size={10} />
            Live
          </span>
        </header>

        {loading ? (
          <div className="py-16">
            <Loader center size={30} label="Loading rankings" />
          </div>
        ) : ranked.length === 0 ? (
          <EmptyRanking />
        ) : (
          <ol className="space-y-2.5">
            {ranked.map((b) => (
              <PopularRow key={b.id} book={b} />
            ))}
          </ol>
        )}
      </section>

      <p className="mt-5 text-xs text-center text-primary/40">
        Illustrative layout — book data and counts come from your API.
      </p>
    </div>
  );
}

/*  Hero stat                                                          */

function HeroStat({ label, value, icon: Icon }) {
  return (
    <div className="sm:text-right">
      <p className="text-[10px] uppercase tracking-wider text-cream/50 font-medium">
        {label}
      </p>
      <p className="font-display text-2xl sm:text-3xl text-cream mt-0.5 inline-flex items-center gap-1.5 tabular-nums">
        {Icon && <Icon size={18} className="fill-gold text-gold" />}
        {value}
      </p>
    </div>
  );
}

/*  Popular row                                                        */

function PopularRow({ book }) {
  const isTop3 = book.rank <= 3;
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <li
      className={`group relative flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-300 ${
        isTop3
          ? "bg-gradient-to-r from-gold/15 via-cream to-cream border-2 border-gold/60 shadow-[0_8px_24px_-14px_rgba(214,181,109,0.6)]"
          : "bg-white/60 border border-primary/10 hover:border-gold/40 hover:shadow-soft hover:-translate-y-0.5"
      }`}
    >
      {/* Rank badge */}
      <span
        className={`w-11 h-11 rounded-2xl grid place-items-center font-display font-bold text-base shrink-0 ${
          isTop3
            ? "bg-gradient-to-br from-gold to-gold/70 text-primary shadow-soft"
            : "bg-mint text-primary/70"
        }`}
      >
        {isTop3 ? (
          <span className="text-xl leading-none">{medals[book.rank - 1]}</span>
        ) : (
          <span>#{book.rank}</span>
        )}
      </span>

      {/* Book info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm leading-tight font-display sm:text-base text-primary line-clamp-1">
            {book.title}
          </h4>
          {isTop3 && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[9.5px] font-semibold uppercase tracking-wider bg-gold/25 text-primary px-1.5 py-0.5 rounded">
              <Award size={9} />
              Top rated
            </span>
          )}
        </div>
        <p className="text-[11px] text-primary/50 truncate mt-0.5">
          {book.author}
        </p>

        {/* Mobile meta */}
        <div className="sm:hidden flex items-center gap-3 mt-1.5 text-[10px] text-primary/50">
          <span className="inline-flex items-center gap-1">
            <Star size={10} className="text-gold fill-gold" />
            {book.avgRating.toFixed(1)}
          </span>
          <span className="inline-flex items-center gap-1">
            <BookOpen size={10} />
            {book.reviewCount} reviews
          </span>
        </div>
      </div>

      {/* Desktop counts */}
      <div className="items-center hidden gap-5 sm:flex shrink-0">
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-primary/40 font-medium">
            Rating
          </p>
          <p className="inline-flex items-center gap-1 text-sm font-bold text-primary tabular-nums">
            <Star size={12} className="text-gold fill-gold" />
            {book.avgRating.toFixed(1)}
          </p>
        </div>

        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-primary/40 font-medium">
            Reviews
          </p>
          <p className="text-sm font-bold text-primary tabular-nums">
            {book.reviewCount}
          </p>
        </div>

        {book.approvedCount > 0 && (
          <div className="hidden text-right md:block">
            <p className="text-[10px] uppercase tracking-wider text-emerald-600 font-medium">
              Approved
            </p>
            <p className="text-sm font-bold text-emerald-600 tabular-nums">
              {book.approvedCount}
            </p>
          </div>
        )}
      </div>

      {/* Trend arrow */}
      <ArrowUpRight
        size={16}
        className={`shrink-0 transition-colors ${
          isTop3
            ? "text-gold"
            : "text-primary/25 group-hover:text-gold group-hover:translate-x-0.5"
        }`}
      />
    </li>
  );
}

/*  Empty                                                              */

function EmptyRanking() {
  return (
    <div className="text-center py-14">
      <div className="grid mx-auto mb-4 w-14 h-14 rounded-2xl bg-gold/25 place-items-center">
        <Flame size={22} className="text-primary/50" />
      </div>
      <h3 className="text-lg font-display text-primary">
        No trending books yet
      </h3>
      <p className="max-w-sm mx-auto mt-1 text-sm text-primary/50">
        Once readers start reviewing, popular titles will appear here
        automatically.
      </p>
    </div>
  );
}
