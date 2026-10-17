import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Star,
  Sparkles,
  Search,
  X,
  Compass,
} from "lucide-react";

const POPULAR_SEARCHES = ["Bhagavad Gita", "Clean Code", "Ancient Wisdom", "UPSC Notes", "Hindi Literature", "Philosophy"];

const HERO_FEATURED_BOOKS = [
  {
    id: "gita",
    title: "The Bhagavad Gita",
    author: "Sage Vyasa",
    category: "Philosophy",
    rating: 4.9,
    readers: "18k",
    palette: { from: "#1A4A3E", to: "#0B241C", text: "#FAF7F0", accent: "#D6B56D" },
  },
  {
    id: "vedas",
    title: "Rigveda Hymns & Translation",
    author: "Ancient Sages",
    category: "Spiritual",
    rating: 4.8,
    readers: "12k",
    palette: { from: "#B08F4A", to: "#6E5A2A", text: "#FAF7F0", accent: "#FAF7F0" },
  },
  {
    id: "upanishads",
    title: "Principal Upanishads",
    author: "Classical Vedic",
    category: "Sacred Texts",
    rating: 5.0,
    readers: "15k",
    palette: { from: "#2A5E4E", to: "#0F2B22", text: "#FAF7F0", accent: "#D6B56D" },
  },
];

