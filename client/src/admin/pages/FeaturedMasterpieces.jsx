import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Star,
  StarOff,
  Search,
  AlertCircle,
  X,
  Loader2,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Save,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Lock,
  Eye,
  RotateCcw,
  Award,
  Library as LibraryIcon,
} from "lucide-react";

import Loader from "../../components/ui/Loader";
import { featuredAPI } from "../../api/featuredApi";

/* ------------------------------------------------------------------ */
/*  Cover URL resolver — mirrors AllBooks BookThumb                   */
/* ------------------------------------------------------------------ */
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000/api";

const SERVER_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

function resolveCoverUrl(raw) {
  if (!raw || typeof raw !== "string") return "";
  const s = raw.trim();
  if (!s) return "";

  // Already absolute or data/blob
  if (/^(https?:\/\/|data:|blob:)/i.test(s)) return s;

  // Relative path → prefix server host
  return `${SERVER_BASE_URL}/${s.replace(/^\/+/, "")}`;
}

function pickCover(b) {
  if (!b) return "";
  const raw =
    b.cover_image ||
    b.coverImage ||
    b.cover ||
    b.coverUrl ||
    b.cover_url ||
    b.thumbnail ||
    b.coverPath ||
    b.cover_path ||
    b.image ||
    b.imageUrl ||
    "";
  return resolveCoverUrl(raw);
}

/* ------------------------------------------------------------------ */
/*  Auto-cover palettes                                                */
/* ------------------------------------------------------------------ */
const COVER_PALETTES = [
  {
    from: "#1A4A3E",
    to: "#0B241C",
    text: "#FAF7F0",
    muted: "rgba(250,247,240,0.6)",
    accent: "#D6B56D",
  },
  {
    from: "#8B6E32",
    to: "#4E3D1B",
    text: "#FAF7F0",
    muted: "rgba(250,247,240,0.55)",
    accent: "#D6B56D",
  },
  {
    from: "#2A5E4E",
    to: "#0F2B22",
    text: "#FAF7F0",
    muted: "rgba(250,247,240,0.55)",
    accent: "#D6B56D",
  },
  {
    from: "#B08F4A",
    to: "#6E5A2A",
    text: "#173F35",
    muted: "rgba(23,63,53,0.7)",
    accent: "#FAF7F0",
  },
  {
    from: "#3A6A55",
    to: "#152E24",
    text: "#FAF7F0",
    muted: "rgba(250,247,240,0.55)",
    accent: "#D6B56D",
  },
  {
    from: "#D6B56D",
    to: "#8E7538",
    text: "#173F35",
    muted: "rgba(23,63,53,0.7)",
    accent: "#173F35",
  },
];

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */
const PAGE_SIZE = 24;

const FILTERS = [
  { key: "all", label: "All Books", icon: LibraryIcon, short: "All" },
  { key: "featured", label: "Featured", icon: Star, short: "Featured" },
  { key: "available", label: "Not Featured", icon: StarOff, short: "Other" },
];

