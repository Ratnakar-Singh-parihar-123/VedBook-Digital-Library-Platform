import { useEffect, useState } from "react";
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
  Clock,
  CheckCircle2,
  Layers,
  Ban,
  RotateCcw,
  BookOpen,
} from "lucide-react";

import Loader from "../../components/ui/Loader";
import { reviewsAPI } from "../../api/reviewsApi";
import { formatDate, formatNumber } from "../dashboard/utils/format";

/*  Config                                                             */

const PAGE_SIZE = 10;

const STATUS_FILTERS = [
  { key: "all", label: "All", icon: Layers },
  { key: "pending", label: "Pending", icon: Clock },
  { key: "approved", label: "Approved", icon: CheckCircle2 },
  { key: "hidden", label: "Hidden", icon: EyeOff },
];

/* ================================================================== */
/*  Page                                                              */
/* ================================================================== */
export default function ReviewManagement() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

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
  const [workingId, setWorkingId] = useState(null);
  const [toast, setToast] = useState(null);

  /* Debounce search */
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  /* Auto-dismiss toast */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  /* Fetch reviews + stats */
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
            status: status !== "all" ? status : undefined,
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

          const t = raw.total ?? raw.count ?? list.length;
          setTotal(t);
          setTotalPages(
            raw.totalPages ??
              raw.pages ??
              Math.max(1, Math.ceil(t / PAGE_SIZE)),
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
  }, [page, status, debouncedSearch, refreshKey]);

  /* Status change */
  const handleStatusChange = async (review, nextStatus) => {
    const id = review.id || review._id;
    if (!id || workingId) return;

    setWorkingId(id);
    try {
      await reviewsAPI.setStatus(id, nextStatus);

      /* Optimistic update */
      setReviews((prev) =>
        prev.map((r) =>
          (r.id || r._id) === id ? { ...r, status: nextStatus } : r,
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

      setToast({
        type: "success",
        text:
          nextStatus === "approved"
            ? "Review approved"
            : "Review hidden — removed from popularity",
      });
    } catch (err) {
      setToast({
        type: "error",
        text: err?.message || "Could not update review",
      });
    } finally {
      setWorkingId(null);
    }
  };

  const hasFilters = search.trim() !== "" || status !== "all";
  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setPage(1);
  };

  return (
    <div className="max-w-5xl px-4 py-6 mx-auto sm:px-6 lg:px-8 sm:py-8">
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
      <header className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="grid w-10 h-10 rounded-2xl bg-gradient-to-br from-mint to-mint/60 place-items-center text-primary shrink-0 shadow-soft">
            <MessageSquare size={18} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-primary/50 font-medium">
              VedBook Admin
            </p>
            <h1 className="text-2xl tracking-tight font-display sm:text-3xl text-primary">
              Review Management
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

      {/* ================= STAT CARDS ================= */}
      <section className="grid grid-cols-2 gap-3 mb-6 lg:grid-cols-4 sm:gap-4">
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

      {/* ================= TOOLBAR ================= */}
      <section className="p-3 mb-5 border bg-cream border-primary/10 rounded-2xl sm:p-4 shadow-soft">
        {/* Filter pills */}
        <div className="flex items-center gap-2 px-1 pb-1 mb-3 -mx-1 overflow-x-auto no-scrollbar">
          {STATUS_FILTERS.map((f) => {
            const Icon = f.icon;
            const on = status === f.key;
            const count = f.key === "all" ? stats.total : (stats[f.key] ?? 0);
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => {
                  setStatus(f.key);
                  setPage(1);
                }}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                  on
                    ? "bg-primary text-cream shadow-soft scale-[1.02]"
                    : "bg-white border border-primary/10 text-primary/70 hover:bg-mint hover:text-primary hover:border-primary/20"
                }`}
              >
                <Icon size={13} />
                {f.label}
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
            placeholder="Search by book title, reviewer, or review text…"
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

        {/* Clear filters */}
        {hasFilters && (
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-primary/10">
            <span className="text-xs text-primary/50">
              Filters active · {formatNumber(total)} results
            </span>
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs underline text-primary/60 hover:text-primary underline-offset-4"
            >
              Clear all
            </button>
          </div>
        )}
      </section>

      {/* ================= ERROR ================= */}
      {error && (
        <div className="flex items-start gap-2 px-4 py-3 mb-5 text-sm text-red-600 border border-red-200 bg-red-50 rounded-2xl">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium">Couldn't load reviews</p>
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

      {/* ================= LIST ================= */}
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

          <p className="mt-5 text-xs text-center text-primary/40">
            Page {page} of {totalPages} · {formatNumber(total)} total reviews
          </p>
        </>
      )}

      <p className="mt-6 text-xs text-center text-primary/40">
        Illustrative layout — actual review records load from the API.
      </p>
    </div>
  );
}

/*  Stat card                                                          */

function StatCard({ icon: Icon, label, value, tone }) {
  const toneMap = {
    primary: "bg-mint text-primary",
    gold: "bg-gold/25 text-primary",
    emerald: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
  };
  const toneCls = toneMap[tone] || toneMap.primary;

  return (
    <div className="group bg-cream border border-primary/10 rounded-2xl p-4 hover:shadow-soft hover:-translate-y-0.5 transition-all duration-300">
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
          className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 group-hover:scale-105 transition-transform ${toneCls}`}
        >
          <Icon size={15} />
        </span>
      </div>
    </div>
  );
}