export default function HeroSection() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeBookIndex, setActiveBookIndex] = useState(0);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) {
      navigate("/explore");
    } else {
      navigate(`/explore?q=${encodeURIComponent(q)}`);
    }
  };

  const activeBook = HERO_FEATURED_BOOKS[activeBookIndex];

  return (
    <section className="relative overflow-hidden bg-cream border-b border-primary/10">
      {/* Ambient background glows */}
      <div className="absolute -top-36 -right-36 w-[34rem] h-[34rem] rounded-full bg-gold/15 blur-3xl pointer-events-none" />
      <div className="absolute top-48 -left-32 w-[28rem] h-[28rem] rounded-full bg-mint blur-3xl pointer-events-none" />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(23,63,53,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(23,63,53,0.6) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-5 py-14 sm:py-20 lg:py-24 grid lg:grid-cols-[1.15fr_0.85fr] gap-12 lg:gap-14 items-center">
        {/* ================= LEFT COLUMN ================= */}
        <div className="space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/80 border border-primary/10 px-3.5 py-1.5 rounded-full shadow-soft backdrop-blur-sm">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex w-full h-full rounded-full opacity-75 bg-gold animate-ping" />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-gold" />
            </span>
            <span className="text-xs font-semibold text-primary">
              The Digital Sanctuary for Readers & Scholars
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-primary font-bold tracking-tight leading-[1.08]">
            Timeless wisdom, <br />
            <span className="relative inline-block text-gold">
              modern digital reading.
              <span
                aria-hidden="true"
                className="absolute left-0 right-0 h-1 rounded-full -bottom-1.5 bg-gold/30"
              />
            </span>
          </h1>

          {/* Subtext */}
          <p className="text-base sm:text-lg text-primary/70 max-w-xl leading-relaxed">
            Discover a curated universe of sacred scriptures, philosophy, classical literature, and study notes. Read in Hindi or English with a clean, distraction-free reading experience.
          </p>

          {/* Prominent Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="p-1.5 sm:p-2 bg-white border border-primary/15 rounded-2xl sm:rounded-3xl shadow-card flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-xl transition-all focus-within:ring-2 focus-within:ring-gold/50 focus-within:border-gold/50"
          >
            <div className="flex items-center gap-2.5 px-3 py-2 flex-1 min-w-0">
              <Search size={18} className="text-gold shrink-0" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, author, or Vedic text..."
                aria-label="Search digital library"
                className="w-full bg-transparent outline-none text-sm sm:text-base text-primary placeholder:text-primary/45"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search text"
                  className="p-1 text-primary/40 hover:text-primary transition"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 bg-primary text-cream px-5 py-3 rounded-xl sm:rounded-2xl text-sm font-semibold hover:bg-primary-light transition shadow-soft shrink-0"
            >
              <span>Explore Books</span>
              <ArrowRight size={15} />
            </button>
          </form>

          {/* Popular Search Chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-primary/60 pt-1">
            <span className="font-semibold text-primary/80">Popular:</span>
            {POPULAR_SEARCHES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => navigate(`/explore?q=${encodeURIComponent(item)}`)}
                className="px-2.5 py-1 rounded-full bg-white/70 border border-primary/10 hover:bg-mint hover:text-primary hover:border-primary/20 transition-colors shadow-soft"
              >
                {item}
              </button>
            ))}
          </div>

          {/* CTA & Feature Row */}
          <div className="pt-4 flex flex-wrap items-center gap-4 sm:gap-6">
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 bg-gold text-primary font-semibold px-6 py-3.5 rounded-2xl text-sm shadow-soft hover:bg-gold/90 transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <Compass size={16} />
              <span>Browse Catalog</span>
            </Link>

            <Link
              to="/about"
              className="inline-flex items-center gap-2 bg-white/80 border border-primary/15 text-primary font-semibold px-5 py-3.5 rounded-2xl text-sm hover:bg-mint transition"
            >
              <BookOpen size={16} className="text-gold" />
              <span>Our Vision</span>
            </Link>
          </div>

          {/* Social Proof Stats */}
          <div className="grid grid-cols-3 gap-4 pt-6 max-w-lg border-t border-primary/10">
            <div>
              <p className="font-display text-2xl sm:text-3xl font-bold text-primary">10K+</p>
              <p className="text-xs text-primary/60 mt-0.5 uppercase tracking-wider">Titles Available</p>
            </div>
            <div>
              <p className="font-display text-2xl sm:text-3xl font-bold text-primary">100%</p>
              <p className="text-xs text-primary/60 mt-0.5 uppercase tracking-wider">Free Access</p>
            </div>
            <div>
              <p className="font-display text-2xl sm:text-3xl font-bold text-primary">25K+</p>
              <p className="text-xs text-primary/60 mt-0.5 uppercase tracking-wider">Active Readers</p>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN — EDITORIAL SHOWCASE ================= */}
        <div className="relative flex justify-center lg:justify-end">
          <div className="relative w-full max-w-md">
            {/* Background card with layered depth */}
            <div className="relative p-6 sm:p-8 rounded-3xl bg-white/70 border border-primary/10 shadow-hover backdrop-blur-sm">
              <div className="flex items-center justify-between pb-4 border-b border-primary/10">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gold">
                  <Sparkles size={14} />
                  Featured Classical Selection
                </span>
                <span className="text-xs font-semibold text-primary/50">
                  0{activeBookIndex + 1} / 0{HERO_FEATURED_BOOKS.length}
                </span>
              </div>

              {/* Book Presentation Canvas */}
              <div className="my-6 flex justify-center">
                <div
                  className="w-48 sm:w-56 aspect-[5/7] rounded-2xl shadow-hover relative overflow-hidden flex flex-col justify-between p-5 transition-transform duration-500 hover:scale-[1.03] cursor-pointer"
                  style={{
                    background: `linear-gradient(135deg, ${activeBook.palette.from}, ${activeBook.palette.to})`,
                  }}
                  onClick={() => navigate(`/explore?q=${encodeURIComponent(activeBook.title)}`)}
                >
                  {/* Book spine lighting */}
                  <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-black/25" />
                  <div className="absolute left-2.5 top-0 bottom-0 w-px bg-white/10" />
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/10" />

                  <div className="relative pl-2">
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: activeBook.palette.accent }}
                    >
                      {activeBook.category}
                    </span>
                  </div>

                  <div className="relative my-auto pl-2">
                    <h3
                      className="font-display text-xl sm:text-2xl font-bold leading-tight"
                      style={{ color: activeBook.palette.text }}
                    >
                      {activeBook.title}
                    </h3>
                    <div
                      className="mt-2.5 h-0.5 w-10 rounded-full"
                      style={{ background: activeBook.palette.accent }}
                    />
                  </div>

                  <div className="relative pl-2 flex items-center justify-between text-xs" style={{ color: activeBook.palette.text }}>
                    <span className="opacity-80">{activeBook.author}</span>
                    <span className="font-bold flex items-center gap-1">
                      <Star size={11} className="fill-current text-gold" />
                      {activeBook.rating}
                    </span>
                  </div>
                </div>
              </div>

              {/* Book Selector tabs */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                {HERO_FEATURED_BOOKS.map((b, idx) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setActiveBookIndex(idx)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      activeBookIndex === idx
                        ? "bg-primary text-cream border-primary shadow-soft"
                        : "bg-white/80 text-primary/70 border-primary/10 hover:bg-mint"
                    }`}
                  >
                    <p className="text-[10px] uppercase font-bold opacity-75 truncate">{b.category}</p>
                    <p className="text-xs font-semibold truncate mt-0.5 font-display">{b.title}</p>
                  </button>
                ))}
              </div>

              {/* Quick direct read action */}
              <div className="mt-5 pt-4 border-t border-primary/10 flex items-center justify-between">
                <div>
                  <p className="text-xs text-primary/60">{activeBook.readers} readers this month</p>
                  <p className="text-sm font-bold text-primary font-display">{activeBook.title}</p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/explore?q=${encodeURIComponent(activeBook.title)}`)}
                  className="inline-flex items-center gap-1.5 bg-mint text-primary font-semibold px-4 py-2 rounded-xl text-xs hover:bg-primary hover:text-cream transition shadow-soft"
                >
                  <span>Explore Text</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
