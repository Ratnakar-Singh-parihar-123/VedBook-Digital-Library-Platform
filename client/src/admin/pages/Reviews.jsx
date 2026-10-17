import { useEffect, useMemo, useState } from "react";
import {
  MessageSquare,
  Star,
  Search,
  RefreshCw,
  AlertCircle,
  X,
  Loader2,
  Check,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Clock,
  CheckCircle2,
  Layers,
  Flame,
  ArrowUpRight,
  Shield,
  Ban,
  RotateCcw,
  Sparkles,
} from "lucide-react";

import Loader from "../../components/ui/Loader";
import { reviewsAPI } from "../../api/reviewsApi";
import {
  formatDate,
  formatNumber,
} from "../dashboard/utils/format";

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */
const PAGE_SIZE = 15;

const STATUS_TABS = [
  { key: "all", label: "All", icon: Layers },
  { key: "pending", label: "Pending", icon: Clock },
  { key: "approved", label: "Approved", icon: CheckCircle2 },
  { key: "hidden", label: "Hidden", icon: EyeOff },
];

/* ================================================================== */
/*  Page                                                              */
/* ================================================================== */
export default function Reviews() {
  const [tab, setTab] = useState("reviews"); // reviews | popular
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState(null);

  /* Auto-dismiss toast */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8 sm:py-8">
      {/* ================= TOAST ================= */}
      <div
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-[150] transition-all duration-500 ease-out ${
          toast
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        {toast && (
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl shadow-soft backdrop-blur-md ${
              toast.type === "success"
                ? "bg-emerald-50/95 border border-emerald-200 text-emerald-700"
                : "bg-red-50/95 border border-red-200 text-red-600"
            }`}
          >
            {toast.type === "success" ? (
              <Check size={15} className="shrink-0" />
            ) : (
              <AlertCircle size={15} className="shrink-0" />
            )}
            <span className="text-xs font-medium">{toast.text}</span>
          </div>
        )}
      </div>

      {/* ================= HEADER ================= */}
      <header className="flex flex-col gap-4 mb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="relative grid w-10 h-10 rounded-2xl bg-gradient-to-br from-mint to-mint/60 place-items-center text-primary shrink-0 shadow-soft">
            <MessageSquare size={18} />
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl tracking-tight font-display sm:text-3xl text-primary">
              Reviews & Popularity
            </h1>
            <p className="text-sm truncate text-primary/60">
              Moderate reader reviews and track trending books
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setRefreshKey((k) => k + 1)}
          className="self-start sm:self-auto inline-flex items-center gap-2 bg-cream border border-primary/10 text-primary px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-mint transition shadow-soft"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </header>

      {/* ================= INFO BANNER ================= */}
      <div className="mb-5 flex items-start gap-2.5 bg-gradient-to-r from-gold/15 to-gold/5 border border-gold/40 rounded-2xl px-4 py-3">
        <Sparkles className="w-5 h-5 text-gold shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs leading-relaxed text-primary/80">
            <span className="font-semibold">Popular This Week</span> ranking is
            calculated automatically. Hidden reviews do not count toward a
            book's popularity — moderate responsibly.
          </p>
        </div>
      </div>

      {/* ================= TAB SWITCHER ================= */}
      <div className="grid grid-cols-2 gap-1 p-1 mb-5 border bg-mint/40 border-primary/10 rounded-2xl">
        <button
          type="button"
          onClick={() => setTab("reviews")}
          className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
            tab === "reviews"
              ? "bg-primary text-cream shadow-soft scale-[1.02]"
              : "text-primary/70 hover:bg-mint"
          }`}
        >
          <MessageSquare size={14} />
          Reviews Moderation
        </button>
        <button
          type="button"
          onClick={() => setTab("popular")}
          className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
            tab === "popular"
              ? "bg-primary text-cream shadow-soft scale-[1.02]"
              : "text-primary/70 hover:bg-mint"
          }`}
        >
          <Flame size={14} />
          Popular This Week
        </button>
      </div>

      {/* ================= CONTENT ================= */}
      {tab === "reviews" ? (
        <ReviewsTab refreshKey={refreshKey} onToast={setToast} />
      ) : (
        <PopularTab refreshKey={refreshKey} />
      )}
    </div>
  );
}

/* ================================================================== */
/*  TAB 1 — Reviews Moderation                                        */
/* ================================================================== */
function ReviewsTab({ refreshKey, onToast }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [workingId, setWorkingId] = useState(null);

  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    hidden: 0,
  });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* Debounce search */
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  /* Fetch stats + reviews */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [reviewsRes, statsRes] = await Promise.allSettled([
          reviewsAPI.list({
            page,
            limit: PAGE_SIZE,
            status: statusFilter !== "all" ? statusFilter : undefined,
            search: debouncedSearch || undefined,
          }),
          reviewsAPI.getStats(),
        ]);

        if (cancelled) return;

        /* Reviews */
        if (reviewsRes.status === "fulfilled") {
          const raw = reviewsRes.value?.data || {};
          const list =
            (Array.isArray(raw.reviews) && raw.reviews) ||
            (Array.isArray(raw.data) && raw.data) ||
            (Array.isArray(raw.results) && raw.results) ||
            (Array.isArray(raw) && raw) ||
            [];
          setReviews(list);
          setTotal(raw.total ?? raw.count ?? list.length);
          setTotalPages(
            raw.totalPages ??
              raw.pages ??
              Math.max(1, Math.ceil((raw.total ?? list.length) / PAGE_SIZE)),
          );
        } else {
          setError(reviewsRes.reason?.message || "Could not load reviews");
        }

        /* Stats */
        if (statsRes.status === "fulfilled") {
          const s = statsRes.value?.data || {};
          setStats({
            total: s.total ?? 0,
            pending: s.pending ?? 0,
            approved: s.approved ?? 0,
            hidden: s.hidden ?? 0,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, statusFilter, debouncedSearch, refreshKey]);

  /* Handle status change */
  const handleStatusChange = async (review, newStatus) => {
    const id = review.id || review._id;
    if (!id || workingId) return;

    setWorkingId(id);
    try {
      await reviewsAPI.setStatus(id, newStatus);
      onToast?.({
        type: "success",
        text:
          newStatus === "approved"
            ? "Review approved"
            : "Review hidden — removed from popularity",
      });
      /* Optimistic local update */
      setReviews((prev) =>
        prev.map((r) =>
          (r.id || r._id) === id ? { ...r, status: newStatus } : r,
        ),
      );
      /* Refresh stats */
      try {
        const s = await reviewsAPI.getStats();
        const data = s?.data || {};
        setStats({
          total: data.total ?? 0,
          pending: data.pending ?? 0,
          approved: data.approved ?? 0,
          hidden: data.hidden ?? 0,
        });
      } catch {
        /* ignore */
      }
    } catch (err) {
      onToast?.({
        type: "error",
        text: err?.message || "Could not update status",
      });
    } finally {
      setWorkingId(null);
    }
  };

  const hasFilters = search.trim() !== "" || statusFilter !== "all";
  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPage(1);
  };

  return (
    <>
      {/* ============= STATS CARDS ============= */}
      <section className="grid grid-cols-2 gap-3 mb-5 lg:grid-cols-4 sm:gap-4">
        <StatCard
          icon={Layers}
          label="Total Reviews"
          value={stats.total}
          tone="primary"
        />
        <StatCard
          icon={Clock}
          label="Pending"
          value={stats.pending}
          tone="gold"
        />
        <StatCard
          icon={CheckCircle2}
          label="Approved"
          value={stats.approved}
          tone="emerald"
        />
        <StatCard
          icon={EyeOff}
          label="Hidden"
          value={stats.hidden}
          tone="red"
        />
      </section>

      {/* ============= TOOLBAR ============= */}
      <div className="p-3 mb-5 border bg-cream border-primary/10 rounded-2xl sm:p-4 shadow-soft">
        {/* Status filter pills */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {STATUS_TABS.map((t) => {
            const Icon = t.icon;
            const on = statusFilter === t.key;
            const count = t.key === "all" ? stats.total : (stats[t.key] ?? 0);
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  setStatusFilter(t.key);
                  setPage(1);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                  on
                    ? "bg-primary text-cream shadow-soft scale-[1.02]"
                    : "bg-white border border-primary/10 text-primary/70 hover:bg-mint hover:text-primary hover:border-primary/20"
                }`}
              >
                <Icon size={13} />
                {t.label}
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full tabular-nums ${
                    on ? "bg-cream/20 text-cream" : "bg-mint text-primary/70"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2.5 bg-white/70 border border-primary/10 rounded-xl px-3.5 focus-within:ring-2 focus-within:ring-gold/40 focus-within:border-gold/40 transition">
          <Search size={15} className="text-primary/40 shrink-0" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by book title, reviewer name, or review text…"
            className="w-full bg-transparent outline-none text-sm text-primary placeholder:text-primary/40 py-2.5"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="transition text-primary/40 hover:text-primary shrink-0"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {hasFilters && (
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-primary/10">
            <span className="text-xs text-primary/50">
              Showing filtered results
            </span>
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs underline text-primary/60 hover:text-primary underline-offset-4"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* ============= ERROR ============= */}
      {error && (
        <div className="flex items-start gap-2 px-4 py-3 mb-5 text-sm text-red-600 border border-red-200 bg-red-50 rounded-2xl">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium">Couldn't load reviews</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* ============= LIST ============= */}
      {loading ? (
        <div className="py-20 border bg-cream border-primary/10 rounded-2xl">
          <Loader center size={32} label="Loading reviews" />
        </div>
      ) : reviews.length === 0 ? (
        <EmptyReviews hasFilters={hasFilters} onClear={clearFilters} />
      ) : (
        <>
          <div className="space-y-3">
            {reviews.map((r) => (
              <ReviewCard
                key={r.id || r._id}
                review={r}
                working={workingId === (r.id || r._id)}
                onApprove={() => handleStatusChange(r, "approved")}
                onHide={() => handleStatusChange(r, "hidden")}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              onChange={setPage}
            />
          )}

          <p className="mt-4 text-xs text-center text-primary/40">
            Page {page} of {totalPages} · {formatNumber(total)} total reviews
          </p>
        </>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat card                                                          */
/* ------------------------------------------------------------------ */
function StatCard({ icon: Icon, label, value, tone }) {
  const toneCls = {
    primary: { bg: "bg-mint text-primary", badge: "bg-white/60" },
    gold: { bg: "bg-gold/25 text-primary", badge: "bg-white/60" },
    emerald: { bg: "bg-emerald-50 text-emerald-600", badge: "bg-white/60" },
    red: { bg: "bg-red-50 text-red-600", badge: "bg-white/60" },
  }[tone] || { bg: "bg-mint text-primary", badge: "bg-white/60" };

  return (
    <div className="p-4 transition-all duration-300 border bg-cream border-primary/10 rounded-2xl hover:shadow-soft">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-primary/50 font-medium">
            {label}
          </p>
          <p className="font-display text-2xl sm:text-3xl text-primary mt-1.5 tabular-nums">
            {formatNumber(value)}
          </p>
        </div>
        <span
          className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 ${toneCls.bg}`}
        >
          <Icon size={15} />
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Review card                                                        */
/* ------------------------------------------------------------------ */
function ReviewCard({ review, working, onApprove, onHide }) {
  const status = String(review.status || "pending").toLowerCase();
  const bookTitle =
    review.book_title || review.bookTitle || review.book?.title || "Untitled";
  const reviewerName =
    review.user_name || review.userName || review.user?.name || "Anonymous";
  const reviewerEmail = review.user?.email || review.user_email || "";
  const rating = Number(review.rating) || 0;
  const comment = review.comment || review.text || review.review_text || "";
  const createdAt = review.created_at || review.createdAt;

  const statusStyles = {
    pending: {
      bg: "bg-gold/15 border-gold/40",
      text: "text-primary",
      label: "Pending",
      icon: Clock,
    },
    approved: {
      bg: "bg-emerald-50 border-emerald-200",
      text: "text-emerald-700",
      label: "Approved",
      icon: CheckCircle2,
    },
    hidden: {
      bg: "bg-red-50 border-red-200",
      text: "text-red-600",
      label: "Hidden",
      icon: EyeOff,
    },
  };
  const st = statusStyles[status] || statusStyles.pending;
  const StatusIcon = st.icon;

  return (
    <article className="p-4 transition-all duration-300 border bg-cream border-primary/10 rounded-2xl hover:shadow-soft">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <span className="grid w-10 h-10 text-sm font-bold rounded-xl bg-gold text-primary place-items-center font-display shrink-0">
          {(reviewerName.charAt(0) || "A").toUpperCase()}
        </span>

        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate text-primary">
                {reviewerName}
              </p>
              {reviewerEmail && (
                <p className="text-[11px] text-primary/50 truncate">
                  {reviewerEmail}
                </p>
              )}
            </div>

            <span
              className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full border ${st.bg} ${st.text} shrink-0`}
            >
              <StatusIcon size={10} />
              {st.label}
            </span>
          </div>

          {/* Book + rating */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1 bg-mint text-primary text-[10px] font-medium px-2 py-0.5 rounded-lg">
              <BookOpen size={10} />
              {bookTitle}
            </span>

            {/* Stars */}
            <span className="inline-flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  size={11}
                  className={
                    n <= rating ? "text-gold fill-gold" : "text-primary/20"
                  }
                />
              ))}
              <span className="text-[10px] text-primary/50 ml-1">
                {rating.toFixed(1)}
              </span>
            </span>
          </div>

          {/* Comment */}
          {comment && (
            <p className="mt-2.5 text-sm text-primary/75 leading-relaxed line-clamp-3">
              {comment}
            </p>
          )}

          {/* Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-3 border-t border-primary/5">
            <span className="inline-flex items-center gap-1 text-[10.5px] text-primary/40">
              <Clock size={10} />
              {relativeTime(createdAt)}
            </span>

            {/* Actions */}
            <div className="flex items-center gap-1.5">
              {status !== "approved" && (
                <button
                  type="button"
                  onClick={onApprove}
                  disabled={working}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-2.5 py-1.5 rounded-lg transition active:scale-95"
                >
                  {working ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : (
                    <Check size={11} />
                  )}
                  Approve
                </button>
              )}

              {status !== "hidden" && (
                <button
                  type="button"
                  onClick={onHide}
                  disabled={working}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 disabled:opacity-50 px-2.5 py-1.5 rounded-lg transition active:scale-95"
                >
                  {working ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : (
                    <Ban size={11} />
                  )}
                  Hide
                </button>
              )}

              {status === "hidden" && (
                <button
                  type="button"
                  onClick={onApprove}
                  disabled={working}
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium text-primary bg-mint hover:bg-gold/30 disabled:opacity-50 px-2.5 py-1.5 rounded-lg transition"
                >
                  <RotateCcw size={11} />
                  Restore
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty reviews                                                      */
/* ------------------------------------------------------------------ */
function EmptyReviews({ hasFilters, onClear }) {
  return (
    <div className="px-6 py-16 text-center border bg-cream border-primary/10 rounded-2xl">
      <div className="grid mx-auto mb-4 w-14 h-14 rounded-2xl bg-mint place-items-center">
        <MessageSquare size={22} className="text-primary/50" />
      </div>
      <h3 className="text-lg font-display text-primary">
        {hasFilters ? "No reviews match your filters" : "No reviews yet"}
      </h3>
      <p className="max-w-sm mx-auto mt-1 text-sm text-primary/50">
        {hasFilters
          ? "Try adjusting your search or filters."
          : "Reader reviews will appear here once users start reviewing books."}
      </p>
      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 inline-flex items-center gap-2 bg-primary text-cream px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition shadow-soft"
        >
          <RotateCcw size={14} /> Clear filters
        </button>
      )}
    </div>
  );
}

/* ================================================================== */
/*  TAB 2 — Popular This Week (auto-ranked, read-only)                */
/* ================================================================== */
function PopularTab({ refreshKey }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [popularRes, analyticsRes] = await Promise.allSettled([
          reviewsAPI.getPopularThisWeek(),
          reviewsAPI.getPopularBooks(),
        ]);

        if (cancelled) return;

        /* Prefer the analytics endpoint if it responds with more detail */
        const source =
          analyticsRes.status === "fulfilled"
            ? analyticsRes.value
            : popularRes.status === "fulfilled"
              ? popularRes.value
              : null;

        if (source) {
          const raw = source.data || {};
          const list =
            (Array.isArray(raw.books) && raw.books) ||
            (Array.isArray(raw.popular) && raw.popular) ||
            (Array.isArray(raw.ranking) && raw.ranking) ||
            (Array.isArray(raw.data) && raw.data) ||
            (Array.isArray(raw) && raw) ||
            [];
          setBooks(list);
        } else {
          setError(
            popularRes.reason?.message || "Could not load popular books",
          );
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

  return (
    <>
      {/* Info banner */}
      <div className="mb-5 flex items-start gap-2.5 bg-mint/60 border border-primary/10 rounded-2xl px-4 py-3">
        <Shield size={15} className="text-primary/70 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs leading-relaxed text-primary/80">
            Ranking is <span className="font-semibold">auto-calculated</span>{" "}
            from approved reviews in the last 7 days. Admin{" "}
            <span className="font-semibold">cannot manually reorder</span> this
            list — hide a review to exclude it from the count.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 border bg-cream border-primary/10 rounded-2xl">
          <Loader center size={32} label="Loading ranking" />
        </div>
      ) : error ? (
        <div className="px-6 py-16 text-center border bg-cream border-primary/10 rounded-2xl">
          <AlertCircle size={22} className="mx-auto mb-3 text-red-500" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : ranked.length === 0 ? (
        <div className="px-6 py-16 text-center border bg-cream border-primary/10 rounded-2xl">
          <div className="grid mx-auto mb-4 w-14 h-14 rounded-2xl bg-gold/25 place-items-center">
            <Flame size={22} className="text-primary/50" />
          </div>
          <h3 className="text-lg font-display text-primary">
            No trending books yet
          </h3>
          <p className="max-w-sm mx-auto mt-1 text-sm text-primary/50">
            Once readers start reviewing, popular titles will show up here
            automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {ranked.map((b) => (
            <PopularRow key={b.id} book={b} />
          ))}
          <p className="mt-4 text-xs text-center text-primary/40">
            Auto-updated every hour · {ranked.length} books trending
          </p>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Popular book row                                                  */
/* ------------------------------------------------------------------ */
function PopularRow({ book }) {
  /* Top 3 get special styling */
  const isTop3 = book.rank <= 3;
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <article
      className={`group bg-cream rounded-2xl p-3.5 flex items-center gap-3 transition-all duration-300 hover:shadow-soft ${
        isTop3
          ? "border-2 border-gold/60 shadow-[0_8px_24px_-12px_rgba(214,181,109,0.6)]"
          : "border border-primary/10 hover:border-gold/40 hover:-translate-y-0.5"
      }`}
    >
      {/* Rank */}
      <span
        className={`w-10 h-10 rounded-xl grid place-items-center font-display font-bold text-base shrink-0 ${
          isTop3
            ? "bg-gradient-to-br from-gold to-gold/70 text-primary shadow-soft"
            : "bg-mint text-primary/70"
        }`}
      >
        {isTop3 ? medals[book.rank - 1] : `#${book.rank}`}
      </span>

      {/* Book info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm leading-tight font-display text-primary line-clamp-1">
          {book.title}
        </h3>
        <p className="text-[11px] text-primary/50 truncate mt-0.5">
          {book.author}
        </p>
      </div>

      {/* Rating */}
      <div className="items-center hidden gap-1 sm:flex shrink-0">
        <Star size={12} className="text-gold fill-gold" />
        <span className="text-xs font-semibold text-primary tabular-nums">
          {book.avgRating.toFixed(1)}
        </span>
      </div>

      {/* Counts */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-primary/40 font-medium">
            Reviews
          </p>
          <p className="text-sm font-bold text-primary tabular-nums">
            {formatNumber(book.reviewCount)}
          </p>
        </div>
        {book.approvedCount > 0 && (
          <div className="hidden text-right md:block">
            <p className="text-[10px] uppercase tracking-wider text-emerald-600 font-medium">
              Approved
            </p>
            <p className="text-sm font-bold text-emerald-600 tabular-nums">
              {formatNumber(book.approvedCount)}
            </p>
          </div>
        )}
      </div>

      {/* Trend arrow */}
      <ArrowUpRight
        size={16}
        className={`shrink-0 transition-colors ${
          isTop3 ? "text-gold" : "text-primary/30 group-hover:text-gold"
        }`}
      />
    </article>
  );
}

/* ------------------------------------------------------------------ */
/*  Pagination                                                         */
/* ------------------------------------------------------------------ */
function Pagination({ page, totalPages, onChange }) {
  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, page - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <nav
      aria-label="Pagination"
      className="mt-5 flex items-center justify-center gap-1.5"
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        aria-label="Previous page"
        className="grid transition border w-9 h-9 rounded-xl bg-cream border-primary/10 place-items-center text-primary/70 hover:bg-mint disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={15} />
      </button>

      {pages.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-current={page === n ? "page" : undefined}
          className={`w-9 h-9 rounded-xl text-sm font-medium transition ${
            page === n
              ? "bg-primary text-cream shadow-soft"
              : "bg-cream border border-primary/10 text-primary/70 hover:bg-mint"
          }`}
        >
          {n}
        </button>
      ))}

      <button
        type="button"
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        aria-label="Next page"
        className="grid transition border w-9 h-9 rounded-xl bg-cream border-primary/10 place-items-center text-primary/70 hover:bg-mint disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronRight size={15} />
      </button>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function relativeTime(dateStr) {
  if (!dateStr) return "—";
  const dt = new Date(dateStr);
  if (isNaN(dt.getTime())) return "—";

  const diffMs = Date.now() - dt.getTime();
  const sec = Math.floor(diffMs / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);

  if (sec < 60) return "just now";
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day < 7) return `${day}d ago`;
  return formatDate(dateStr);
}