/*  Review card                                                        */

function ReviewCard({ review, working, onApprove, onHide }) {
  const reviewStatus = String(review.status || "pending").toLowerCase();
  const bookTitle =
    review.book_title || review.bookTitle || review.book?.title || "Untitled";
  const bookId = review.book_id || review.bookId || review.book?._id;
  const reviewerName =
    review.user_name || review.userName || review.user?.name || "Anonymous";
  const userId = review.user_id || review.userId || review.user?._id || null;
  const rating = Number(review.rating) || 0;
  const comment = review.comment || review.text || review.review_text || "";
  const createdAt = review.created_at || review.createdAt;

  const statusConfig = {
    pending: {
      cls: "bg-gold/15 text-primary border-gold/40",
      label: "Pending",
      icon: Clock,
    },
    approved: {
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
      label: "Approved",
      icon: CheckCircle2,
    },
    hidden: {
      cls: "bg-red-50 text-red-600 border-red-200",
      label: "Hidden",
      icon: EyeOff,
    },
  };
  const sc = statusConfig[reviewStatus] || statusConfig.pending;
  const StatusIcon = sc.icon;

  return (
    <article className="p-4 transition-all duration-300 border bg-cream border-primary/10 rounded-2xl hover:shadow-soft">
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start min-w-0 gap-3">
          <span className="grid w-10 h-10 text-sm font-bold rounded-xl bg-gold text-primary place-items-center font-display shrink-0">
            {(reviewerName.charAt(0) || "A").toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold truncate text-primary">
                {reviewerName}
              </p>
              {userId && (
                <span className="text-[10px] font-mono text-primary/40">
                  #{String(userId).slice(-6)}
                </span>
              )}
            </div>
            <p className="text-[11px] text-primary/50 mt-0.5 inline-flex items-center gap-1.5">
              <BookOpen size={10} />
              {bookTitle}
              {bookId && (
                <span className="text-primary/30 font-mono text-[10px]">
                  · #{String(bookId).slice(-6)}
                </span>
              )}
            </p>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full border shrink-0 ${sc.cls}`}
        >
          <StatusIcon size={10} />
          {sc.label}
        </span>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-2 mt-3">
        <span className="inline-flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              size={12}
              className={
                n <= rating ? "text-gold fill-gold" : "text-primary/20"
              }
            />
          ))}
        </span>
        <span className="text-[11px] font-semibold text-primary tabular-nums">
          {rating.toFixed(1)}
        </span>
        <span className="text-[10px] text-primary/40">/ 5</span>
      </div>

      {/* Comment */}
      {comment && (
        <p className="mt-2.5 text-sm text-primary/75 leading-relaxed">
          {comment}
        </p>
      )}

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-3 border-t border-primary/5">
        <span className="inline-flex items-center gap-1 text-[10.5px] text-primary/40">
          <Clock size={10} />
          {formatDate(createdAt)}
        </span>

        <div className="flex items-center gap-1.5">
          {reviewStatus !== "approved" && (
            <button
              type="button"
              onClick={onApprove}
              disabled={working}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-3 py-1.5 rounded-lg transition active:scale-95 shadow-soft"
            >
              {working ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <Check size={11} />
              )}
              Approve
            </button>
          )}

          {reviewStatus !== "hidden" && (
            <button
              type="button"
              onClick={onHide}
              disabled={working}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 disabled:opacity-50 px-3 py-1.5 rounded-lg transition active:scale-95"
            >
              {working ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <Ban size={11} />
              )}
              Hide
            </button>
          )}

          {reviewStatus === "hidden" && (
            <button
              type="button"
              onClick={onApprove}
              disabled={working}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-primary bg-mint hover:bg-gold/30 disabled:opacity-50 px-3 py-1.5 rounded-lg transition"
            >
              {working ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <RotateCcw size={11} />
              )}
              Restore
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

/*  Empty                                                              */

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
          : "Reviews will appear here as readers submit them."}
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

/*  Pagination                                                         */

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