/* ================================================================== */
/*  PAGE                                                              */
/* ================================================================== */
export default function FeaturedMasterpieces() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [allBooks, setAllBooks] = useState([]);
  const [featuredMap, setFeaturedMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [dirty, setDirty] = useState(false);

  /* Debounce search */
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim().toLowerCase());
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  /* Fetch books + featured state */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [booksRes, featuredRes] = await Promise.allSettled([
          featuredAPI.listAdminBooks(),
          featuredAPI.getFeatured(),
        ]);
        if (cancelled) return;

        let books = [];
        if (booksRes.status === "fulfilled") {
          const raw = booksRes.value?.data || {};
          books =
            (Array.isArray(raw.books) && raw.books) ||
            (Array.isArray(raw.data) && raw.data) ||
            (Array.isArray(raw) && raw) ||
            [];
        } else {
          setError(booksRes.reason?.message || "Could not load books");
        }

        const featuredList =
          featuredRes.status === "fulfilled"
            ? (() => {
                const raw = featuredRes.value?.data || {};
                return (
                  (Array.isArray(raw.featured) && raw.featured) ||
                  (Array.isArray(raw.books) && raw.books) ||
                  (Array.isArray(raw.data) && raw.data) ||
                  (Array.isArray(raw) && raw) ||
                  []
                );
              })()
            : [];

        const fmap = {};
        featuredList.forEach((f, idx) => {
          const id = f.id || f._id || f.book_id || f.bookId;
          if (id) {
            fmap[id] = {
              featured: true,
              order: Number(f.featured_order ?? f.order ?? idx + 1),
            };
          }
        });

        setAllBooks(books);
        setFeaturedMap(fmap);
        setDirty(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  /* Toast auto-dismiss */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  /* Normalise */
  const normalisedBooks = useMemo(() => {
    return allBooks.map((b) => {
      const id = b.id || b._id;
      const status = String(b.status || "draft").toLowerCase();
      const f = featuredMap[id] || { featured: false, order: 0 };
      return {
        id,
        title: b.title || "Untitled",
        author: b.author || "Unknown",
        status,
        isPublished: status === "published",
        cover: pickCover(b),
        category: b.category_name || b.category?.name || b.category || "Book",
        featured: Boolean(f.featured),
        order: Number(f.order) || 0,
      };
    });
  }, [allBooks, featuredMap]);

  /* Filter + sort + paginate */
  const filtered = useMemo(() => {
    let list = [...normalisedBooks];
    if (filter === "featured") list = list.filter((b) => b.featured);
    else if (filter === "available") list = list.filter((b) => !b.featured);

    if (debouncedSearch) {
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(debouncedSearch) ||
          b.author.toLowerCase().includes(debouncedSearch) ||
          String(b.category).toLowerCase().includes(debouncedSearch),
      );
    }

    list.sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      if (a.featured && b.featured) return a.order - b.order;
      return String(a.title).localeCompare(String(b.title));
    });

    return list;
  }, [normalisedBooks, filter, debouncedSearch]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage],
  );

  const counts = useMemo(() => {
    const f = normalisedBooks.filter((b) => b.featured).length;
    return {
      all: normalisedBooks.length,
      featured: f,
      available: normalisedBooks.length - f,
    };
  }, [normalisedBooks]);

  /* Handlers */
  const toggleFeatured = (book) => {
    if (!book.isPublished) {
      setToast({
        type: "error",
        text: "Only published books can be featured.",
      });
      return;
    }
    setFeaturedMap((prev) => {
      const cur = prev[book.id] || { featured: false, order: 0 };
      return {
        ...prev,
        [book.id]: {
          featured: !cur.featured,
          order: cur.featured ? 0 : nextOrder(prev),
        },
      };
    });
    setDirty(true);
  };

  const setOrder = (book, value) => {
    const n = Math.max(1, Math.min(999, Number(value) || 1));
    setFeaturedMap((prev) => ({
      ...prev,
      [book.id]: { featured: true, order: n },
    }));
    setDirty(true);
  };

  const removeFeatured = (book) => {
    setFeaturedMap((prev) => {
      const next = { ...prev };
      delete next[book.id];
      return next;
    });
    setDirty(true);
  };

  const resetChanges = () => {
    setRefreshKey((k) => k + 1);
    setDirty(false);
  };

  const saveAllChanges = async () => {
    if (saving) return;

    const ops = [];
    Object.entries(featuredMap).forEach(([id, val]) => {
      if (val.featured) {
        ops.push({ id, featured: true, order: val.order });
      }
    });

    if (!ops.length) {
      setToast({ type: "error", text: "No changes to save." });
      return;
    }

    setSaving(true);
    try {
      await Promise.all(
        ops.map((op) =>
          featuredAPI.updateFeatured(op.id, {
            isFeatured: op.featured,
            featuredOrder: op.order,
          }),
        ),
      );
      setToast({
        type: "success",
        text: `Saved ${ops.length} ${
          ops.length === 1 ? "book" : "books"
        } to featured.`,
      });
      setDirty(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setToast({
        type: "error",
        text: err?.message || "Could not save featured changes.",
      });
    } finally {
      setSaving(false);
    }
  };

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
          <span className="relative grid w-10 h-10 rounded-2xl bg-gradient-to-br from-gold to-gold/70 place-items-center text-primary shrink-0 shadow-soft">
            <Award size={18} />
            <span className="absolute flex items-center justify-center w-3 h-3 rounded-full -top-1 -right-1 bg-primary ring-2 ring-cream">
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            </span>
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl tracking-tight font-display sm:text-3xl text-primary">
              Featured Masterpieces
            </h1>
            <p className="text-sm truncate text-primary/60">
              Pick which books appear on the homepage
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetChanges}
            disabled={loading || saving || !dirty}
            className="inline-flex items-center gap-2 bg-cream border border-primary/10 text-primary px-3.5 py-2.5 rounded-xl text-sm font-medium hover:bg-mint disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-soft"
          >
            <RotateCcw size={14} />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            type="button"
            onClick={saveAllChanges}
            disabled={saving || !dirty}
            className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 shadow-soft ${
              dirty && !saving
                ? "bg-primary text-cream hover:bg-primary/90 active:scale-[0.98]"
                : "bg-primary/40 text-cream/70 cursor-not-allowed"
            }`}
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span className="hidden sm:inline">Saving…</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span className="hidden sm:inline">
                  Save changes{dirty ? " •" : ""}
                </span>
                <span className="sm:hidden">Save{dirty ? " •" : ""}</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* ================= INFO BANNER ================= */}
      <div className="mb-5 flex items-start gap-2.5 bg-gradient-to-r from-gold/15 to-gold/5 border border-gold/40 rounded-2xl px-4 py-3">
        <span className="w-7 h-7 rounded-lg bg-gold/30 grid place-items-center shrink-0 mt-0.5">
          <Sparkles size={13} className="text-primary" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs leading-relaxed text-primary/80">
            <span className="font-semibold">Only published books</span> can be
            featured. Toggle{" "}
            <span className="font-semibold">"Show on Home"</span> and set order,
            then click <span className="font-semibold">Save changes</span>.
          </p>
        </div>
      </div>

      {/* ================= ERROR ================= */}
      {error && (
        <div className="flex items-start gap-2 px-4 py-3 mb-5 text-sm text-red-600 border border-red-200 bg-red-50 rounded-2xl">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium">Couldn't load data</p>
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

      {/* ================= TOOLBAR ================= */}
      <div className="p-3 mb-5 border bg-cream border-primary/10 rounded-2xl sm:p-4 shadow-soft">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {FILTERS.map((f) => {
            const Icon = f.icon;
            const on = filter === f.key;
            const count = counts[f.key] ?? 0;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => {
                  setFilter(f.key);
                  setPage(1);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                  on
                    ? "bg-primary text-cream shadow-soft scale-[1.02]"
                    : "bg-white border border-primary/10 text-primary/70 hover:bg-mint hover:text-primary hover:border-primary/20"
                }`}
              >
                <Icon size={13} />
                <span className="hidden sm:inline">{f.label}</span>
                <span className="sm:hidden">{f.short}</span>
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

        <div className="flex items-center gap-2.5 bg-white/70 border border-primary/10 rounded-xl px-3.5 focus-within:ring-2 focus-within:ring-gold/40 focus-within:border-gold/40 transition-all duration-200">
          <Search size={15} className="text-primary/40 shrink-0" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, author, or category…"
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
      </div>

      {/* ================= CONTENT ================= */}
      {loading ? (
        <div className="py-20 border bg-cream border-primary/10 rounded-2xl">
          <Loader center size={32} label="Loading books" />
        </div>
      ) : pageItems.length === 0 ? (
        <EmptyState
          filter={filter}
          hasSearch={Boolean(debouncedSearch)}
          onClear={() => {
            setSearch("");
            setFilter("all");
          }}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3">
            {pageItems.map((book) => (
              <BookFeaturedCard
                key={book.id}
                book={book}
                onToggle={() => toggleFeatured(book)}
                onSetOrder={(v) => setOrder(book, v)}
                onRemove={() => removeFeatured(book)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination
              page={safePage}
              totalPages={totalPages}
              onChange={setPage}
            />
          )}

          <p className="mt-4 text-xs text-center text-primary/40">
            {counts.featured} of {counts.all} books featured
            {dirty ? " · unsaved changes" : ""}
          </p>
        </>
      )}
    </div>
  );
}

