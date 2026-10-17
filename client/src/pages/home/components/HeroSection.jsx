import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Star,
  Sparkles,
  Wifi,
  Signal,
  BatteryFull,
  Home,
  Library,
  User,
  Bell,
  TrendingUp,
  Users,
  Play,
  Headphones,
  Download,
  Search,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Dummy data                                                         */
/* ------------------------------------------------------------------ */
const POPULAR = ["Clean Code", "DSA Notes", "UPSC", "Hindi Novels"];

const FEATURED_BOOKS = [
  {
    id: "clean-code",
    title: "Clean Code",
    author: "Robert C. Martin",
    cover:
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200&h=280&fit=crop&auto=format&q=80",
    fallback: "bg-primary",
  },
  {
    id: "atomic-habits",
    title: "Atomic Habits",
    author: "James Clear",
    cover:
      "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=200&h=280&fit=crop&auto=format&q=80",
    fallback: "bg-gold",
  },
  {
    id: "deep-work",
    title: "Deep Work",
    author: "Cal Newport",
    cover:
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=200&h=280&fit=crop&auto=format&q=80",
    fallback: "bg-mint",
  },
  {
    id: "ikigai",
    title: "Ikigai",
    author: "Héctor García",
    cover:
      "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=200&h=280&fit=crop&auto=format&q=80",
    fallback: "bg-primary/80",
  },
];

