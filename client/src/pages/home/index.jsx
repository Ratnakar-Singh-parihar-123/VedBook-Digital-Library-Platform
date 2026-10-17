import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Star,
  Quote,
  Clock,
  Compass,
  Download,
  FolderTree,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

import HeroSection from "./components/HeroSection.jsx";
import BookDetailModal from "../../components/ui/BookDetailModal";
import BookCardSkeleton from "../../components/ui/BookCardSkeleton";
import { booksAPI, categoriesAPI } from "../../api/adminApi";
import {
  getRecentlyViewed,
  addRecentlyViewed,
} from "../../utils/libraryStorage";

/* ------------------------------------------------------------------ */
/*  Cover Palettes & URL Resolver                                      */
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
];

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function resolveCoverUrl(raw) {
  if (!raw || typeof raw !== "string") return "";
  const s = raw.trim();
  if (!s) return "";
  if (/^(https?:\/\/|data:|blob:)/i.test(s)) return s;
  const base = import.meta.env.VITE_API_URL || "http://localhost:8000";
  const host = base.replace(/\/api\/?$/, "");
  if (s.startsWith("uploads/")) return `${host}/${s}`;
  if (s.startsWith("/")) return `${host}${s}`;
  if (s.endsWith(".png")) return `${host}/uploads/covers/${s}`;
  return `${host}/uploads/books/${s}`;
}

const FEATURED_FALLBACKS = [
  {
    id: "gita-classical",
    title: "Shrimad Bhagavad Gita",
    author: "Maharshi Ved Vyasa",
    category: "Philosophy",
    language: "Sanskrit / Hindi",
    rating: 5.0,
    pages: 420,
    cover: "",
  },
  {
    id: "upanishads-selection",
    title: "Ten Principal Upanishads",
    author: "Vedic Sages",
    category: "Sacred Texts",
    language: "Hindi & English",
    rating: 4.9,
    pages: 350,
    cover: "",
  },
  {
    id: "clean-code-notes",
    title: "Clean Code Principles",
    author: "Robert C. Martin",
    category: "Technology",
    language: "English",
    rating: 4.8,
    pages: 280,
    cover: "",
  },
  {
    id: "ramayana-valmiki",
    title: "Valmiki Ramayana Sangrah",
    author: "Maharshi Valmiki",
    category: "Epic Literature",
    language: "Hindi",
    rating: 4.9,
    pages: 580,
    cover: "",
  },
];

