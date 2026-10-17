import { useState, useMemo, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  X,
  Star,
  BookOpen,
  Filter,
  ChevronDown,
  LayoutGrid,
  List,
  Heart,
  Bookmark,
  TrendingUp,
  Sparkles,
  Users,
  RefreshCw,
} from "lucide-react";

import { booksAPI, categoriesAPI } from "../../../api/adminApi";
import BookCardSkeleton from "../../../components/ui/BookCardSkeleton";
import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import RefreshBanner from "../../../components/ui/RefreshBanner";

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */
const SORTS = [
  { key: "popular", label: "Most Popular" },
  { key: "rating", label: "Top Rated" },
  { key: "title", label: "Title (A–Z)" },
  { key: "newest", label: "Newest" },
];

/* ------------------------------------------------------------------ */
/*  Cover URL resolver — handles absolute, relative, filename-only    */
/* ------------------------------------------------------------------ */

function resolveCoverUrl(raw) {
  if (!raw || typeof raw !== "string") return "";

  const s = raw.trim();
  if (!s) return "";

  if (/^(https?:\/\/|data:|blob:)/i.test(s)) {
    return s;
  }

  const base = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

  const host = base.replace(/\/api\/?$/, "");

  // Database path: uploads/covers/book.png
  if (s.startsWith("uploads/")) {
    return `${host}/${s}`;
  }

  // Root-relative path
  if (s.startsWith("/")) {
    return `${host}${s}`;
  }

  // Filename-only cover
  if (s.endsWith(".png")) {
    return `${host}/uploads/covers/${s}`;
  }

  return `${host}/uploads/books/${s}`;
}

function pickCover(b) {
  if (!b) return "";
  const raw =
    b.cover ||
    b.coverUrl ||
    b.cover_url ||
    b.coverPath ||
    b.cover_path ||
    b.coverImage ||
    b.cover_image ||
    b.thumbnail ||
    b.thumbnailUrl ||
    b.image ||
    b.imageUrl ||
    "";
  return resolveCoverUrl(raw);
}