/* ------------------------------------------------------------------ */
/*  HeroSection                                                        */
/* ------------------------------------------------------------------ */
export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-cream">
      {/* ---------- ambient background ---------- */}
      <div className="absolute -top-40 -right-40 w-[30rem] h-[30rem] rounded-full bg-gold/20 blur-3xl" />
      <div className="absolute rounded-full top-40 -left-32 w-96 h-96 bg-mint blur-3xl" />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(23,63,53,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(23,63,53,0.6) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse at center, black 40%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 40%, transparent 75%)",
        }}
      />

      <div className="relative grid items-center gap-12 px-5 mx-auto max-w-7xl py-14 md:py-20 lg:py-28 lg:grid-cols-2 lg:gap-16">
        {/* ================= LEFT ================= */}
        <div>
          {/* Live badge */}
          <span className="inline-flex items-center gap-2 bg-mint text-primary text-xs font-medium px-3 py-1.5 rounded-full border border-primary/5">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex w-full h-full rounded-full opacity-75 bg-gold animate-ping" />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-gold" />
            </span>
            Trusted by 12,000+ readers
          </span>

          {/* Heading */}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-primary mt-6 leading-[1.05] tracking-tight">
            Your entire library,
            <br />
            <span className="relative inline-block">
              <span className="text-gold">in your pocket.</span>
              <span
                aria-hidden="true"
                className="absolute left-0 right-0 h-1 rounded-full -bottom-1 bg-gold/30"
              />
            </span>
          </h1>

          {/* Sub copy */}
          <p className="max-w-lg mt-6 text-sm leading-relaxed text-primary/70 sm:text-base">
            Books, e-books, PDFs, study notes, and courses — all in one
            beautifully simple platform. Read in{" "}
            <span className="font-medium text-primary">Hindi</span> or{" "}
            <span className="font-medium text-primary">English</span>, anytime,
            anywhere.
          </p>

          {/* Feature mini-pills */}
          <div className="flex flex-wrap gap-2 mt-6">
            {[
              { icon: BookOpen, label: "10,000+ titles" },
              { icon: Download, label: "Offline reading" },
              { icon: Headphones, label: "Hindi & English" },
              { icon: Sparkles, label: "AI study assist" },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 bg-white border border-primary/10 text-primary/70 text-xs font-medium px-3 py-1.5 rounded-full"
              >
                <Icon size={12} className="text-gold" />
                {label}
              </span>
            ))}
          </div>

          {/* Popular chips */}
          <div className="flex flex-wrap items-center gap-2 mt-6 text-xs text-primary/50">
            <span className="hidden sm:inline">Popular:</span>
            {POPULAR.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => navigate(`/explore?q=${encodeURIComponent(t)}`)}
                className="px-2.5 py-1 rounded-full bg-white border border-primary/10 hover:bg-mint hover:text-primary transition-colors"
              >
                {t}
              </button>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 mt-8">
            <Link
              to="/explore"
              className="group inline-flex items-center gap-2 bg-primary text-cream px-6 py-3.5 rounded-2xl text-sm font-medium hover:bg-primary/90 transition shadow-soft"
            >
              Explore Library
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
            <Link
              to="/download"
              className="inline-flex items-center gap-2 bg-white border border-primary/10 text-primary px-6 py-3.5 rounded-2xl text-sm font-medium hover:bg-mint transition"
            >
              <Download size={15} className="text-gold" />
              Download App
            </Link>
          </div>

          {/* Stats */}
          <div className="grid max-w-md grid-cols-3 gap-6 mt-12">
            {[
              { k: "10K+", l: "Books", icon: BookOpen },
              { k: "500+", l: "Courses", icon: TrendingUp },
              { k: "25K+", l: "Readers", icon: Users },
            ].map(({ k, l, icon: Icon }) => (
              <div key={l} className="flex flex-col">
                <div className="flex items-center gap-1.5 text-primary/40">
                  <Icon size={12} />
                  <p className="text-[10px] uppercase tracking-wider">{l}</p>
                </div>
                <p className="mt-1 text-2xl font-display text-primary">{k}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ================= RIGHT — phone ================= */}
        <div className="relative flex justify-center lg:justify-end">
          <HeroPhone />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  HeroPhone                                                          */
/* ------------------------------------------------------------------ */
function HeroPhone() {
  return (
    <div className="relative animate-float">
      {/* glow */}
      <div className="absolute rounded-full -inset-12 bg-gradient-to-tr from-gold/30 via-transparent to-primary/20 blur-3xl opacity-70" />

      {/* dashed ring */}
      <div
        aria-hidden="true"
        className="hidden sm:block absolute -inset-6 rounded-[3.5rem] border border-dashed border-primary/15"
      />

      {/* ---------- Floating cards ---------- */}
      {/* Now reading — top-left */}
      {/* <div className="hidden sm:flex absolute -left-10 top-28 z-30 bg-white rounded-2xl border border-primary/10 shadow-soft p-2.5 items-center gap-3 w-[190px]">
        <BookCover
          book={FEATURED_BOOKS[1]}
          className="w-12 h-16 rounded-lg shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-[9px] uppercase tracking-wider text-gold font-medium">
            Now reading
          </p>
          <p className="text-xs font-medium truncate text-primary">
            {FEATURED_BOOKS[1].title}
          </p>
          <div className="mt-1.5 h-1 rounded-full bg-mint overflow-hidden">
            <div className="w-2/3 h-full rounded-full bg-gold" />
          </div>
          <p className="text-[9px] text-primary/50 mt-1">66% complete</p>
        </div>
      </div> */}

      {/* ---------- Phone body ---------- */}
      <div className="relative w-[290px] sm:w-[310px] h-[600px] sm:h-[640px] rounded-[3rem] bg-primary p-2 shadow-[0_30px_60px_-20px_rgba(23,63,53,0.5)]">
        {/* side buttons */}
        <div className="absolute w-1 h-8 -left-1 top-24 bg-gold/70 rounded-l-md" />
        <div className="absolute w-1 h-12 -left-1 top-36 bg-gold/70 rounded-l-md" />
        <div className="absolute w-1 h-12 -left-1 top-52 bg-gold/70 rounded-l-md" />
        <div className="absolute w-1 h-20 -right-1 top-40 bg-gold/70 rounded-r-md" />

        <div className="relative w-full h-full rounded-[2.5rem] bg-cream overflow-hidden">
          {/* glass reflection */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-1/2 -left-1/3 w-[140%] h-[140%] rotate-12 bg-gradient-to-b from-white/25 via-transparent to-transparent z-40"
          />

          {/* dynamic island */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-6 bg-primary rounded-full z-30 flex items-center justify-end pr-2">
            <span className="w-2 h-2 border rounded-full border-gold/40" />
          </div>

          {/* status bar */}
          <div className="absolute top-0 inset-x-0 h-10 px-7 flex items-center justify-between text-[10px] font-medium text-primary z-20">
            <span>9:41</span>
            <div className="flex items-center gap-1.5">
              <Signal size={11} />
              <Wifi size={11} />
              <BatteryFull size={13} />
            </div>
          </div>

          {/* app content */}
          <div className="absolute inset-0 overflow-hidden pt-11 pb-14">
            <MiniHomeScreen />
          </div>

          {/* bottom nav */}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-around px-2 border-t h-14 bg-white/95 backdrop-blur border-primary/10">
            {[
              { icon: Home, label: "Home", on: true },
              { icon: Library, label: "Library", on: false },
              { icon: BookOpen, label: "Read", on: false },
              { icon: User, label: "Profile", on: false },
            ].map(({ icon: Icon, label, on }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-0.5 relative"
              >
                <Icon
                  size={18}
                  className={on ? "text-primary" : "text-primary/40"}
                />
                <span
                  className={`text-[9px] ${
                    on ? "text-primary font-medium" : "text-primary/40"
                  }`}
                >
                  {label}
                </span>
                {on && (
                  <span className="absolute -bottom-1 w-5 h-0.5 rounded-full bg-gold" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MiniHomeScreen                                                     */
/* ------------------------------------------------------------------ */
function MiniHomeScreen() {
  const categories = ["Fiction", "DSA", "UPSC"];
  const books = FEATURED_BOOKS;

  return (
    <div className="flex flex-col h-full bg-cream">
      {/* greeting bar */}
      <div className="flex items-center justify-between px-5 pt-3">
        <div>
          <p className="text-[10px] text-primary/50">Good morning</p>
          <p className="text-base leading-tight font-display text-primary">
            Aarav 👋
          </p>
        </div>
        <div className="relative grid w-8 h-8 bg-white border rounded-full border-primary/10 place-items-center">
          <Bell size={13} className="text-primary/70" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-gold" />
        </div>
      </div>

      {/* mini search */}
      <div className="px-5 mt-3">
        <div className="bg-white rounded-2xl flex items-center gap-2 px-3.5 py-2.5 border border-primary/5">
          <Search size={13} className="text-primary/40" />
          <span className="text-[10px] text-primary/40">
            Search books, notes, courses…
          </span>
        </div>
      </div>

      {/* hero card */}
      <div className="px-5 mt-3">
        <div className="relative p-4 overflow-hidden rounded-2xl bg-primary">
          <div className="absolute w-24 h-24 rounded-full -top-6 -right-6 bg-gold/30 blur-2xl" />
          <div className="absolute bottom-0 right-0 w-16 h-16 rounded-full bg-mint/20 blur-xl" />
          <div className="relative">
            <p className="text-[9px] uppercase tracking-wider text-gold font-medium">
              Today's pick
            </p>
            <p className="mt-1 text-sm leading-tight font-display text-cream">
              Discover your next
              <br />
              favourite read
            </p>
            <button className="mt-2.5 bg-gold text-primary text-[10px] font-semibold px-3 py-1.5 rounded-lg">
              Explore now
            </button>
          </div>
          <div className="absolute h-16 right-2 bottom-2 w-14">
            <div className="absolute inset-0 rounded-lg bg-mint rotate-6" />
            <BookCover
              book={FEATURED_BOOKS[0]}
              className="absolute inset-0 rounded-lg -rotate-3 shadow-soft"
            />
          </div>
        </div>
      </div>

      {/* categories */}
      <div className="flex items-center justify-between px-5 mt-3">
        <p className="font-display text-[11px] text-primary">Categories</p>
        <span className="text-[9px] text-gold font-medium">See all</span>
      </div>
      <div className="mt-2 flex gap-1.5 overflow-hidden px-5">
        {categories.map((c, i) => (
          <span
            key={c}
            className={`shrink-0 text-[9px] px-2.5 py-1.5 rounded-lg font-medium ${
              i === 0 ? "bg-primary text-cream" : "bg-mint text-primary"
            }`}
          >
            {c}
          </span>
        ))}
      </div>

      {/* continue reading */}
      <div className="px-5 mt-3">
        <div className="bg-white rounded-xl p-2 border border-primary/5 flex items-center gap-2.5">
          <BookCover
            book={FEATURED_BOOKS[2]}
            className="w-8 rounded-md h-11 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium text-primary truncate">
              {FEATURED_BOOKS[2].title}
            </p>
            <p className="text-[9px] text-primary/50 truncate">
              {FEATURED_BOOKS[2].author}
            </p>
            <div className="mt-1 h-0.5 rounded-full bg-mint overflow-hidden">
              <div className="w-1/2 h-full rounded-full bg-gold" />
            </div>
          </div>
          <div className="grid w-6 h-6 rounded-full bg-primary place-items-center shrink-0">
            <Play size={10} className="text-cream fill-cream ml-0.5" />
          </div>
        </div>
      </div>

      {/* featured grid */}
      <div className="flex items-center justify-between px-5 mt-3">
        <p className="font-display text-[11px] text-primary">Featured</p>
        <span className="text-[9px] text-gold font-medium">View all</span>
      </div>
      <div className="mt-2 px-5 grid grid-cols-2 gap-2.5">
        {books.map((b) => (
          <div
            key={b.id}
            className="p-2 bg-white border rounded-xl border-primary/5"
          >
            <BookCover
              book={b}
              className="w-full h-20 rounded-lg"
              overlay={
                <div className="absolute bottom-1 right-1 bg-cream/90 backdrop-blur-sm rounded px-1 py-0.5 flex items-center gap-0.5">
                  <Star size={7} className="text-gold fill-gold" />
                  <span className="text-[7px] font-medium text-primary">
                    4.8
                  </span>
                </div>
              }
            />
            <p className="text-[10px] font-medium text-primary mt-1.5 line-clamp-1">
              {b.title}
            </p>
            <p className="text-[9px] text-primary/50 line-clamp-1">
              {b.author}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  BookCover                                                          */
/* ------------------------------------------------------------------ */
function BookCover({ book, className = "", overlay = null }) {
  const [errored, setErrored] = useState(false);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!errored ? (
        <img
          src={book.cover}
          alt={`${book.title} cover`}
          loading="lazy"
          onError={() => setErrored(true)}
          className="object-cover w-full h-full"
        />
      ) : (
        <div
          className={`w-full h-full ${book.fallback} p-2 flex flex-col justify-between`}
        >
          <BookOpen size={11} className="text-cream/70" />
          <div>
            <p className="text-cream text-[8px] font-medium leading-tight line-clamp-2">
              {book.title}
            </p>
            <div className="mt-1 h-0.5 w-1/2 rounded bg-cream/40" />
          </div>
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-primary/10" />
      {overlay}
    </div>
  );
}
