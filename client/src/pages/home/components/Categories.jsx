import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Code2,
  GraduationCap,
  Briefcase,
  Heart,
  Landmark,
  Atom,
  Palette,
  Globe2,
  Languages,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Star,
  RefreshCw,
  FolderTree,
} from "lucide-react";

import { categoriesAPI } from "../../../api/adminApi";
import CategorySkeleton from "../../../components/ui/CategorySkeleton";
import ErrorState from "../../../components/ui/ErrorState";
import EmptyState from "../../../components/ui/EmptyState";
import RefreshBanner from "../../../components/ui/RefreshBanner";

/*  Fallback categories (used until API responds)                     */

const DEFAULT_CATEGORIES = [
  {
    id: "fiction",
    label: "Fiction",
    icon: BookOpen,
    count: 1240,
    tagline: "Stories that stay with you",
    tone: "bg-primary",
    accent: "text-gold",
  },
  {
    id: "programming",
    label: "Programming",
    icon: Code2,
    count: 890,
    tagline: "Code, ship, repeat",
    tone: "bg-gold",
    accent: "text-primary",
  },
  {
    id: "exams",
    label: "Competitive",
    icon: GraduationCap,
    count: 640,
    tagline: "UPSC · SSC · JEE · NEET",
    tone: "bg-mint",
    accent: "text-primary",
  },
  {
    id: "business",
    label: "Business",
    icon: Briefcase,
    count: 420,
    tagline: "Strategy, finance, growth",
    tone: "bg-primary/80",
    accent: "text-gold",
  },
  {
    id: "self-help",
    label: "Self-Help",
    icon: Heart,
    count: 380,
    tagline: "Habits, mindset, productivity",
    tone: "bg-gold/80",
    accent: "text-primary",
  },
  {
    id: "history",
    label: "History",
    icon: Landmark,
    count: 310,
    tagline: "Civilizations & revolutions",
    tone: "bg-mint",
    accent: "text-primary",
  },
  {
    id: "science",
    label: "Science",
    icon: Atom,
    count: 275,
    tagline: "Physics, chemistry, biology",
    tone: "bg-primary",
    accent: "text-gold",
  },
  {
    id: "arts",
    label: "Arts & Design",
    icon: Palette,
    count: 220,
    tagline: "Visual, music, craft",
    tone: "bg-gold",
    accent: "text-primary",
  },
  {
    id: "geography",
    label: "Geography",
    icon: Globe2,
    count: 180,
    tagline: "Maps, places, people",
    tone: "bg-mint",
    accent: "text-primary",
  },
  {
    id: "languages",
    label: "Languages",
    icon: Languages,
    count: 160,
    tagline: "Hindi, English & more",
    tone: "bg-primary/80",
    accent: "text-gold",
  },
];

/*  Page                                                               */