/* ================================================================== */
/*  BOOK CARD — Small & Smooth                                        */
/* ================================================================== */
function BookFeaturedCard({ book, onToggle, onSetOrder, onRemove }) {
  const [imgFailed, setImgFailed] = useState(false);
  const disabled = !book.isPublished;
  const showOrder = book.featured;

  // Reset error state when cover changes
  useEffect(() => {
    setImgFailed(false);
  }, [book.cover]);

  return (
    <div
      className={`group relative bg-white rounded-xl overflow-hidden transition-all duration-300 ease-out ${
        book.featured
          ? "border-2 border-gold shadow-[0_8px_20px_-8px_rgba(214,181,109,0.55)]"
          : "border border-primary/10 hover:border-gold/40 hover:shadow-[0_8px_20px_-10px_rgba(23,63,53,0.25)] hover:-translate-y-0.5"
      }`}
    >
      {/* ---------- COVER (padding-bottom aspect — bulletproof) ---------- */}
      <div
        className="relative w-full overflow-hidden"
        style={{ paddingBottom: "140%" }}
      >
        <div className="absolute inset-0">
          {/* Layer 1: Auto-cover (always renders — fallback base) */}
          <AutoCover book={book} />

          {/* Layer 2: Real image on top (if available) */}
          {book.cover && !imgFailed && (
            <img
              src={book.cover}
              alt={`${book.title} cover`}
              loading="lazy"
              onError={() => {
                console.error("Cover failed:", book.cover);
                setImgFailed(true);
              }}
              className="absolute inset-0 object-cover w-full h-full"
            />
          )}
        </div>

        {/* Featured badge */}
        {book.featured && (
          <span className="absolute top-1.5 left-1.5 z-20 inline-flex items-center gap-0.5 bg-gold text-primary text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
            <Star size={8} className="fill-primary" />#{book.order || 1}
          </span>
        )}

        {/* Status badge */}
        <span
          className={`absolute top-1.5 right-1.5 z-20 inline-flex items-center gap-0.5 text-[8.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded backdrop-blur-sm ${
            book.isPublished
              ? "bg-emerald-500/95 text-white"
              : "bg-primary/85 text-cream"
          }`}
        >
          {book.isPublished ? (
            <>
              <Eye size={7} /> Live
            </>
          ) : (
            <>
              <Lock size={7} /> Draft
            </>
          )}
        </span>

        {/* Hover overlay */}
        {!disabled && (
          <div className="absolute inset-0 z-10 flex items-end justify-center pb-2 transition-opacity duration-300 opacity-0 group-hover:opacity-100 bg-gradient-to-t from-primary/75 via-primary/20 to-transparent">
            <button
              type="button"
              onClick={onToggle}
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-md shadow transition-all duration-200 active:scale-95 ${
                book.featured
                  ? "bg-white text-red-600 hover:bg-red-50"
                  : "bg-gold text-primary hover:bg-gold/90"
              }`}
            >
              {book.featured ? (
                <>
                  <StarOff size={10} /> Remove
                </>
              ) : (
                <>
                  <Star size={10} /> Feature
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* ---------- INFO ---------- */}
      <div className="p-2">
        <h3 className="font-display text-[11.5px] text-primary leading-tight line-clamp-2 min-h-[2.4em]">
          {book.title}
        </h3>
        <p className="text-[10px] text-primary/50 mt-0.5 truncate">
          {book.author}
        </p>

        {/* Toggle row */}
        <div className="mt-1.5 pt-1.5 border-t border-primary/5 flex items-center justify-between gap-1.5">
          <span
            className={`text-[9px] font-semibold uppercase tracking-wider transition-colors ${
              disabled
                ? "text-primary/30"
                : book.featured
                  ? "text-gold"
                  : "text-primary/40"
            }`}
          >
            {disabled ? "Locked" : book.featured ? "On" : "Off"}
          </span>

          <button
            type="button"
            onClick={onToggle}
            disabled={disabled}
            role="switch"
            aria-checked={book.featured}
            aria-label={
              book.featured ? "Remove from featured" : "Add to featured"
            }
            className={`relative inline-flex h-4 w-7 shrink-0 rounded-full transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
              book.featured ? "bg-gold" : "bg-primary/20 hover:bg-primary/30"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform duration-200 ${
                book.featured ? "translate-x-3" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Order strip */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-out ${
            showOrder ? "max-h-10 opacity-100 mt-1.5" : "max-h-0 opacity-0"
          }`}
        >
          <div className="flex items-center gap-0.5 bg-gold/15 border border-gold/40 rounded-md px-1 py-0.5">
            <button
              type="button"
              onClick={() => onSetOrder(Math.max(1, (book.order || 1) - 1))}
              aria-label="Decrease order"
              className="grid w-4 h-4 transition rounded place-items-center text-primary/60 hover:bg-white shrink-0"
            >
              <ArrowDown size={9} />
            </button>

            <input
              type="number"
              value={book.order || 1}
              onChange={(e) => onSetOrder(e.target.value)}
              min={1}
              max={999}
              className="w-full text-center text-[11px] font-bold text-primary bg-transparent outline-none tabular-nums"
            />

            <button
              type="button"
              onClick={() => onSetOrder((book.order || 1) + 1)}
              aria-label="Increase order"
              className="grid w-4 h-4 transition rounded place-items-center text-primary/60 hover:bg-white shrink-0"
            >
              <ArrowUp size={9} />
            </button>

            <button
              type="button"
              onClick={onRemove}
              aria-label="Remove from featured"
              className="w-4 h-4 rounded grid place-items-center text-red-500 hover:bg-red-50 transition shrink-0 ml-0.5"
            >
              <X size={9} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  AUTO COVER — fallback layer                                       */
/* ================================================================== */
function AutoCover({ book }) {
  const seed = hashString(`${book.title}-${book.id || ""}`);
  const p = COVER_PALETTES[seed % COVER_PALETTES.length];
  const initial = (book.author || book.title || "?").charAt(0).toUpperCase();

  return (
    <div
      className="absolute inset-0 flex flex-col justify-between p-2 pl-2.5"
      style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }}
    >
      <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-black/25" />
      <span className="absolute left-[3px] top-0 bottom-0 w-px bg-white/10" />
      <span className="absolute right-0 top-0 bottom-0 w-[2px] bg-white/10" />
      <span
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.25), transparent 55%)",
        }}
      />

      <p
        className="relative text-[7px] uppercase tracking-[0.12em] font-bold line-clamp-1"
        style={{ color: p.accent }}
      >
        {book.category}
      </p>

      <p
        className="relative font-display text-[10px] leading-[1.2] line-clamp-3"
        style={{ color: p.text }}
      >
        {book.title}
      </p>

      <div className="relative flex items-end justify-between gap-1">
        <p
          className="text-[7px] leading-tight line-clamp-2 flex-1 truncate"
          style={{ color: p.muted }}
        >
          {book.author}
        </p>
        <span
          className="w-3.5 h-3.5 rounded-full grid place-items-center text-[7px] font-bold shrink-0"
          style={{
            background: "rgba(255,255,255,0.15)",
            color: p.text,
          }}
        >
          {initial}
        </span>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  EMPTY STATE                                                       */
/* ================================================================== */
function EmptyState({ filter, hasSearch, onClear }) {
  const config = {
    featured: {
      icon: StarOff,
      title: "No featured books yet",
      desc: "Toggle 'Show on Home' on any published book to feature it.",
    },
    available: {
      icon: Check,
      title: "All books are featured",
      desc: "Every published book is already on the homepage.",
    },
    all: {
      icon: BookOpen,
      title: "No books yet",
      desc: "Upload books first from the All Books page.",
    },
  }[filter] || {
    icon: BookOpen,
    title: "Nothing to show",
    desc: "Try adjusting your search or filters.",
  };

  const Icon = config.icon;

  return (
    <div className="px-6 py-16 text-center border bg-cream border-primary/10 rounded-2xl">
      <div className="grid mx-auto mb-4 w-14 h-14 rounded-2xl bg-gold/25 place-items-center">
        <Icon size={22} className="text-primary/50" />
      </div>
      <h3 className="text-lg font-display text-primary">
        {hasSearch ? "No matches found" : config.title}
      </h3>
      <p className="max-w-sm mx-auto mt-1 text-sm text-primary/50">
        {hasSearch ? "Try a different search term." : config.desc}
      </p>

      {(hasSearch || filter !== "all") && (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 inline-flex items-center gap-2 bg-primary text-cream px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition shadow-soft"
        >
          <RotateCcw size={14} /> Clear filters
        </button>
      )}

      {filter === "all" && !hasSearch && (
        <Link
          to="/admin/books/upload"
          className="mt-5 inline-flex items-center gap-2 bg-primary text-cream px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition shadow-soft"
        >
          <BookOpen size={14} /> Upload a book
        </Link>
      )}
    </div>
  );
}

/* ================================================================== */
/*  PAGINATION                                                        */
/* ================================================================== */
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
      className="mt-6 flex items-center justify-center gap-1.5"
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
          className={`w-9 h-9 rounded-xl text-sm font-medium transition-all duration-200 ${
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

/* ================================================================== */
/*  HELPERS                                                           */
/* ================================================================== */
function nextOrder(featuredMap) {
  const orders = Object.values(featuredMap)
    .filter((v) => v.featured)
    .map((v) => Number(v.order) || 0);
  return orders.length ? Math.max(...orders) + 1 : 1;
}
