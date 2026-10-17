import { Link } from "react-router-dom";
import {
  BookOpen,
  Target,
  Users,
  Heart,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Globe2,
  Languages,
  Quote,
  Rocket,
  GraduationCap,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */
const VALUES = [
  {
    icon: ShieldCheck,
    title: "Authentic & Licensed",
    desc: "Only public-domain, licensed, or authorized content ever makes it to the shelf.",
  },
  {
    icon: Globe2,
    title: "Bilingual by Design",
    desc: "Every experience is built for Hindi and English readers from day one.",
  },
  {
    icon: Heart,
    title: "Reader First",
    desc: "Clean interface, no clutter, no distractions — just you and the book.",
  },
  {
    icon: Rocket,
    title: "Fast & Lightweight",
    desc: "Built with modern web tech so pages load instantly, even on slow networks.",
  },
];

const TIMELINE = [
  {
    year: "2023",
    title: "The idea",
    desc: "Frustrated by scattered PDFs and paywalled platforms, VedBook began as a simple idea — a clean shelf for every learner.",
  },
  {
    year: "2024",
    title: "First library",
    desc: "We curated our first 1,000 titles across programming, exams, and fiction — with a focus on Hindi content.",
  },
  {
    year: "2025",
    title: "Community grows",
    desc: "Readers from 20+ Indian states joined, contributing notes and asking for more. We shipped native mobile apps.",
  },
  {
    year: "2026",
    title: "Where we are now",
    desc: "10,000+ titles, 25,000+ readers, and a growing catalogue of courses and study material — free and premium.",
  },
];

const TEAM = [
  {
    name: "Aarav Sharma",
    role: "Founder & Product",
    initials: "AS",
    tone: "bg-primary",
    accent: "text-gold",
  },
  {
    name: "Priya Verma",
    role: "Content & Curation",
    initials: "PV",
    tone: "bg-gold",
    accent: "text-primary",
  },
  {
    name: "Rohan Iyer",
    role: "Engineering",
    initials: "RI",
    tone: "bg-mint",
    accent: "text-primary",
  },
  {
    name: "Neha Kapoor",
    role: "Design & Research",
    initials: "NK",
    tone: "bg-primary/80",
    accent: "text-gold",
  },
];

export default function About() {
  return (
    <div className="min-h-screen bg-cream">
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden border-b border-primary/10">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-gold/15 blur-3xl" />
        <div className="absolute top-32 -left-24 w-80 h-80 rounded-full bg-mint blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-5 py-14 md:py-20 text-center">
          {/* <nav aria-label="Breadcrumb" className="text-xs text-primary/50 mb-6">
            <ol className="flex items-center justify-center gap-1.5">
              <li>
                <Link to="/" className="hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li aria-hidden="true" className="text-primary/30">
                /
              </li>
              <li className="text-primary font-medium">About</li>
            </ol>
          </nav> */}

          <span className="inline-flex items-center gap-2 bg-mint text-primary text-xs font-medium px-3 py-1.5 rounded-full border border-primary/5">
            <Sparkles size={12} className="text-gold" />
            Our story
          </span>

          <h1 className="font-display text-3xl md:text-5xl lg:text-6xl text-primary mt-5 tracking-tight leading-[1.1]">
            A library built by readers,
            <br />
            <span className="text-gold">for readers.</span>
          </h1>

          <p className="text-primary/60 mt-5 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            VedBook started with a simple frustration — good books were
            scattered across dozens of tabs, half-broken PDFs, and paywalls. We
            decided to build the shelf we always wanted. Clean, bilingual, and
            open to every learner in India and beyond.
          </p>
        </div>
      </section>

      {/* ================= STATS BAND ================= */}
      <section className="max-w-7xl mx-auto px-5 -mt-6 md:-mt-8 relative z-10">
        <div className="bg-white border border-primary/10 rounded-3xl shadow-soft grid grid-cols-2 md:grid-cols-4 divide-x divide-primary/5">
          {[
            { k: "10K+", l: "Titles", icon: BookOpen },
            { k: "25K+", l: "Readers", icon: Users },
            { k: "500+", l: "Courses", icon: GraduationCap },
            { k: "2", l: "Languages", icon: Languages },
          ].map(({ k, l, icon: Icon }) => (
            <div key={l} className="p-5 md:p-6 text-center">
              <div className="w-10 h-10 rounded-xl bg-mint grid place-items-center mx-auto text-primary">
                <Icon size={17} />
              </div>
              <p className="font-display text-2xl md:text-3xl text-primary mt-3">
                {k}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-primary/50 mt-1">
                {l}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= MISSION ================= */}
      <section className="max-w-7xl mx-auto px-5 py-16 md:py-20">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <span className="text-xs uppercase tracking-wider text-gold font-medium">
              Our mission
            </span>
            <h2 className="font-display text-3xl md:text-4xl text-primary mt-3 leading-tight">
              Make knowledge accessible — without borders or barriers.
            </h2>
            <p className="text-primary/70 mt-5 leading-relaxed">
              We believe that a good book, in the right hands at the right time,
              can change the entire trajectory of a person's life. That's why we
              obsess over three things: quality of content, speed of access, and
              respect for the reader's attention.
            </p>
            <p className="text-primary/70 mt-4 leading-relaxed">
              Whether you're a student preparing for exams, a developer
              levelling up, or a reader looking for a quiet corner — VedBook is
              built so that nothing comes between you and the next great idea.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/explore"
                className="inline-flex items-center gap-2 bg-primary text-cream px-5 py-3 rounded-2xl text-sm font-medium hover:bg-primary/90 transition shadow-soft"
              >
                Explore library <ArrowRight size={15} />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 bg-white border border-primary/10 text-primary px-5 py-3 rounded-2xl text-sm font-medium hover:bg-mint transition"
              >
                Get in touch
              </Link>
            </div>
          </div>

          {/* Quote card */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-tr from-gold/20 via-transparent to-mint/30 blur-3xl rounded-3xl" />
            <div className="relative bg-primary rounded-3xl p-8 md:p-10 overflow-hidden">
              <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-gold/25 blur-3xl" />
              <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-mint/15 blur-3xl" />

              <Quote size={32} className="text-gold relative" />
              <p className="relative font-display text-xl md:text-2xl text-cream mt-5 leading-snug">
                A room without books is like a body without a soul.
              </p>
              <p className="relative text-cream/60 text-sm mt-5">
                — Marcus Tullius Cicero
              </p>

              <div className="relative mt-8 pt-6 border-t border-cream/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold grid place-items-center">
                  <Target size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-cream text-sm font-medium leading-tight">
                    Free forever for learners
                  </p>
                  <p className="text-cream/50 text-[11px] mt-0.5">
                    Premium coming later, never required
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= VALUES ================= */}
      <section className="bg-white border-y border-primary/10">
        <div className="max-w-7xl mx-auto px-5 py-16 md:py-20">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-wider text-gold font-medium">
              What we value
            </span>
            <h2 className="font-display text-3xl md:text-4xl text-primary mt-3">
              Four principles we don't compromise on.
            </h2>
          </div>

          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {VALUES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-cream rounded-3xl p-6 border border-primary/5 hover:shadow-soft hover:-translate-y-1 transition-all"
              >
                <div className="w-11 h-11 rounded-2xl bg-primary text-gold grid place-items-center">
                  <Icon size={18} />
                </div>
                <h3 className="font-display text-lg text-primary mt-4">
                  {title}
                </h3>
                <p className="text-sm text-primary/60 mt-2 leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= TIMELINE ================= */}
      <section className="max-w-7xl mx-auto px-5 py-16 md:py-20">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs uppercase tracking-wider text-gold font-medium">
            Our journey
          </span>
          <h2 className="font-display text-3xl md:text-4xl text-primary mt-3">
            From one shelf to ten thousand.
          </h2>
        </div>

        <div className="mt-12 relative">
          {/* vertical line */}
          <div className="hidden md:block absolute left-1/2 -translate-x-1/2 top-2 bottom-2 w-px bg-primary/10" />

          <div className="space-y-8 md:space-y-12">
            {TIMELINE.map(({ year, title, desc }, i) => {
              const isLeft = i % 2 === 0;
              return (
                <div
                  key={year}
                  className={`grid md:grid-cols-2 gap-6 md:gap-10 items-center ${
                    isLeft ? "" : "md:[&>*:first-child]:order-2"
                  }`}
                >
                  <div
                    className={`${isLeft ? "md:text-right md:pr-12" : "md:pl-12"}`}
                  >
                    <span className="inline-flex items-center gap-2 bg-mint text-primary text-xs font-medium px-3 py-1.5 rounded-full">
                      {year}
                    </span>
                    <h3 className="font-display text-xl md:text-2xl text-primary mt-3">
                      {title}
                    </h3>
                    <p className="text-sm text-primary/60 mt-2 leading-relaxed max-w-md ml-auto">
                      {desc}
                    </p>
                  </div>
                  <div
                    className={`hidden md:block ${isLeft ? "md:pl-12" : "md:pr-12"}`}
                  >
                    <div className="relative">
                      <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-3 h-3 rounded-full bg-gold ring-4 ring-cream" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= TEAM ================= */}
      <section className="bg-white border-y border-primary/10">
        <div className="max-w-7xl mx-auto px-5 py-16 md:py-20">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-wider text-gold font-medium">
              The team
            </span>
            <h2 className="font-display text-3xl md:text-4xl text-primary mt-3">
              Small team, big shelf.
            </h2>
            <p className="text-primary/60 mt-3 text-sm md:text-base">
              Four people, one mission — and a growing community of
              contributors.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-5">
            {TEAM.map(({ name, role, initials, tone, accent }) => (
              <div
                key={name}
                className="text-center bg-cream rounded-3xl p-6 border border-primary/5 hover:shadow-soft transition-shadow"
              >
                <div
                  className={`w-16 h-16 mx-auto rounded-2xl ${tone} grid place-items-center font-display text-xl font-bold ${accent}`}
                >
                  {initials}
                </div>
                <h3 className="font-display text-base text-primary mt-4">
                  {name}
                </h3>
                <p className="text-xs text-primary/50 mt-1">{role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="max-w-7xl mx-auto px-5 py-16">
        <div className="relative overflow-hidden rounded-3xl bg-primary p-8 md:p-14 text-center">
          <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-gold/25 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-mint/15 blur-3xl" />

          <div className="relative">
            <Sparkles size={28} className="text-gold mx-auto" />
            <h2 className="font-display text-3xl md:text-4xl text-cream mt-4 leading-tight">
              Ready to open the first book?
            </h2>
            <p className="text-cream/70 mt-3 max-w-lg mx-auto text-sm md:text-base">
              Free to start. No credit card. Just you, your shelf, and 10,000+
              titles.
            </p>
            <div className="mt-7 flex flex-wrap gap-3 justify-center">
              <Link
                to="/explore"
                className="inline-flex items-center gap-2 bg-gold text-primary px-6 py-3.5 rounded-2xl text-sm font-medium hover:bg-gold/90 transition"
              >
                Start reading now <ArrowRight size={15} />
              </Link>
              <Link
                to="/download"
                className="inline-flex items-center gap-2 bg-cream/10 text-cream border border-cream/15 px-6 py-3.5 rounded-2xl text-sm font-medium hover:bg-cream/20 transition"
              >
                Get mobile app
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