export default function Categories() {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(false);
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
        const res = await categoriesAPI.listPublic();
        if (cancelled) return;

        const raw = res?.data || {};
        const arr =
          (Array.isArray(raw.categories) && raw.categories) ||
          (Array.isArray(raw.data) && raw.data) ||
          (Array.isArray(raw) && raw) ||
          [];

        if (arr.length > 0) {
          const mapped = arr.map((c, i) => {
            const fallback = DEFAULT_CATEGORIES[i % DEFAULT_CATEGORIES.length];
            return {
              id: c.slug || c.id || c._id || `cat-${i}`,
              label: c.name || c.title || "Category",
              icon: fallback.icon,
              count: c.book_count ?? c.bookCount ?? fallback.count,
              tagline: c.description || fallback.tagline,
              tone: fallback.tone,
              accent: fallback.accent,
            };
          });
          setCategories(mapped);
        } else {
          setCategories(DEFAULT_CATEGORIES);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err?.message || "");
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

  return (
    <div className="min-h-screen bg-cream">
      {/* ================= PAGE HEADER ================= */}
      <section className="relative overflow-hidden border-b border-primary/10">
        <div className="absolute rounded-full -top-32 -right-32 w-96 h-96 bg-gold/15 blur-3xl" />
        <div className="absolute rounded-full top-20 -left-24 w-72 h-72 bg-mint blur-3xl" />

        <div className="relative px-5 py-12 mx-auto text-center max-w-7xl md:py-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="inline-flex items-center gap-2 bg-mint text-primary text-xs font-medium px-3 py-1.5 rounded-full border border-primary/5">
              <Sparkles size={12} className="text-gold" />
              {categories.length} curated categories
            </span>

            <button
              type="button"
              onClick={() => setRefreshKey((k) => k + 1)}
              disabled={loading || isRefreshing}
              aria-label="Refresh categories"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-primary/10 text-primary rounded-full hover:bg-mint transition disabled:opacity-50 shadow-soft"
            >
              <RefreshCw
                size={12}
                className={
                  loading || isRefreshing ? "animate-spin text-gold" : ""
                }
              />
              <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
            </button>
          </div>

          <h1 className="mt-3 text-3xl tracking-tight font-display md:text-5xl text-primary">
            Browse by <span className="text-gold">category.</span>
          </h1>

          <p className="max-w-xl mx-auto mt-4 text-sm text-primary/60 md:text-base">
            Every subject, every genre — organised to help you find your next
            read in seconds. Pick a category and dive in.
          </p>

          {/* Stats row */}
          <div className="inline-flex flex-wrap items-center justify-center gap-6 px-6 py-4 mt-8 border md:gap-10 bg-white/60 backdrop-blur-sm border-primary/10 rounded-2xl">
            {[
              { k: "10K+", l: "Titles" },
              { k: `${categories.length}`, l: "Categories" },
              { k: "4.8", l: "Avg rating", icon: Star },
            ].map(({ k, l, icon: Icon }) => (
              <div key={l} className="text-center">
                <p className="font-display text-2xl text-primary flex items-center justify-center gap-1.5">
                  {Icon && <Icon size={16} className="text-gold fill-gold" />}
                  {k}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-primary/50 mt-0.5">
                  {l}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= GRID ================= */}
      <section className="px-5 py-10 mx-auto max-w-7xl md:py-14">
        {isRefreshing && (
          <div className="flex justify-center mb-6">
            <RefreshBanner message="Updating categories from server..." />
          </div>
        )}

        {error && (
          <div className="mb-6">
            <ErrorState
              compact
              title="Notice"
              message={error}
              onRetry={() => setRefreshKey((k) => k + 1)}
              retrying={isRefreshing}
            />
          </div>
        )}

        {loading ? (
          <CategorySkeleton count={6} />
        ) : categories.length === 0 ? (
          <EmptyState
            icon={FolderTree}
            title="No categories found"
            description="Categories will appear here once configured."
            actionLabel="Refresh categories"
            onAction={() => setRefreshKey((k) => k + 1)}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-5">
            {categories.map(
              ({ id, label, icon: Icon, count, tagline, tone, accent }) => (
                <Link
                  key={id}
                  to={`/explore?category=${encodeURIComponent(label)}`}
                  className="relative p-5 overflow-hidden transition-all bg-white border group border-primary/5 rounded-3xl hover:shadow-soft hover:-translate-y-1"
                >
                  {/* Decorative corner blur */}
                  <div
                    className={`absolute -top-12 -right-12 w-32 h-32 rounded-full ${tone} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`}
                  />

                  <div className="relative flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl ${tone} grid place-items-center shrink-0`}
                    >
                      <Icon size={20} className={accent} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg leading-tight font-display text-primary">
                        {label}
                      </h3>
                      <p className="mt-1 text-xs text-primary/50 line-clamp-1">
                        {tagline}
                      </p>
                    </div>
                  </div>

                  <div className="relative flex items-center justify-between mt-5">
                    <span className="text-[11px] uppercase tracking-wider text-primary/40">
                      {count.toLocaleString()} titles
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium transition-all text-gold group-hover:gap-2">
                      Browse
                      <ArrowRight size={13} />
                    </span>
                  </div>
                </Link>
              ),
            )}
          </div>
        )}
      </section>

      {/* ================= TRENDING / CTA ================= */}
      <section className="px-5 pb-16 mx-auto max-w-7xl">
        <div className="relative p-8 overflow-hidden rounded-3xl bg-primary md:p-12">
          <div className="absolute rounded-full -top-20 -right-20 w-72 h-72 bg-gold/25 blur-3xl" />
          <div className="absolute rounded-full -bottom-20 -left-20 w-72 h-72 bg-mint/15 blur-3xl" />

          <div className="relative grid items-center gap-8 md:grid-cols-2">
            <div>
              <div className="grid w-11 h-11 rounded-2xl bg-gold text-primary place-items-center">
                <TrendingUp size={20} />
              </div>
              <h2 className="mt-4 text-2xl leading-tight font-display md:text-3xl text-cream">
                Not sure where to start?
              </h2>
              <p className="max-w-md mt-3 text-sm text-cream/70 md:text-base">
                Explore our handpicked trending titles and reader favourites —
                updated every week.
              </p>

              <div className="flex flex-wrap gap-3 mt-6">
                <Link
                  to="/explore?sort=popular"
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium transition bg-gold text-primary rounded-2xl hover:bg-gold/90"
                >
                  View trending <ArrowRight size={15} />
                </Link>
                <Link
                  to="/explore"
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium transition border bg-cream/10 text-cream rounded-2xl border-cream/15 hover:bg-cream/20"
                >
                  Explore all
                </Link>
              </div>
            </div>

            {/* Mini stat tiles */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { k: "120+", l: "New this week" },
                { k: "50+", l: "Hindi titles" },
                { k: "890", l: "Programming" },
                { k: "640", l: "Exam prep" },
              ].map(({ k, l }) => (
                <div
                  key={l}
                  className="p-4 border bg-cream/5 border-cream/10 rounded-2xl backdrop-blur-sm"
                >
                  <p className="text-2xl font-display text-gold">{k}</p>
                  <p className="text-[11px] text-cream/60 mt-1 uppercase tracking-wider">
                    {l}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
