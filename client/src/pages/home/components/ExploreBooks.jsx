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
  Bookmark,
  TrendingUp,
  Sparkles,
  Users,
  RefreshCw,
  Clock,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

import { booksAPI, categoriesAPI } from "../../../api/adminApi";
import { resolveCoverUrl } from "../../../utils/urlUtils";
import BookCardSkeleton from "../../../components/ui/BookCardSkeleton";
import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import RefreshBanner from "../../../components/ui/RefreshBanner";
import BookDetailModal from "../../../components/ui/BookDetailModal";
import { useToast } from "../../../context/ToastContext";
import {
  getRecentlyViewed,
  clearRecentlyViewed,
  isFavorite,
  toggleFavorite,
  addRecentlyViewed,
} from "../../../utils/libraryStorage";

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */
const SORTS = [
  { key: "popular", label: "Most Popular" },
  { key: "rating", label: "Top Rated" },
  { key: "title", label: "Title (A–Z)" },
  { key: "newest", label: "Newest" },
];

const BOOKS_PER_PAGE = 12;


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
/*  Main Component                                                     */
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
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [page, setPage] = useState(1);

  // Selected book for details modal
  const [selectedBook, setSelectedBook] = useState(null);

  // Sync state when URL query params change
  useEffect(() => {
    const q = searchParams.get("q") || "";
    const cat =
      searchParams.get("category") || searchParams.get("cat") || "All";
    const s = searchParams.get("sort") || "popular";
    const l = searchParams.get("lang") || searchParams.get("language") || "All";

    setQuery(q);
    setCategory(cat);
    setSort(s);
    setLanguage(l);
    setPage(1);
  }, [searchParams]);

  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [recentBooks, setRecentBooks] = useState([]);
  const hasLoadedRef = useRef(false);

  // Load recently viewed
  useEffect(() => {
    setRecentBooks(getRecentlyViewed());
    const onLibraryChange = (e) => {
      if (e.detail?.type === "recent") setRecentBooks(e.detail.data || []);
    };
    window.addEventListener("ved-library-change", onLibraryChange);
    return () =>
      window.removeEventListener("ved-library-change", onLibraryChange);
  }, []);

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

  // Handle direct ?book=<id> in query params
  useEffect(() => {
    const bookIdParam = searchParams.get("book");
    if (bookIdParam && allBooks.length > 0) {
      const found = allBooks.find((b) => b.id === bookIdParam);
      if (found) setSelectedBook(found);
    }
  }, [searchParams, allBooks]);

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

    if (favoritesOnly) {
      list = list.filter((b) => isFavorite(b.id));
    }

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
  }, [allBooks, query, category, language, sort, favoritesOnly]);

  // Paginated books
  const totalPages = Math.max(1, Math.ceil(filtered.length / BOOKS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pagedBooks = useMemo(() => {
    const start = (safePage - 1) * BOOKS_PER_PAGE;
    return filtered.slice(start, start + BOOKS_PER_PAGE);
  }, [filtered, safePage]);

  const activeFilters =
    (category !== "All" ? 1 : 0) +
    (language !== "All" ? 1 : 0) +
    (query.trim() ? 1 : 0) +
    (favoritesOnly ? 1 : 0);

  const clearAll = () => {
    setQuery("");
    setCategory("All");
    setLanguage("All");
    setSort("popular");
    setFavoritesOnly(false);
    setPage(1);
    setSearchParams({});
  };

  const handleOpenBook = (book) => {
    setSelectedBook(book);
  };

  const handleDirectRead = (book, e) => {
    e.stopPropagation();
    addRecentlyViewed(book);
    navigate(`/read/${book.id}`, { state: { book } });
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* ================= PAGE HEADER ================= */}
      <section className="relative overflow-hidden border-b border-primary/10">
        <div className="absolute rounded-full pointer-events-none -top-32 -right-32 w-96 h-96 bg-gold/15 blur-3xl" />
        <div className="absolute rounded-full pointer-events-none top-20 -left-24 w-72 h-72 bg-mint blur-3xl" />

        <div className="relative px-5 py-10 mx-auto max-w-7xl md:py-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-2 bg-mint text-primary text-xs font-semibold px-3 py-1.5 rounded-full border border-primary/10">
                <Sparkles size={12} className="text-gold" />
                {allBooks.length > 0
                  ? `${allBooks.length}+ titles curated`
                  : "Digital Library Catalog"}
              </span>

              <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl font-display text-primary">
                Explore the <span className="text-gold">sanctuary.</span>
              </h1>

              <p className="max-w-xl mt-2 text-sm leading-relaxed text-primary/70 md:text-base">
                Search classical sacred texts, philosophy, literature, and study
                notes. Read online or save titles to your personal shelf.
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
                  <p className="font-display text-xl text-primary mt-0.5 font-bold">
                    {k}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= MAIN CONTENT ================= */}
      <div className="max-w-7xl mx-auto px-5 py-8 grid lg:grid-cols-[260px_1fr] gap-8">
        {/* Left Sidebar Filter */}
        <aside className="hidden lg:block">
          <FilterSidebar
            categories={CATEGORIES}
            category={category}
            setCategory={(c) => {
              setCategory(c);
              setPage(1);
            }}
            languages={LANGUAGES}
            language={language}
            setLanguage={(l) => {
              setLanguage(l);
              setPage(1);
            }}
            favoritesOnly={favoritesOnly}
            setFavoritesOnly={(f) => {
              setFavoritesOnly(f);
              setPage(1);
            }}
          />
        </aside>

        {/* Right Content Area */}
        <div className="min-w-0">
          {/* Toolbar */}
          <div className="flex flex-col items-stretch gap-3 mb-6 sm:flex-row sm:items-center">
            {/* Search Input */}
            <div className="flex-1 flex items-center gap-2.5 bg-white border border-primary/15 rounded-2xl px-4 focus-within:ring-2 focus-within:ring-gold/40 focus-within:border-gold/40 transition shadow-soft">
              <Search size={16} className="text-primary/40 shrink-0" />
              <input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by title, author, or category…"
                aria-label="Search books"
                className="w-full py-3 text-sm bg-transparent outline-none text-primary placeholder:text-primary/40"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setPage(1);
                  }}
                  aria-label="Clear search"
                  className="transition text-primary/40 hover:text-primary"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => setRefreshKey((k) => k + 1)}
              disabled={loading || isRefreshing}
              aria-label="Refresh library"
              className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition bg-white border border-primary/15 text-primary rounded-2xl hover:bg-mint disabled:opacity-60 shadow-soft"
            >
              <RefreshCw
                size={15}
                className={
                  isRefreshing || loading ? "animate-spin text-gold" : ""
                }
              />
              <span className="hidden text-xs sm:inline">
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </span>
            </button>

            {/* Mobile Filter Toggle */}
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="relative inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition bg-white border lg:hidden border-primary/15 text-primary rounded-2xl hover:bg-mint"
            >
              <SlidersHorizontal size={15} />
              <span>Filters</span>
              {activeFilters > 0 && (
                <span className="w-5 h-5 rounded-full bg-gold text-primary text-[10px] font-bold grid place-items-center">
                  {activeFilters}
                </span>
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Sort books"
                className="w-full px-4 py-3 text-sm font-medium bg-white border outline-none appearance-none cursor-pointer sm:w-44 border-primary/15 text-primary rounded-2xl pr-9 focus:ring-2 focus:ring-gold/40 shadow-soft"
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

            {/* View Mode Switcher */}
            <div className="hidden p-1 bg-white border md:inline-flex border-primary/15 rounded-2xl shadow-soft">
              {[
                { k: "grid", Icon: LayoutGrid, label: "Grid view" },
                { k: "list", Icon: List, label: "List view" },
              ].map(({ k, Icon, label }) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setView(k)}
                  aria-label={label}
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

          {/* Recently Viewed Shelf */}
          {/* {recentBooks.length > 0 && !query.trim() && category === "All" && !favoritesOnly && (
            <section
              aria-label="Recently viewed books"
              className="p-4 mb-6 transition-all border sm:p-5 bg-white/70 rounded-3xl border-primary/10 shadow-soft backdrop-blur-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock size={15} className="text-gold" />
                  <h2 className="text-xs font-bold tracking-wider uppercase font-display text-primary">
                    Jump Back In — Recently Viewed
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    clearRecentlyViewed();
                    setRecentBooks([]);
                  }}
                  className="text-[11px] text-primary/50 hover:text-red-600 transition"
                >
                  Clear history
                </button>
              </div>
              <div className="flex gap-3 pb-1 overflow-x-auto no-scrollbar">
                {recentBooks.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      const found = books.find((x) => (x.id || x._id) === b.id) || b;
                      handleOpenBook(found);
                    }}
                    className="shrink-0 flex items-center gap-2.5 p-2 rounded-2xl bg-cream hover:bg-mint border border-primary/10 text-left transition max-w-[210px] group"
                  >
                    <div className="w-10 overflow-hidden rounded-lg h-14 bg-primary shrink-0 shadow-soft">
                      {b.cover ? (
                        <img
                          src={resolveCoverUrl(b.cover)}
                          alt=""
                          className="object-cover w-full h-full transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="grid w-full h-full text-xs font-bold place-items-center text-gold font-display">
                          {b.title?.charAt(0) || "V"}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 pr-1">
                      <p className="text-xs font-bold leading-tight truncate font-display text-primary group-hover:text-primary-light">
                        {b.title}
                      </p>
                      <p className="text-[10px] text-primary/60 truncate mt-0.5">
                        {b.author}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )} */}

          {/* Active Filter Chips */}
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
              {favoritesOnly && (
                <Chip
                  label="Saved Bookmarks"
                  onClear={() => setFavoritesOnly(false)}
                />
              )}
              <button
                type="button"
                onClick={clearAll}
                className="text-xs font-medium underline text-primary/60 hover:text-primary underline-offset-4"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* Background Refreshing Notice */}
          {isRefreshing && (
            <div className="mb-4">
              <RefreshBanner message="Updating library catalog in background..." />
            </div>
          )}

          {/* Count bar */}
          {!loading && !error && (
            <div className="flex items-center justify-between mb-5 text-sm text-primary/60">
              <p>
                Showing{" "}
                <span className="font-bold text-primary">
                  {filtered.length}
                </span>{" "}
                {filtered.length === 1 ? "book" : "books"}
              </p>
              {totalPages > 1 && (
                <p className="text-xs">
                  Page{" "}
                  <span className="font-semibold text-primary">{safePage}</span>{" "}
                  of {totalPages}
                </p>
              )}
            </div>
          )}

          {/* Error banners */}
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

          {error && books.length === 0 && !loading && (
            <ErrorState
              title="Failed to load library catalog"
              message={error}
              onRetry={() => setRefreshKey((k) => k + 1)}
              retrying={loading}
              className="my-8"
            />
          )}

          {/* Loading Skeletons */}
          {loading && books.length === 0 && (
            <BookCardSkeleton view={view} count={8} />
          )}

          {/* Book Cards Grid / List */}
          {!loading && books.length > 0 && (
            <>
              {filtered.length === 0 ? (
                <EmptyState
                  icon={Search}
                  title={
                    activeFilters > 0
                      ? "No books match your filters"
                      : "No books in library"
                  }
                  description={
                    activeFilters > 0
                      ? "Try adjusting your search query, or clear selected categories and filters."
                      : "No titles found matching your search. Check back soon!"
                  }
                  actionLabel={
                    activeFilters > 0 ? "Clear all filters" : "Refresh library"
                  }
                  onAction={
                    activeFilters > 0
                      ? clearAll
                      : () => setRefreshKey((k) => k + 1)
                  }
                  className="my-6"
                />
              ) : view === "grid" ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 md:gap-5">
                  {pagedBooks.map((b) => (
                    <BookCard
                      key={b.id}
                      book={b}
                      onOpen={() => handleOpenBook(b)}
                      onDirectRead={(e) => handleDirectRead(b, e)}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {pagedBooks.map((b) => (
                    <BookRow
                      key={b.id}
                      book={b}
                      onOpen={() => handleOpenBook(b)}
                      onDirectRead={(e) => handleDirectRead(b, e)}
                    />
                  ))}
                </div>
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-6 mt-10 border-t border-primary/10">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    aria-label="Previous page"
                    className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-primary/15 text-primary hover:bg-mint disabled:opacity-40 transition shadow-soft"
                  >
                    <ChevronLeft size={14} />
                    <span>Prev</span>
                  </button>

                  <div className="flex items-center gap-1 px-2">
                    {Array.from({ length: totalPages }).map((_, i) => {
                      const pNum = i + 1;
                      const isCurrent = pNum === safePage;
                      // Display sensible subset on large pagination
                      if (
                        totalPages > 6 &&
                        Math.abs(pNum - safePage) > 2 &&
                        pNum !== 1 &&
                        pNum !== totalPages
                      ) {
                        return null;
                      }
                      return (
                        <button
                          key={pNum}
                          type="button"
                          onClick={() => setPage(pNum)}
                          className={`w-8 h-8 rounded-xl text-xs font-semibold transition ${
                            isCurrent
                              ? "bg-primary text-cream shadow-soft"
                              : "bg-white text-primary/70 hover:bg-mint border border-primary/10"
                          }`}
                        >
                          {pNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    aria-label="Next page"
                    className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-primary/15 text-primary hover:bg-mint disabled:opacity-40 transition shadow-soft"
                  >
                    <span>Next</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </>
          )}

          {/* Genuinely empty library */}
          {!loading && !error && books.length === 0 && (
            <EmptyState
              icon={BookOpen}
              title="Library catalog is empty"
              description="No books have been published yet. Check back soon as new editions are added!"
              actionLabel="Refresh library"
              onAction={() => setRefreshKey((k) => k + 1)}
              className="my-8"
            />
          )}
        </div>
      </div>

      {/* Book Detail Modal */}
      <BookDetailModal
        book={selectedBook}
        isOpen={Boolean(selectedBook)}
        onClose={() => setSelectedBook(null)}
      />

      {/* Mobile Filters Drawer */}
      <MobileFilterDrawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        categories={CATEGORIES}
        category={category}
        setCategory={(c) => {
          setCategory(c);
          setPage(1);
        }}
        languages={LANGUAGES}
        language={language}
        setLanguage={(l) => {
          setLanguage(l);
          setPage(1);
        }}
        favoritesOnly={favoritesOnly}
        setFavoritesOnly={(f) => {
          setFavoritesOnly(f);
          setPage(1);
        }}
        onClear={clearAll}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  FilterSidebar (Desktop)                                            */
/* ------------------------------------------------------------------ */
function FilterSidebar({
  categories,
  category,
  setCategory,
  languages,
  language,
  setLanguage,
  favoritesOnly,
  setFavoritesOnly,
}) {
  return (
    <div className="sticky space-y-6 top-24">
      {/* Quick Shelf Filter */}
      <div className="p-4 bg-white border border-primary/15 rounded-3xl shadow-soft">
        <button
          type="button"
          onClick={() => setFavoritesOnly(!favoritesOnly)}
          className={`w-full flex items-center justify-between p-2.5 rounded-xl text-sm font-semibold transition ${
            favoritesOnly
              ? "bg-primary text-gold"
              : "bg-cream/60 text-primary hover:bg-mint"
          }`}
        >
          <span className="flex items-center gap-2">
            <Bookmark
              size={15}
              className={
                favoritesOnly ? "fill-gold text-gold" : "text-primary/60"
              }
            />
            Saved Bookmarks
          </span>
          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-white/20">
            Local
          </span>
        </button>
      </div>

      {/* Categories Box */}
      <div className="p-5 bg-white border border-primary/15 rounded-3xl shadow-soft">
        <div className="flex items-center gap-2 font-bold text-primary font-display">
          <Filter size={15} className="text-gold" />
          <h3 className="text-base">Categories</h3>
        </div>
        <ul className="pr-1 mt-4 space-y-1 overflow-y-auto max-h-72">
          {categories.map((c) => {
            const on = category === c;
            return (
              <li key={c}>
                <button
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-colors font-medium ${
                    on
                      ? "bg-primary text-cream shadow-soft"
                      : "text-primary/70 hover:bg-mint hover:text-primary"
                  }`}
                >
                  {c}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Language Box */}
      <div className="p-5 bg-white border border-primary/15 rounded-3xl shadow-soft">
        <h3 className="text-base font-bold font-display text-primary">
          Language
        </h3>
        <ul className="mt-4 space-y-1">
          {languages.map((l) => {
            const on = language === l;
            return (
              <li key={l}>
                <button
                  type="button"
                  onClick={() => setLanguage(l)}
                  className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-colors font-medium ${
                    on
                      ? "bg-primary text-cream shadow-soft"
                      : "text-primary/70 hover:bg-mint hover:text-primary"
                  }`}
                >
                  {l}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Explore Prompt */}
      <div className="relative p-5 overflow-hidden rounded-3xl bg-primary shadow-soft">
        <div className="absolute w-24 h-24 rounded-full -top-6 -right-6 bg-gold/25 blur-2xl" />
        <div className="relative">
          <div className="grid w-9 h-9 rounded-xl bg-gold text-primary place-items-center">
            <TrendingUp size={16} />
          </div>
          <p className="mt-3 text-base font-bold leading-tight font-display text-cream">
            Classical Collections
          </p>
          <p className="mt-1 text-xs leading-relaxed text-cream/70">
            Discover Vedic scriptures and philosophical commentaries in
            bilingual formats.
          </p>
          <Link
            to="/categories"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-gold hover:underline"
          >
            Browse by subject →
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
    <span className="inline-flex items-center gap-1.5 bg-mint text-primary text-xs font-semibold pl-3 pr-1.5 py-1.5 rounded-full border border-primary/10">
      {label}
      <button
        type="button"
        onClick={onClear}
        aria-label={`Remove filter ${label}`}
        className="grid w-5 h-5 transition rounded-full place-items-center hover:bg-primary/15 text-primary/70 hover:text-primary"
      >
        <X size={11} />
      </button>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  BookCover                                                          */
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

  const seed = hashString(`${book.title}-${book.id || ""}`);
  const p = COVER_PALETTES[seed % COVER_PALETTES.length];

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-black/25" />
      <div className="absolute left-[5px] top-0 bottom-0 w-px bg-white/10" />
      <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-white/10" />

      <div className="relative flex flex-col justify-between h-full p-3 pl-4">
        <p
          className="text-[8px] uppercase tracking-[0.15em] font-bold line-clamp-1"
          style={{ color: p.accent }}
        >
          {book.category || "Book"}
        </p>

        <div className="my-auto">
          <p
            className="font-display text-[13px] leading-[1.15] font-bold line-clamp-3"
            style={{ color: p.text }}
          >
            {book.title}
          </p>
          <div
            className="mt-1.5 h-[2px] w-6 rounded-full"
            style={{ background: p.accent }}
          />
        </div>

        <p
          className="text-[9px] leading-tight line-clamp-1"
          style={{ color: p.muted }}
        >
          {book.author}
        </p>
      </div>
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-black/20" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  BookCard (Grid View)                                               */
/* ------------------------------------------------------------------ */
function BookCard({ book, onOpen, onDirectRead }) {
  const toast = useToast();
  const [fav, setFav] = useState(() => isFavorite(book.id));

  const handleToggleFav = (e) => {
    e.stopPropagation();
    const isNow = toggleFavorite(book);
    setFav(isNow);
    if (isNow) {
      toast.success(`"${book.title}" added to bookmarks.`);
    } else {
      toast.info(`"${book.title}" removed from bookmarks.`);
    }
  };

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
      className="group bg-white rounded-3xl border border-primary/10 p-2.5 sm:p-3 hover:shadow-card hover:-translate-y-1 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gold flex flex-col justify-between"
    >
      <div>
        <div className="relative">
          <BookCover
            book={book}
            className="w-full aspect-[5/7] rounded-2xl shadow-soft"
          />

          {book.rating != null && (
            <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-0.5 shadow-soft">
              <Star size={10} className="text-gold fill-gold" />
              <span className="text-[10px] font-bold text-primary">
                {book.rating}
              </span>
            </span>
          )}

          {/* Hover action shortcuts */}
          <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={handleToggleFav}
              aria-label={fav ? "Remove from bookmarks" : "Save bookmark"}
              className={`w-8 h-8 rounded-xl backdrop-blur-sm grid place-items-center transition shadow-soft ${
                fav
                  ? "bg-primary text-gold"
                  : "bg-white/90 text-primary/70 hover:bg-white hover:text-primary"
              }`}
            >
              <Bookmark
                size={13}
                className={fav ? "fill-gold text-gold" : ""}
              />
            </button>
          </div>

          <span className="absolute bottom-2.5 left-2.5 inline-flex items-center bg-primary text-cream text-[9px] font-semibold px-2 py-0.5 rounded-md shadow-soft">
            {book.language}
          </span>
        </div>

        <div className="px-1 pt-3 pb-1">
          <h3 className="text-sm font-bold leading-tight transition-colors font-display text-primary line-clamp-1 group-hover:text-primary-light">
            {book.title}
          </h3>
          <p className="text-[11px] text-primary/60 mt-1 line-clamp-1">
            {book.author}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between px-1 pt-2 mt-2 border-t border-primary/5">
        <span className="text-[9.5px] uppercase tracking-wider text-primary/45 font-semibold truncate max-w-[80px]">
          {book.category}
        </span>
        <button
          type="button"
          onClick={onDirectRead}
          className="flex items-center gap-1 text-xs font-bold transition-colors text-gold hover:text-primary shrink-0"
        >
          <span>Read</span>
          <ArrowRight
            size={12}
            className="group-hover:translate-x-0.5 transition-transform"
          />
        </button>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/*  BookRow (List View)                                                */
/* ------------------------------------------------------------------ */
function BookRow({ book, onOpen, onDirectRead }) {
  const toast = useToast();
  const [fav, setFav] = useState(() => isFavorite(book.id));

  const handleToggleFav = (e) => {
    e.stopPropagation();
    const isNow = toggleFavorite(book);
    setFav(isNow);
    if (isNow) {
      toast.success(`"${book.title}" added to bookmarks.`);
    } else {
      toast.info(`"${book.title}" removed from bookmarks.`);
    }
  };

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
      className="flex gap-4 p-3.5 transition bg-white border cursor-pointer group rounded-2xl border-primary/10 hover:shadow-card focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
    >
      <BookCover
        book={book}
        className="w-16 h-22 sm:w-20 sm:h-28 rounded-xl shrink-0 shadow-soft"
      />
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-bold leading-tight transition-colors sm:text-base font-display text-primary line-clamp-1 group-hover:text-primary-light">
              {book.title}
            </h3>
            <p className="mt-1 text-xs text-primary/60">{book.author}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {book.rating != null && (
              <span className="inline-flex items-center gap-1 bg-mint text-primary text-[10px] font-bold px-2 py-1 rounded-lg">
                <Star size={10} className="text-gold fill-gold" />
                {book.rating}
              </span>
            )}
            <button
              type="button"
              onClick={handleToggleFav}
              aria-label={fav ? "Remove from bookmarks" : "Save bookmark"}
              className={`w-7 h-7 rounded-lg grid place-items-center transition ${
                fav
                  ? "bg-primary text-gold"
                  : "text-primary/40 hover:text-primary hover:bg-mint"
              }`}
            >
              <Bookmark
                size={13}
                className={fav ? "fill-gold text-gold" : ""}
              />
            </button>
          </div>
        </div>

        {book.description && (
          <p className="hidden mt-2 text-xs leading-relaxed sm:block text-primary/70 line-clamp-2">
            {book.description}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 pt-3 mt-auto border-t border-primary/5">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-primary/45 font-semibold">
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

          <button
            type="button"
            onClick={onDirectRead}
            className="flex items-center gap-1 text-xs font-bold transition text-gold hover:text-primary shrink-0"
          >
            <span>Read Book</span>
            <ArrowRight size={13} />
          </button>
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
  favoritesOnly,
  setFavoritesOnly,
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
        aria-label="Library filters"
        className={`lg:hidden fixed bottom-0 inset-x-0 z-[80] bg-cream rounded-t-3xl max-h-[85vh] flex flex-col transition-transform duration-300 ease-out shadow-hover border-t border-primary/10 ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-primary/10 shrink-0">
          <h2 className="text-lg font-bold font-display text-primary">
            Filter Catalog
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="grid transition bg-white border w-9 h-9 rounded-xl border-primary/10 place-items-center text-primary hover:bg-mint"
          >
            <X size={17} />
          </button>
        </div>

        <div className="flex-1 px-5 py-4 space-y-6 overflow-y-auto">
          {/* Favorites toggle */}
          <div>
            <h3 className="mb-2 text-xs font-bold tracking-wider uppercase text-primary/50">
              Personal Shelf
            </h3>
            <button
              type="button"
              onClick={() => setFavoritesOnly(!favoritesOnly)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
                favoritesOnly
                  ? "bg-primary text-gold shadow-soft"
                  : "bg-white border border-primary/15 text-primary"
              }`}
            >
              <Bookmark
                size={13}
                className={favoritesOnly ? "fill-gold text-gold" : ""}
              />
              <span>Show Bookmarked Books Only</span>
            </button>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-bold tracking-wider uppercase text-primary/50">
              Categories
            </h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    category === c
                      ? "bg-primary text-cream shadow-soft"
                      : "bg-white border border-primary/10 text-primary/70 hover:bg-mint"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-bold tracking-wider uppercase text-primary/50">
              Language
            </h3>
            <div className="flex flex-wrap gap-2">
              {languages.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLanguage(l)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    language === l
                      ? "bg-primary text-cream shadow-soft"
                      : "bg-white border border-primary/10 text-primary/70 hover:bg-mint"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 px-5 py-4 border-t border-primary/10 bg-white/70 backdrop-blur-sm shrink-0">
          <button
            type="button"
            onClick={onClear}
            className="px-4 py-3 text-sm font-semibold transition bg-white border text-primary rounded-xl border-primary/15 hover:bg-mint"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 text-sm font-semibold transition bg-primary text-cream rounded-xl hover:bg-primary-light shadow-soft"
          >
            Show results
          </button>
        </div>
      </aside>
    </>
  );
}
