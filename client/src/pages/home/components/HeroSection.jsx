import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Download,
  Languages,
  Sparkles,
  Users,
  GraduationCap,
  Wifi,
  Battery,
  Signal,
  Bell,
  Home,
  Library,
  BookMarked,
  User,
  Play,
  Star,
  Search,
} from "lucide-react";

/*  Config                                                             */

const POPULAR_SEARCHES = ["Clean Code", "DSA Notes", "UPSC", "Hindi Novels"];

const FEATURE_CHIPS = [
  { icon: BookOpen, label: "10,000+ titles" },
  { icon: Download, label: "Offline reading" },
  { icon: Languages, label: "Hindi & English" },
  { icon: Sparkles, label: "AI study assist" },
];

const STATS = [
  { icon: BookOpen, value: "10K+", label: "BOOKS" },
  { icon: GraduationCap, value: "500+", label: "COURSES" },
  { icon: Users, value: "25K+", label: "READERS" },
];

/*  Hero Section                                                       */

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden border-b bg-cream border-primary/10">
      {/* Ambient glows */}
      <div className="absolute -top-36 -right-36 w-[34rem] h-[34rem] rounded-full bg-gold/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-32 w-[28rem] h-[28rem] rounded-full bg-mint/60 blur-3xl pointer-events-none" />

      {/* Subtle grid pattern */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(23,63,53,1) 1px, transparent 1px), linear-gradient(90deg, rgba(23,63,53,1) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse at center, black 40%, transparent 85%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 40%, transparent 85%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-5 py-14 sm:py-20 lg:py-24 grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-center">
        {/* ================= LEFT COLUMN ================= */}
        <div className="space-y-7">
          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 border rounded-full bg-white/80 border-primary/10 shadow-soft backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-gold" />
            <span className="text-xs font-semibold text-primary">
              Trusted by 12,000+ readers
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl text-primary font-bold tracking-tight leading-[1.03]">
            Your entire library, <br />
            <span className="relative inline-block text-gold">
              in your pocket.
              <span
                aria-hidden="true"
                className="absolute left-0 right-0 h-1 rounded-full -bottom-2 bg-gold/40"
              />
            </span>
          </h1>

          {/* Subtext */}
          <p className="max-w-xl text-base leading-relaxed sm:text-lg text-primary/70">
            Books, e-books, PDFs, study notes, and courses — all in one
            beautifully simple platform. Read in{" "}
            <span className="font-semibold text-primary">Hindi</span> or{" "}
            <span className="font-semibold text-primary">English</span>,
            anytime, anywhere.
          </p>

          {/* Feature chips */}
          <div className="flex flex-wrap items-center gap-2">
            {FEATURE_CHIPS.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 bg-white/80 border border-primary/10 px-3 py-1.5 rounded-full text-xs font-medium text-primary shadow-soft"
              >
                <Icon size={13} className="text-gold shrink-0" />
                {label}
              </span>
            ))}
          </div>

          {/* Popular searches */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-primary/60">
            <span className="font-semibold text-primary/80">Popular:</span>
            {POPULAR_SEARCHES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() =>
                  navigate(`/explore?q=${encodeURIComponent(item)}`)
                }
                className="px-2.5 py-1 rounded-full bg-white/70 border border-primary/10 hover:bg-mint hover:border-primary/20 transition-colors"
              >
                {item}
              </button>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 bg-primary text-cream font-semibold px-6 py-3.5 rounded-xl text-sm shadow-soft hover:bg-primary/90 transition hover:scale-[1.02] active:scale-[0.98]"
            >
              Explore Library
              <ArrowRight size={16} />
            </Link>
            <a
              href="/apk/VedBook-release.apk"
              download="VedBook-v1.0.4.apk"
              className="inline-flex items-center gap-2 bg-white border border-primary/15 text-primary font-semibold px-6 py-3.5 rounded-xl text-sm hover:bg-mint transition"
            >
              <Download size={16} className="text-gold" />
              Download App
            </a>
          </div>

          {/* Stats */}
          <div className="grid max-w-md grid-cols-3 gap-6 pt-8 border-t border-primary/10">
            {STATS.map(({ icon: Icon, value, label }) => (
              <div key={label}>
                <div className="flex items-center gap-1.5 text-primary/50">
                  <Icon size={13} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {label}
                  </span>
                </div>
                <p className="mt-1 text-3xl font-bold font-display text-primary">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ================= RIGHT COLUMN — PHONE MOCKUP ================= */}
        <div className="relative flex justify-center lg:justify-end">
          <PhoneMockup />
        </div>
      </div>
    </section>
  );
}

/*  Phone Mockup — realistic titanium device                           */

function PhoneMockup() {
  return (
    <div className="relative w-full max-w-[320px] mx-auto lg:mx-0">
      {/* Ambient glow behind phone */}
      <div className="absolute -inset-12 bg-gold/15 rounded-[5rem] blur-3xl pointer-events-none" />
      <div className="absolute -inset-6 bg-primary/10 rounded-[4rem] blur-2xl pointer-events-none" />

      {/* Drop shadow beneath device */}
      <div className="absolute h-10 rounded-full pointer-events-none -bottom-6 left-10 right-10 bg-primary/30 blur-2xl" />

      {/* ---------- Titanium outer ring ---------- */}
      <div
        className="relative rounded-[3rem] p-[3px] bg-gradient-to-b from-zinc-500 via-zinc-800 to-zinc-600
                   shadow-[0_40px_80px_-20px_rgba(0,0,0,0.55),0_0_0_0.5px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.25)]"
      >
        {/* Side buttons — sit on the metal ring */}
        <div className="absolute -left-[4px] top-24 w-[4px] h-8 rounded-l-md bg-gradient-to-r from-zinc-700 to-zinc-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]" />
        <div className="absolute -left-[4px] top-40 w-[4px] h-12 rounded-l-md bg-gradient-to-r from-zinc-700 to-zinc-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]" />
        <div className="absolute -left-[4px] top-[13.5rem] w-[4px] h-12 rounded-l-md bg-gradient-to-r from-zinc-700 to-zinc-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]" />
        <div className="absolute -right-[4px] top-32 w-[4px] h-16 rounded-r-md bg-gradient-to-l from-zinc-700 to-zinc-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]" />

        {/* ---------- Black bezel ---------- */}
        <div className="rounded-[2.85rem] p-[3px] bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
          {/* ---------- Screen ---------- */}
          <div className="relative bg-cream rounded-[2.7rem] overflow-hidden">
            {/* Status bar + Dynamic Island */}
            <div className="relative flex items-center justify-between px-6 pt-3 pb-1 text-[10px] font-semibold text-primary">
              <span>9:41</span>

              {/* Dynamic island with camera dot */}
              <div className="absolute left-1/2 -translate-x-1/2 top-2 w-[80px] h-[22px] bg-black rounded-full flex items-center justify-end pr-2 shadow-[inset_0_0_4px_rgba(0,0,0,0.6)]">
                <div className="w-[7px] h-[7px] rounded-full bg-zinc-900 ring-1 ring-zinc-700/60 flex items-center justify-center">
                  <div className="w-[2px] h-[2px] rounded-full bg-blue-500/50" />
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Signal size={9} strokeWidth={2.5} />
                <Wifi size={9} strokeWidth={2.5} />
                <Battery size={11} strokeWidth={2.5} />
              </div>
            </div>

            {/* ---------- Content ---------- */}
            <div className="px-4 pt-2 pb-3 space-y-3">
              {/* Greeting */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-primary/50">Good morning</p>
                  <p className="text-sm font-bold text-primary font-display">
                    Aarav 👋
                  </p>
                </div>
                <button
                  type="button"
                  className="grid bg-white border rounded-full shadow-sm w-7 h-7 border-primary/10 place-items-center"
                >
                  <Bell size={11} className="text-primary" />
                </button>
              </div>

              {/* Search bar */}
              <div className="flex items-center gap-2 px-3 py-2 bg-white border rounded-full shadow-sm border-primary/10">
                <Search size={11} className="text-primary/40 shrink-0" />
                <span className="text-[10px] text-primary/40 truncate">
                  Search books, notes, courses...
                </span>
              </div>

              {/* Today's pick card */}
              <div className="relative p-3 overflow-hidden bg-primary rounded-2xl">
                <div className="absolute w-24 h-24 rounded-full pointer-events-none -right-6 -bottom-6 bg-gold/25 blur-2xl" />
                <div className="relative flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-gold">
                      Today's Pick
                    </span>
                    <p className="text-[11px] font-semibold text-cream mt-1 leading-tight">
                      Discover your next favourite read
                    </p>
                    <button
                      type="button"
                      className="mt-2 bg-gold text-primary text-[9px] font-bold px-2.5 py-1 rounded-md hover:bg-gold/90 transition"
                    >
                      Explore now
                    </button>
                  </div>

                  {/* Stacked book cover — realistic */}
                  <div className="relative w-12 h-16 shrink-0">
                    {/* shadow beneath */}
                    <div className="absolute -bottom-1 left-1 right-1 h-1.5 bg-black/40 blur-md rounded-full" />
                    <div className="absolute inset-0 rotate-[6deg] rounded-r-[3px] rounded-l-[2px] shadow-[2px_4px_10px_rgba(0,0,0,0.6)] overflow-hidden bg-gradient-to-br from-amber-700 via-amber-900 to-stone-900">
                      {/* spine */}
                      <div className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-r from-black/60 to-black/20" />
                      <div className="absolute inset-y-0 left-[3px] w-[0.5px] bg-amber-200/40" />
                      {/* page edge */}
                      <div className="absolute inset-y-0.5 right-0 w-[1px] bg-amber-100/60" />
                      <div className="absolute inset-y-1 right-[1.5px] w-[0.5px] bg-amber-100/30" />
                      {/* gloss */}
                      <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-transparent to-white/15" />
                      {/* cover content */}
                      <div className="absolute inset-0 pl-[5px] pr-[2px] py-1.5 flex flex-col items-center text-center">
                        <span className="text-[2.5px] font-bold uppercase tracking-[0.25em] text-gold/80">
                          A Novel
                        </span>
                        <div className="w-4 h-[0.5px] bg-gold/50 my-0.5" />
                        <p className="text-[5px] font-bold text-cream leading-[1.05]">
                          The Midnight Library
                        </p>
                        <div className="w-4 h-[0.5px] bg-gold/50 my-0.5" />
                        <p className="text-[3.5px] text-gold/90 mt-auto">
                          Matt Haig
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-primary">
                  Categories
                </span>
                <span className="text-[9px] text-gold font-semibold">
                  See all
                </span>
              </div>

              {/* Deep Work row */}
              <div className="flex items-center gap-2 p-2 bg-white border shadow-sm rounded-xl border-primary/10">
                <div className="relative w-8 h-10 shrink-0">
                  <div className="absolute -bottom-0.5 left-0.5 right-0.5 h-1 bg-black/25 blur-sm rounded-full" />
                  <div className="relative w-full h-full rounded-r-[3px] rounded-l-[2px] shadow-md overflow-hidden bg-gradient-to-br from-red-500 to-red-700">
                    {/* spine */}
                    <div className="absolute inset-y-0 left-0 w-[2px] bg-gradient-to-r from-black/50 to-black/20" />
                    {/* page edge */}
                    <div className="absolute inset-y-0.5 right-0 w-[1px] bg-white/60" />
                    {/* gloss */}
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-transparent to-white/20" />
                    {/* cover content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center px-1 py-1 text-center">
                      <p className="text-[4.5px] font-bold text-white uppercase tracking-wide leading-[1.1]">
                        Deep Work
                      </p>
                      <div className="w-3 h-[0.5px] bg-white/60 my-0.5" />
                      <p className="text-[3px] text-white/85 uppercase tracking-wider">
                        Cal Newport
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-primary truncate">
                    Deep Work
                  </p>
                  <p className="text-[9px] text-primary/50 truncate">
                    Cal Newport
                  </p>
                </div>
                <button
                  type="button"
                  className="grid w-6 h-6 transition rounded-full bg-primary place-items-center shrink-0 hover:bg-primary/90"
                >
                  <Play size={9} className="text-cream fill-cream ml-0.5" />
                </button>
              </div>

              {/* Featured */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-primary">
                  Featured
                </span>
                <span className="text-[9px] text-gold font-semibold">
                  View all
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <BookThumb
                  title="Clean Code"
                  author="Robert C. Martin"
                  rating="4.8"
                  gradient="from-stone-800 to-stone-900"
                  accent="text-stone-300"
                />
                <BookThumb
                  title="Atomic Habits"
                  author="James Clear"
                  rating="4.8"
                  gradient="from-amber-100 to-amber-300"
                  accent="text-amber-900"
                />
              </div>
            </div>

            {/* Bottom nav */}
            <div className="grid grid-cols-4 gap-1 px-2 pt-2 pb-4 border-t border-primary/10 bg-cream">
              {[
                { icon: Home, label: "Home", active: true },
                { icon: Library, label: "Library" },
                { icon: BookMarked, label: "Read" },
                { icon: User, label: "Profile" },
              ].map(({ icon: Icon, label, active }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-0.5 py-1"
                >
                  <Icon
                    size={13}
                    strokeWidth={active ? 2.5 : 1.8}
                    className={active ? "text-primary" : "text-primary/40"}
                  />
                  <span
                    className={`text-[8px] font-semibold ${
                      active ? "text-primary" : "text-primary/40"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* Home indicator */}
            <div className="absolute w-20 h-1 -translate-x-1/2 rounded-full bottom-1 left-1/2 bg-primary/30" />

            {/* Screen glass reflection (very subtle) */}
            <div className="absolute inset-0 pointer-events-none rounded-[2.7rem] bg-gradient-to-br from-white/[0.06] via-transparent to-transparent" />
          </div>
        </div>
      </div>
    </div>
  );
}

/*  Book thumbnail — realistic cover look                              */

function BookThumb({ title, author, rating, gradient, accent }) {
  return (
    <div>
      <div className="relative">
        {/* Book drop shadow beneath */}
        <div className="absolute -bottom-0.5 left-1 right-1 h-1.5 bg-black/25 blur-[3px] rounded-full" />

        <div
          className={`relative aspect-[4/5] bg-gradient-to-br ${gradient} rounded-r-md rounded-l-[3px] overflow-hidden
                     shadow-[2px_3px_10px_rgba(0,0,0,0.35),inset_0_0_24px_rgba(0,0,0,0.12)]`}
        >
          {/* Spine — multi-layer */}
          <div className="absolute inset-y-0 left-0 w-[5px] bg-gradient-to-r from-black/60 via-black/35 to-transparent" />
          <div className="absolute inset-y-0 left-[5px] w-[0.5px] bg-white/25" />

          {/* Page edges — stacked thin lines on right */}
          <div className="absolute inset-y-0.5 right-0 w-[2px] bg-gradient-to-b from-white/70 via-white/50 to-white/70" />
          <div className="absolute inset-y-1 right-[2px] w-[0.5px] bg-white/45" />
          <div className="absolute inset-y-1.5 right-[2.5px] w-[0.5px] bg-white/30" />

          {/* Gloss highlights */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-transparent to-white/20" />
          <div className="absolute w-full h-full rotate-45 pointer-events-none -top-1/2 -left-1/2 bg-gradient-to-br from-white/10 to-transparent" />

          {/* Cover content */}
          <div className="absolute inset-0 pl-[9px] pr-[4px] pt-2 pb-1.5 flex flex-col">
            <p
              className={`text-[7px] font-bold ${accent} leading-[1.1] uppercase tracking-wide`}
            >
              {title}
            </p>
            <div className={`w-4 h-[0.5px] ${accent} opacity-50 mt-1`} />
            <p
              className={`text-[4px] ${accent} opacity-75 mt-auto tracking-wide uppercase`}
            >
              {author}
            </p>
          </div>

          {/* Rating badge */}
          <div className="absolute top-1 right-1 bg-white/95 rounded px-1 py-0.5 flex items-center gap-0.5 shadow-sm">
            <Star size={6} className="fill-gold text-gold" />
            <span className="text-[7px] font-bold text-primary">{rating}</span>
          </div>
        </div>
      </div>

      <p className="text-[9px] font-bold text-primary mt-1 truncate">{title}</p>
      <p className="text-[8px] text-primary/50 truncate">{author}</p>
    </div>
  );
}