export default function HomeScreen() {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentBooks, setRecentBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);

  // Sync recently viewed
  useEffect(() => {
    setRecentBooks(getRecentlyViewed());
    const onLibChange = (e) => {
      if (e.detail?.type === "recent") setRecentBooks(e.detail.data || []);
    };
    window.addEventListener("ved-library-change", onLibChange);
    return () => window.removeEventListener("ved-library-change", onLibChange);
  }, []);

  // Fetch catalog
  useEffect(() => {
    let cancelled = false;
    (async () => {
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
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const categoryMap = useMemo(() => {
    const map = {};
    for (const c of categories) map[c.id ?? c._id] = c.name;
    return map;
  }, [categories]);

  const normalizedBooks = useMemo(() => {
    if (books.length === 0) return FEATURED_FALLBACKS;
    return books.map((b) => ({
      id: b.id || b._id,
      title: b.title || "Untitled",
      author: b.author || "Unknown author",
      description: b.description || "",
      category: categoryMap[b.category_id ?? b.categoryId] || "Classical Text",
      language: b.language || "Bilingual",
      rating: typeof b.rating === "number" ? b.rating : 4.8,
      pages: b.pages || b.totalPages || 320,
      cover: resolveCoverUrl(b.cover || b.cover_image || b.coverUrl),
    }));
  }, [books, categoryMap]);

  const featuredPicks = useMemo(() => {
    return normalizedBooks.slice(0, 4);
  }, [normalizedBooks]);

  const popularPicks = useMemo(() => {
    return normalizedBooks.slice(4, 8).length > 0
      ? normalizedBooks.slice(4, 8)
      : normalizedBooks.slice(0, 4);
  }, [normalizedBooks]);

  const handleOpenBook = (book) => {
    setSelectedBook(book);
  };

  const handleDirectRead = (book, e) => {
    if (e) e.stopPropagation();
    addRecentlyViewed(book);
    navigate(`/read/${book.id}`, { state: { book } });
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. Recently Viewed / Continue Reading Shelf (Conditional) */}
      {/* {recentBooks.length > 0 && (
        <section className="py-8 border-b bg-white/70 border-primary/10">
          <div className="px-5 mx-auto max-w-7xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gold" />
                <h2 className="text-sm font-bold tracking-wider uppercase text-primary font-display">
                  Continue Reading
                </h2>
              </div>
              <Link
                to="/explore"
                className="flex items-center gap-1 text-xs font-semibold text-gold hover:underline"
              >
                <span>View Full Library</span>
                <ChevronRight size={13} />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {recentBooks.slice(0, 6).map((b) => (
                <div
                  key={b.id}
                  onClick={() => handleDirectRead(b)}
                  role="button"
                  tabIndex={0}
                  className="p-2.5 rounded-2xl bg-white border border-primary/10 hover:shadow-card hover:-translate-y-0.5 transition cursor-pointer flex items-center gap-3"
                >
                  <div className="w-10 overflow-hidden rounded-lg h-14 bg-primary/10 shrink-0 shadow-soft">
                    {b.cover ? (
                      <img
                        src={resolveCoverUrl(b.cover)}
                        alt=""
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-xs font-bold bg-primary text-gold">
                        V
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate text-primary font-display">
                      {b.title}
                    </p>
                    <p className="text-[10px] text-primary/50 truncate mt-0.5">
                      {b.author}
                    </p>
                    <span className="text-[9.5px] font-semibold text-gold mt-1 inline-block">
                      Resume →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )} */}

      {/* 3. Featured Masterpieces Collection */}
      <section className="py-16 border-b md:py-20 border-primary/10">
        <div className="px-5 mx-auto max-w-7xl">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs uppercase font-bold tracking-wider text-gold">
                <Sparkles size={13} />
                Editor's Choice
              </span>
              <h2 className="mt-2 text-3xl font-bold sm:text-4xl font-display text-primary">
                Featured Masterpieces
              </h2>
              <p className="max-w-lg mt-1 text-sm text-primary/70">
                Handpicked editions revered for their depth, philosophical
                significance, and clarity.
              </p>
            </div>

            <Link
              to="/explore?sort=rating"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-gold transition group"
            >
              <span>Explore all masterpieces</span>
              <ArrowRight
                size={15}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>

          {loading ? (
            <BookCardSkeleton count={4} view="grid" />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
              {featuredPicks.map((b) => (
                <EditorialCard
                  key={b.id}
                  book={b}
                  onOpen={() => handleOpenBook(b)}
                  onDirectRead={(e) => handleDirectRead(b, e)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. Curated Categories Navigation */}
      <section className="py-16 border-b md:py-20 bg-white/60 border-primary/10">
        <div className="px-5 mx-auto max-w-7xl">
          <div className="max-w-2xl mx-auto mb-12 text-center">
            <span className="inline-flex items-center gap-1.5 text-xs uppercase font-bold tracking-wider text-gold">
              <FolderTree size={14} />
              Organized Knowledge
            </span>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl font-display text-primary">
              Explore by Subject & Genre
            </h2>
            <p className="mt-2 text-sm sm:text-base text-primary/70">
              From Vedic commentaries to modern computer science, find exactly
              what you are called to study.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 sm:gap-4">
            {[
              { label: "Philosophy", count: "120+ texts", icon: Sparkles },
              { label: "Sacred Texts", count: "80+ editions", icon: BookOpen },
              { label: "Literature", count: "250+ works", icon: Star },
              { label: "Technology", count: "140+ notes", icon: TrendingUp },
              { label: "History", count: "90+ books", icon: Quote },
              {
                label: "Competitive",
                count: "310+ guides",
                icon: CheckCircle2,
              },
            ].map(({ label, count, icon: Icon }) => (
              <Link
                key={label}
                to={`/explore?category=${encodeURIComponent(label)}`}
                className="p-5 rounded-2xl bg-white border border-primary/10 hover:border-gold/40 hover:shadow-card hover:-translate-y-1 transition text-center group flex flex-col items-center justify-between min-h-[140px]"
              >
                <div className="grid w-10 h-10 transition rounded-xl bg-mint text-primary place-items-center group-hover:bg-primary group-hover:text-gold">
                  <Icon size={18} />
                </div>
                <div>
                  <h3 className="mt-2 text-sm font-bold transition font-display text-primary group-hover:text-primary-light">
                    {label}
                  </h3>
                  <p className="text-[11px] text-primary/50 mt-0.5">{count}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              to="/categories"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-cream border border-primary/15 text-xs font-semibold text-primary hover:bg-primary hover:text-cream transition shadow-soft"
            >
              <span>View all categories</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Popular Picks / Community Favorites */}
      <section className="py-16 border-b md:py-20 border-primary/10">
        <div className="px-5 mx-auto max-w-7xl">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs uppercase font-bold tracking-wider text-gold">
                <TrendingUp size={13} />
                Popular Across Readers
              </span>
              <h2 className="mt-2 text-3xl font-bold sm:text-4xl font-display text-primary">
                Trending Literature & Study Guides
              </h2>
              <p className="max-w-lg mt-1 text-sm text-primary/70">
                The most read, referenced, and bookmarked editions by our
                community.
              </p>
            </div>

            <Link
              to="/explore?sort=popular"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-gold transition group"
            >
              <span>View all popular books</span>
              <ArrowRight
                size={15}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
            {popularPicks.map((b) => (
              <EditorialCard
                key={b.id}
                book={b}
                onOpen={() => handleOpenBook(b)}
                onDirectRead={(e) => handleDirectRead(b, e)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 6. Editorial Philosophy / Quote Banner */}
      <section className="relative py-16 overflow-hidden md:py-24 bg-primary text-cream">
        <div className="absolute rounded-full pointer-events-none -top-32 -left-32 w-96 h-96 bg-gold/15 blur-3xl" />
        <div className="absolute rounded-full pointer-events-none -bottom-32 -right-32 w-96 h-96 bg-mint/15 blur-3xl" />

        <div className="relative max-w-5xl px-5 mx-auto text-center">
          <Quote size={36} className="mx-auto opacity-75 text-gold" />
          <blockquote className="max-w-3xl mx-auto mt-6 text-2xl font-medium leading-snug font-display sm:text-3xl lg:text-4xl text-cream">
            “A room without books is like a body without a soul. Knowledge, when
            shared freely, elevates all humankind.”
          </blockquote>
          <p className="mt-4 text-sm font-semibold tracking-widest uppercase text-gold">
            — Marcus Tullius Cicero & The Vedic Tradition
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-10">
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 bg-gold text-primary font-semibold px-6 py-3.5 rounded-2xl text-sm shadow-soft hover:bg-gold/90 transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <Compass size={16} />
              <span>Begin Reading Now</span>
            </Link>
            <Link
              to="/download"
              className="inline-flex items-center gap-2 bg-cream/10 border border-cream/20 text-cream font-semibold px-6 py-3.5 rounded-2xl text-sm hover:bg-cream/20 transition"
            >
              <Download size={16} />
              <span>Get Mobile Application</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Book Detail Modal */}
      <BookDetailModal
        book={selectedBook}
        isOpen={Boolean(selectedBook)}
        onClose={() => setSelectedBook(null)}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Editorial Card Component                                          */
/* ------------------------------------------------------------------ */
function EditorialCard({ book, onOpen, onDirectRead }) {
  const seed = hashString(`${book.title}-${book.id}`);
  const p = COVER_PALETTES[seed % COVER_PALETTES.length];

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
      className="group bg-white rounded-3xl border border-primary/10 p-3 sm:p-4 hover:shadow-hover hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Cover Presentation */}
        <div className="relative w-full aspect-[5/7] rounded-2xl overflow-hidden shadow-soft">
          {book.cover ? (
            <img
              src={book.cover}
              alt={book.title}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            />
          ) : (
            <div
              className="relative flex flex-col justify-between w-full h-full p-4"
              style={{
                background: `linear-gradient(135deg, ${p.from}, ${p.to})`,
              }}
            >
              <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-black/25" />
              <span
                className="text-[9px] uppercase font-bold tracking-widest pl-1"
                style={{ color: p.accent }}
              >
                {book.category}
              </span>
              <div className="pl-1 my-auto">
                <h4
                  className="text-sm font-bold leading-tight font-display sm:text-base"
                  style={{ color: p.text }}
                >
                  {book.title}
                </h4>
                <div
                  className="mt-1.5 h-0.5 w-6 rounded-full"
                  style={{ background: p.accent }}
                />
              </div>
              <p className="text-[10px] pl-1" style={{ color: p.muted }}>
                {book.author}
              </p>
            </div>
          )}

          {book.rating && (
            <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 bg-white/95 backdrop-blur-sm rounded-lg px-2 py-0.5 shadow-soft">
              <Star size={10} className="text-gold fill-gold" />
              <span className="text-[10px] font-bold text-primary">
                {book.rating}
              </span>
            </span>
          )}

          <span className="absolute bottom-2.5 left-2.5 inline-flex items-center bg-primary text-cream text-[9px] font-semibold px-2 py-0.5 rounded-md shadow-soft">
            {book.language}
          </span>
        </div>

        {/* Title and metadata */}
        <div className="pt-3 pb-1">
          <h3 className="text-base font-bold leading-tight transition-colors font-display text-primary line-clamp-1 group-hover:text-primary-light">
            {book.title}
          </h3>
          <p className="mt-1 text-xs text-primary/60 line-clamp-1">
            {book.author}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 mt-2 border-t border-primary/5">
        <span className="text-[10px] uppercase font-semibold tracking-wider text-primary/45 truncate max-w-[90px]">
          {book.category}
        </span>
        <button
          type="button"
          onClick={onDirectRead}
          className="flex items-center gap-1 text-xs font-bold transition text-gold hover:text-primary"
        >
          <span>Read Text</span>
          <ArrowRight
            size={12}
            className="group-hover:translate-x-0.5 transition-transform"
          />
        </button>
      </div>
    </article>
  );
}