/* ------------------------------------------------------------------ */
/*  Auto-cover palettes (theme-based)                                  */
/* ------------------------------------------------------------------ */
const COVER_PALETTES = [
  {
    from: "#1A4A3E",
    to: "#0B241C",
    text: "#FAF7F0",
    muted: "rgba(250,247,240,0.55)",
    accent: "#D6B56D",
  },
  {
    from: "#B08F4A",
    to: "#6E5A2A",
    text: "#FAF7F0",
    muted: "rgba(250,247,240,0.6)",
    accent: "#FAF7F0",
  },
  {
    from: "#2A5E4E",
    to: "#0F2B22",
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
  {
    from: "#3A6A55",
    to: "#152E24",
    text: "#FAF7F0",
    muted: "rgba(250,247,240,0.55)",
    accent: "#D6B56D",
  },
  {
    from: "#8B6E32",
    to: "#4E3D1B",
    text: "#FAF7F0",
    muted: "rgba(250,247,240,0.6)",
    accent: "#D6B56D",
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
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function ExploreBooks() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState(() => searchParams.get("q") || "");
  const [category, setCategory] = useState(
    () => searchParams.get("category") || searchParams.get("cat") || "All",
  );
  const [language, setLanguage] = useState(
    () => searchParams.get("lang") || searchParams.get("language") || "All",
  );
  const [sort, setSort] = useState(() => searchParams.get("sort") || "popular");
  const [view, setView] = useState("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Sync state when URL query params change (e.g. user clicks Navbar/Hero links)
  useEffect(() => {
    const q = searchParams.get("q") || "";
    const cat = searchParams.get("category") || searchParams.get("cat") || "All";
    const s = searchParams.get("sort") || "popular";
    const l = searchParams.get("lang") || searchParams.get("language") || "All";

    setQuery(q);
    setCategory(cat);
    setSort(s);
    setLanguage(l);
  }, [searchParams]);

  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (hasLoadedRef.current) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");
      try {
        const [booksRes, catsRes] = await Promise.allSettled([
          booksAPI.listPublic(),
          categoriesAPI.listPublic(),
        ]);

        if (cancelled) return;

        if (booksRes.status === "fulfilled") {
          const raw = booksRes.value?.data || {};
          const arr =
            (Array.isArray(raw.books) && raw.books) ||
            (Array.isArray(raw.data) && raw.data) ||
            (Array.isArray(raw) && raw) ||
            [];
          setBooks(arr);
        } else {
          setError(booksRes.reason?.message || "Could not load books");
        }

        if (catsRes.status === "fulfilled") {
          const raw = catsRes.value?.data || {};
          const arr =
            (Array.isArray(raw.categories) && raw.categories) ||
            (Array.isArray(raw.data) && raw.data) ||
            (Array.isArray(raw) && raw) ||
            [];
          setCategories(arr);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setIsRefreshing(false);
          hasLoadedRef.current = true;
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const categoryMap = useMemo(() => {
    const map = {};
    for (const c of categories) map[c.id ?? c._id] = c.name;
    return map;
  }, [categories]);

  const allBooks = useMemo(() => {
    return books.map((b) => ({
      id: b.id || b._id,
      title: b.title || "Untitled",
      author: b.author || "Unknown author",
      description: b.description || "",
      category: categoryMap[b.category_id ?? b.categoryId] || "Uncategorised",
      language: b.language || "English",
      rating: typeof b.rating === "number" ? b.rating : null,
      pages: b.pages || b.totalPages || null,
      cover: pickCover(b),
      publishedYear: b.published_year ?? b.publishedYear ?? null,
      createdAt: b.created_at || b.createdAt,
    }));
  }, [books, categoryMap]);

  const CATEGORIES = useMemo(() => {
    const names = [...new Set(allBooks.map((b) => b.category))].filter(Boolean);
    return ["All", ...names.sort()];
  }, [allBooks]);

  const LANGUAGES = useMemo(() => {
    const langs = [...new Set(allBooks.map((b) => b.language))].filter(Boolean);
    return ["All", ...langs.sort()];
  }, [allBooks]);

  const filtered = useMemo(() => {
    let list = [...allBooks];

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q),
      );
    }
    if (category !== "All") list = list.filter((b) => b.category === category);
    if (language !== "All") list = list.filter((b) => b.language === language);

    switch (sort) {
      case "rating":
        list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "title":
        list.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "newest":
        list.sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
        );
        break;
      default:
        list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    return list;
  }, [allBooks, query, category, language, sort]);

  const activeFilters =
    (category !== "All" ? 1 : 0) +
    (language !== "All" ? 1 : 0) +
    (query.trim() ? 1 : 0);

  const clearAll = () => {
    setQuery("");
    setCategory("All");
    setLanguage("All");
    setSort("popular");
    setSearchParams({});
  };

  const openReader = (book) => {
    navigate(`/read/${book.id}`, { state: { book } });
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* ================= PAGE HEADER ================= */}
      <section className="relative overflow-hidden border-b border-primary/10">
        <div className="absolute rounded-full -top-32 -right-32 w-96 h-96 bg-gold/15 blur-3xl" />
        <div className="absolute rounded-full top-20 -left-24 w-72 h-72 bg-mint blur-3xl" />

        <div className="relative px-5 py-10 mx-auto max-w-7xl md:py-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-2 bg-mint text-primary text-xs font-medium px-3 py-1.5 rounded-full border border-primary/5">
                <Sparkles size={12} className="text-gold" />
                {allBooks.length > 0 ? `${allBooks.length}+` : "Curated"} titles
              </span>

              <h1 className="mt-4 text-3xl tracking-tight font-display md:text-4xl lg:text-5xl text-primary">
                Explore our <span className="text-gold">library.</span>
              </h1>

              <p className="max-w-lg mt-2 text-sm text-primary/60 md:text-base">
                Books, PDFs, and study notes — carefully curated for students,
                readers, and learners. Filter by category, language, or search.
              </p>
            </div>

            <div className="items-center hidden gap-6 md:flex">
              {[
                {
                  k: allBooks.length > 0 ? `${allBooks.length}+` : "—",
                  l: "Titles",
                  icon: BookOpen,
                },
                { k: "4.8", l: "Avg Rating", icon: Star },
                { k: "25K+", l: "Readers", icon: Users },
              ].map(({ k, l, icon: Icon }) => (
                <div key={l}>
                  <div className="flex items-center gap-1.5 text-primary/40">
                    <Icon size={12} />
                    <p className="text-[10px] uppercase tracking-wider">{l}</p>
                  </div>
                  <p className="font-display text-xl text-primary mt-0.5">
                    {k}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= MAIN ================= */}
      <div className="max-w-7xl mx-auto px-5 py-8 grid lg:grid-cols-[260px_1fr] gap-8">
        <aside className="hidden lg:block">
          <FilterSidebar
            categories={CATEGORIES}
            category={category}
            setCategory={setCategory}
            languages={LANGUAGES}
            language={language}
            setLanguage={setLanguage}
          />
        </aside>

        <div className="min-w-0">
          {/* Toolbar */}
          <div className="flex flex-col items-stretch gap-3 mb-6 sm:flex-row sm:items-center">
            <div className="flex-1 flex items-center gap-2.5 bg-white border border-primary/10 rounded-2xl px-4 focus-within:ring-2 focus-within:ring-gold/40 focus-within:border-gold/40 transition">
              <Search size={16} className="text-primary/40 shrink-0" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, author, or category…"
                aria-label="Search books"
                className="w-full py-3 text-sm bg-transparent outline-none text-primary placeholder:text-primary/40"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="transition text-primary/40 hover:text-primary"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setRefreshKey((k) => k + 1)}
              disabled={loading || isRefreshing}
              aria-label="Refresh library"
              className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition bg-white border border-primary/10 text-primary rounded-2xl hover:bg-mint disabled:opacity-60 shadow-soft"
            >
              <RefreshCw
                size={15}
                className={isRefreshing || loading ? "animate-spin text-gold" : ""}
              />
              <span className="hidden sm:inline text-xs font-semibold">
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="relative inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition bg-white border lg:hidden border-primary/10 text-primary rounded-2xl hover:bg-mint"
            >
              <SlidersHorizontal size={15} />
              Filters
              {activeFilters > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gold text-primary text-[10px] font-bold grid place-items-center">
                  {activeFilters}
                </span>
              )}
            </button>

            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Sort books"
                className="w-full px-4 py-3 text-sm bg-white border outline-none appearance-none cursor-pointer sm:w-44 border-primary/10 text-primary rounded-2xl pr-9 focus:ring-2 focus:ring-gold/40"
              >
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute -translate-y-1/2 pointer-events-none right-3 top-1/2 text-primary/40"
              />
            </div>

            <div className="hidden p-1 bg-white border md:inline-flex border-primary/10 rounded-2xl">
              {[
                { k: "grid", Icon: LayoutGrid },
                { k: "list", Icon: List },
              ].map(({ k, Icon }) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setView(k)}
                  aria-label={`${k} view`}
                  aria-pressed={view === k}
                  className={`w-9 h-9 rounded-xl grid place-items-center transition ${
                    view === k
                      ? "bg-primary text-cream"
                      : "text-primary/50 hover:text-primary"
                  }`}
                >
                  <Icon size={15} />
                </button>
              ))}
            </div>
          </div>

          {/* Chips */}
          {activeFilters > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-5">
              {query.trim() && (
                <Chip label={`"${query}"`} onClear={() => setQuery("")} />
              )}
              {category !== "All" && (
                <Chip label={category} onClear={() => setCategory("All")} />
              )}
              {language !== "All" && (
                <Chip label={language} onClear={() => setLanguage("All")} />
              )}
              <button
                onClick={clearAll}
                className="text-xs underline text-primary/50 hover:text-primary underline-offset-4"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Background Refreshing Notice */}
          {isRefreshing && (
            <div className="mb-4">
              <RefreshBanner message="Updating library catalog in background..." />
            </div>
          )}

          {/* Count */}
          {!loading && !error && books.length > 0 && (
            <p className="mb-5 text-sm text-primary/60">
              <span className="text-base font-display text-primary">
                {filtered.length}
              </span>{" "}
              {filtered.length === 1 ? "book" : "books"} found
            </p>
          )}

          {/* Background refresh error banner (when books already exist) */}
          {error && books.length > 0 && (
            <ErrorState
              compact
              title="Could not refresh library"
              message={error}
              onRetry={() => setRefreshKey((k) => k + 1)}
              retrying={isRefreshing}
              className="mb-5"
            />
          )}

          {/* Initial load error (when no books exist) */}
          {error && books.length === 0 && !loading && (
            <ErrorState
              title="Failed to load library catalog"
              message={error}
              onRetry={() => setRefreshKey((k) => k + 1)}
              retrying={loading}
              className="my-8"
            />
          )}

          {/* Initial Loading Skeletons */}
          {loading && books.length === 0 && (
            <BookCardSkeleton view={view} count={8} />
          )}

          {/* Content */}
          {!loading && books.length > 0 && (
            <>
              {filtered.length === 0 ? (
                <EmptyState
                  icon={Search}
                  title={activeFilters > 0 ? "No books match your filters" : "No books in library"}
                  description={
                    activeFilters > 0
                      ? "Try adjusting your search query, or clear selected categories and language filters."
                      : "No titles found matching your search. Check back soon!"
                  }
                  actionLabel={activeFilters > 0 ? "Clear all filters" : "Refresh library"}
                  onAction={activeFilters > 0 ? clearAll : () => setRefreshKey((k) => k + 1)}
                  className="my-6"
                />
              ) : view === "grid" ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 md:gap-5">
                  {filtered.map((b) => (
                    <BookCard
                      key={b.id}
                      book={b}
                      onOpen={() => openReader(b)}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map((b) => (
                    <BookRow key={b.id} book={b} onOpen={() => openReader(b)} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Genuinely empty library */}
          {!loading && !error && books.length === 0 && (
            <EmptyState
              icon={BookOpen}
              title="Library catalog is empty"
              description="No books have been published yet. Please check back soon or upload new titles."
              actionLabel="Refresh library"
              onAction={() => setRefreshKey((k) => k + 1)}
              className="my-8"
            />
          )}
        </div>
      </div>

      <MobileFilterDrawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        categories={CATEGORIES}
        category={category}
        setCategory={setCategory}
        languages={LANGUAGES}
        language={language}
        setLanguage={setLanguage}
        onClear={clearAll}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  FilterSidebar                                                      */
/* ------------------------------------------------------------------ */
function FilterSidebar({
  categories,
  category,
  setCategory,
  languages,
  language,
  setLanguage,
}) {
  return (
    <div className="sticky space-y-6 top-24">
      <div className="p-5 bg-white border border-primary/10 rounded-3xl">
        <div className="flex items-center gap-2 text-primary">
          <Filter size={15} className="text-gold" />
          <h3 className="text-base font-display">Categories</h3>
        </div>
        <ul className="mt-4 space-y-1 overflow-y-auto max-h-72">
          {categories.map((c) => {
            const on = category === c;
            return (
              <li key={c}>
                <button
                  onClick={() => setCategory(c)}
                  className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-colors ${
                    on
                      ? "bg-mint text-primary font-medium"
                      : "text-primary/70 hover:bg-mint/60 hover:text-primary"
                  }`}
                >
                  {c}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="p-5 bg-white border border-primary/10 rounded-3xl">
        <h3 className="text-base font-display text-primary">Language</h3>
        <ul className="mt-4 space-y-1">
          {languages.map((l) => {
            const on = language === l;
            return (
              <li key={l}>
                <button
                  onClick={() => setLanguage(l)}
                  className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-colors ${
                    on
                      ? "bg-mint text-primary font-medium"
                      : "text-primary/70 hover:bg-mint/60 hover:text-primary"
                  }`}
                >
                  {l}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="relative p-5 overflow-hidden rounded-3xl bg-primary">
        <div className="absolute w-24 h-24 rounded-full -top-6 -right-6 bg-gold/30 blur-2xl" />
        <div className="relative">
          <div className="grid w-9 h-9 rounded-xl bg-gold text-primary place-items-center">
            <TrendingUp size={15} />
          </div>
          <p className="mt-3 text-base leading-tight font-display text-cream">
            Trending this week
          </p>
          <p className="mt-1 text-xs text-cream/60">120+ new titles added</p>
          <Link
            to="/categories"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-gold hover:underline"
          >
            Browse all →
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Chip                                                               */
/* ------------------------------------------------------------------ */
function Chip({ label, onClear }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-mint text-primary text-xs font-medium pl-3 pr-1.5 py-1.5 rounded-full">
      {label}
      <button
        type="button"
        onClick={onClear}
        aria-label={`Remove filter ${label}`}
        className="grid w-5 h-5 transition rounded-full place-items-center hover:bg-primary/10"
      >
        <X size={11} />
      </button>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  BookCover — image OR premium auto-cover                            */
/* ------------------------------------------------------------------ */
function BookCover({ book, className = "" }) {
  const [errored, setErrored] = useState(false);
  const src = resolveCoverUrl(book.cover);

  if (src && !errored) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <img
          src={src}
          alt={`${book.title} cover`}
          loading="lazy"
          onError={() => setErrored(true)}
          className="object-cover w-full h-full"
        />
        <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-primary/10" />
      </div>
    );
  }

  /* ---------- Auto-generated book cover ---------- */
  const seed = hashString(`${book.title}-${book.id || ""}`);
  const p = COVER_PALETTES[seed % COVER_PALETTES.length];

  const initials = (book.author || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }}
    >
      {/* Soft light + shade */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 25% 15%, rgba(255,255,255,0.25), transparent 45%), radial-gradient(circle at 85% 90%, rgba(0,0,0,0.3), transparent 55%)",
        }}
      />

      {/* Spine */}
      <div className="absolute left-0 top-0 bottom-0 w-[6px] bg-black/25" />
      <div className="absolute left-[6px] top-0 bottom-0 w-px bg-white/10" />

      {/* Page edge */}
      <div className="absolute right-0 top-0 bottom-0 w-[3px] bg-white/10" />

      {/* Content */}
      <div className="relative flex flex-col justify-between h-full p-3 pl-4">
        <p
          className="text-[8.5px] uppercase tracking-[0.15em] font-semibold line-clamp-1"
          style={{ color: p.accent }}
        >
          {book.category || "Book"}
        </p>

        <div className="my-auto">
          <p
            className="font-display text-[13px] leading-[1.15] line-clamp-3"
            style={{ color: p.text }}
          >
            {book.title}
          </p>
          <div
            className="mt-2 h-[2px] w-8 rounded-full"
            style={{ background: p.accent }}
          />
        </div>

        <div className="flex items-end justify-between gap-2">
          <p
            className="text-[9px] leading-tight line-clamp-2"
            style={{ color: p.muted }}
          >
            {book.author}
          </p>
          {initials && (
            <span
              className="w-6 h-6 rounded-full grid place-items-center text-[9px] font-bold shrink-0"
              style={{ background: "rgba(255,255,255,0.12)", color: p.text }}
            >
              {initials}
            </span>
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-black/25" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  BookCard (grid)                                                    */
/* ------------------------------------------------------------------ */
function BookCard({ book, onOpen }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <article
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="group bg-white rounded-3xl border border-primary/5 p-2.5 hover:shadow-soft hover:-translate-y-0.5 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
    >
      <div className="relative">
        <BookCover book={book} className="w-full aspect-[5/7] rounded-2xl" />

        {book.rating != null && (
          <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 bg-cream/95 backdrop-blur-sm rounded-lg px-2 py-1">
            <Star size={10} className="text-gold fill-gold" />
            <span className="text-[10px] font-medium text-primary">
              {book.rating}
            </span>
          </span>
        )}

        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLiked(!liked);
            }}
            aria-label={liked ? "Unlike" : "Like"}
            className={`w-8 h-8 rounded-lg backdrop-blur-sm grid place-items-center transition ${
              liked
                ? "bg-gold text-primary"
                : "bg-cream/95 text-primary/70 hover:bg-cream"
            }`}
          >
            <Heart size={13} className={liked ? "fill-primary" : ""} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSaved(!saved);
            }}
            aria-label={saved ? "Remove bookmark" : "Bookmark"}
            className={`w-8 h-8 rounded-lg backdrop-blur-sm grid place-items-center transition ${
              saved
                ? "bg-primary text-gold"
                : "bg-cream/95 text-primary/70 hover:bg-cream"
            }`}
          >
            <Bookmark size={13} className={saved ? "fill-gold" : ""} />
          </button>
        </div>

        <span className="absolute bottom-2.5 left-2.5 inline-flex items-center bg-primary text-cream text-[10px] font-medium px-2 py-0.5 rounded-md">
          {book.language}
        </span>
      </div>

      <div className="px-1.5 pt-3 pb-1">
        <h3 className="text-sm leading-tight font-display text-primary line-clamp-1">
          {book.title}
        </h3>
        <p className="text-[11px] text-primary/50 mt-1 line-clamp-1">
          {book.author}
        </p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] uppercase tracking-wider text-primary/40 truncate">
            {book.category}
          </span>
          <span className="text-[11px] font-medium text-gold group-hover:underline shrink-0">
            Read →
          </span>
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/*  BookRow (list)                                                     */
/* ------------------------------------------------------------------ */
function BookRow({ book, onOpen }) {
  return (
    <article
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="flex gap-4 p-3 transition bg-white border cursor-pointer group rounded-2xl border-primary/5 hover:shadow-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
    >
      <BookCover
        book={book}
        className="w-16 h-22 sm:w-20 sm:h-28 rounded-xl shrink-0"
      />
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm leading-tight font-display sm:text-base text-primary line-clamp-1">
              {book.title}
            </h3>
            <p className="mt-1 text-xs text-primary/50">{book.author}</p>
          </div>
          {book.rating != null && (
            <span className="inline-flex items-center gap-1 bg-mint text-primary text-[10px] font-medium px-2 py-1 rounded-lg shrink-0">
              <Star size={10} className="text-gold fill-gold" />
              {book.rating}
            </span>
          )}
        </div>

        {book.description && (
          <p className="hidden mt-2 text-xs sm:block text-primary/60 line-clamp-2">
            {book.description}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 pt-3 mt-auto">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-primary/40">
            <span className="truncate">{book.category}</span>
            <span className="w-1 h-1 rounded-full bg-primary/20" />
            <span>{book.language}</span>
            {book.pages && (
              <>
                <span className="w-1 h-1 rounded-full bg-primary/20" />
                <span>{book.pages} pages</span>
              </>
            )}
          </div>
          <span className="text-xs font-medium text-gold group-hover:underline shrink-0">
            Read →
          </span>
        </div>
      </div>
    </article>
  );
}



/* ------------------------------------------------------------------ */
/*  MobileFilterDrawer                                                 */
/* ------------------------------------------------------------------ */
function MobileFilterDrawer({
  open,
  onClose,
  categories,
  category,
  setCategory,
  languages,
  language,
  setLanguage,
  onClear,
}) {
  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`lg:hidden fixed inset-0 z-[70] bg-primary/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        className={`lg:hidden fixed bottom-0 inset-x-0 z-[80] bg-cream rounded-t-3xl
          max-h-[85vh] flex flex-col transition-transform duration-300 ease-out
          ${open ? "translate-y-0" : "translate-y-full"}`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-primary/10 shrink-0">
          <h2 className="text-lg font-display text-primary">Filters</h2>
          <button
            onClick={onClose}
            aria-label="Close filters"
            className="grid w-10 h-10 transition bg-white border rounded-xl border-primary/10 place-items-center text-primary hover:bg-mint"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 px-5 py-4 space-y-6 overflow-y-auto">
          <div>
            <h3 className="mb-3 text-sm font-display text-primary">
              Categories
            </h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    category === c
                      ? "bg-primary text-cream"
                      : "bg-white border border-primary/10 text-primary/70 hover:bg-mint"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-display text-primary">Language</h3>
            <div className="flex flex-wrap gap-2">
              {languages.map((l) => (
                <button
                  key={l}
                  onClick={() => setLanguage(l)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    language === l
                      ? "bg-primary text-cream"
                      : "bg-white border border-primary/10 text-primary/70 hover:bg-mint"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 px-5 py-4 border-t border-primary/10 bg-cream shrink-0">
          <button
            onClick={onClear}
            className="px-4 py-3 text-sm transition bg-white border text-primary rounded-xl border-primary/15 hover:bg-mint"
          >
            Clear all
          </button>
          <button
            onClick={onClose}
            className="px-4 py-3 text-sm font-medium transition bg-primary text-cream rounded-xl hover:bg-primary/90 shadow-soft"
          >
            Show results
          </button>
        </div>
      </aside>
    </>
  );
}
