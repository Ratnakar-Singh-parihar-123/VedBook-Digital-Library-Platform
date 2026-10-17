import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  BookOpen,
  Calendar,
  Languages,
  Bookmark,
  Share2,
  Star,
  Check,
  ArrowRight,
  BookMarked,
  Clock,
  Sparkles,
} from "lucide-react";
import { isFavorite, toggleFavorite, addRecentlyViewed, getReadingProgress } from "../../utils/libraryStorage";
import { useToast } from "../../context/ToastContext";

/* ------------------------------------------------------------------ */
/*  Cover Palettes & URL Resolver                                      */
/* ------------------------------------------------------------------ */
const COVER_PALETTES = [
  { from: "#1A4A3E", to: "#0B241C", text: "#FAF7F0", muted: "rgba(250,247,240,0.55)", accent: "#D6B56D" },
  { from: "#B08F4A", to: "#6E5A2A", text: "#FAF7F0", muted: "rgba(250,247,240,0.6)", accent: "#FAF7F0" },
  { from: "#2A5E4E", to: "#0F2B22", text: "#FAF7F0", muted: "rgba(250,247,240,0.55)", accent: "#D6B56D" },
  { from: "#D6B56D", to: "#8E7538", text: "#173F35", muted: "rgba(23,63,53,0.7)", accent: "#173F35" },
  { from: "#3A6A55", to: "#152E24", text: "#FAF7F0", muted: "rgba(250,247,240,0.55)", accent: "#D6B56D" },
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

export default function BookDetailModal({ book, isOpen, onClose }) {
  const navigate = useNavigate();
  const toast = useToast();
  const modalRef = useRef(null);
  const [imgError, setImgError] = useState(false);
  const [fav, setFav] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);

  const bookId = book?.id || book?._id;
  const progress = bookId ? getReadingProgress(bookId) : null;

  useEffect(() => {
    if (bookId) {
      setFav(isFavorite(bookId));
      setImgError(false);
      setShowFullDesc(false);
    }
  }, [bookId]);

  /* Keyboard escape */
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  /* Lock body scroll */
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen || !book) return null;

  const title = book.title || "Untitled Book";
  const author = book.author || "Unknown Author";
  const description =
    book.description ||
    "An insightful classical text and digital edition carefully preserved for students, scholars, and readers in the VedBook digital library.";
  const category = book.category || "General";
  const language = book.language || "English";
  const publishedYear = book.published_year || book.publishedYear || null;
  const pages = book.pages || book.totalPages || null;
  const coverSrc = resolveCoverUrl(book.cover || book.cover_image || book.coverUrl);

  const handleStartReading = () => {
    addRecentlyViewed(book);
    onClose();
    navigate(`/read/${bookId}`, { state: { book } });
  };

  const handleToggleBookmark = (e) => {
    e.stopPropagation();
    const isNowFav = toggleFavorite(book);
    setFav(isNowFav);
    if (isNowFav) {
      toast.success(`"${title}" saved to your bookmarks.`);
    } else {
      toast.info(`"${title}" removed from bookmarks.`);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/read/${bookId}`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success("Book link copied to clipboard!");
        setTimeout(() => setCopied(false), 2500);
      } else {
        toast.info(url);
      }
    } catch {
      toast.info(url);
    }
  };

  // Auto cover styling
  const seed = hashString(`${title}-${bookId || ""}`);
  const p = COVER_PALETTES[seed % COVER_PALETTES.length];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-book-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 bg-primary/60 backdrop-blur-sm transition-opacity animate-fade-in"
      />

      {/* Modal Dialog */}
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl bg-cream border border-primary/10 rounded-3xl shadow-hover overflow-hidden flex flex-col max-h-[90vh] z-10 animate-fade-up"
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-primary/10 bg-white/70 backdrop-blur-sm shrink-0">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary/60">
            <Sparkles size={13} className="text-gold" />
            Book Details
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close book details"
            className="w-8 h-8 rounded-full bg-cream border border-primary/10 text-primary/60 hover:text-primary hover:bg-mint transition grid place-items-center"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
          <div className="grid sm:grid-cols-[190px_1fr] gap-6 sm:gap-8 items-start">
            {/* Book Cover */}
            <div className="relative mx-auto sm:mx-0 w-44 sm:w-full aspect-[5/7] rounded-2xl overflow-hidden shadow-card border border-primary/10 shrink-0">
              {coverSrc && !imgError ? (
                <img
                  src={coverSrc}
                  alt={`${title} cover`}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex flex-col justify-between p-4 relative"
                  style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-black/20" />
                  <span
                    className="text-[10px] uppercase font-bold tracking-wider"
                    style={{ color: p.accent }}
                  >
                    {category}
                  </span>
                  <div className="my-auto">
                    <h4
                      className="font-display text-base leading-tight font-bold"
                      style={{ color: p.text }}
                    >
                      {title}
                    </h4>
                    <div className="mt-2 h-0.5 w-8 rounded-full" style={{ background: p.accent }} />
                  </div>
                  <p className="text-xs" style={{ color: p.muted }}>
                    {author}
                  </p>
                </div>
              )}
            </div>

            {/* Book Info */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge-mint text-[11px] uppercase tracking-wider">
                  {category}
                </span>
                <span className="badge-gold text-[11px] font-semibold">
                  {language}
                </span>
                {progress?.page && (
                  <span className="inline-flex items-center gap-1 bg-primary text-cream text-[10px] font-medium px-2.5 py-1 rounded-full">
                    <BookMarked size={11} className="text-gold" />
                    Page {progress.page}
                  </span>
                )}
              </div>

              <div>
                <h3
                  id="modal-book-title"
                  className="text-2xl sm:text-3xl font-display text-primary leading-tight font-bold"
                >
                  {title}
                </h3>
                <p className="text-sm font-medium text-primary/70 mt-1">
                  By <span className="text-primary font-semibold">{author}</span>
                </p>
              </div>

              {/* Meta stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-3 border-y border-primary/10 text-xs">
                {publishedYear && (
                  <div className="flex items-center gap-2 text-primary/70">
                    <Calendar size={14} className="text-gold shrink-0" />
                    <span>{publishedYear}</span>
                  </div>
                )}
                {pages && (
                  <div className="flex items-center gap-2 text-primary/70">
                    <BookOpen size={14} className="text-gold shrink-0" />
                    <span>{pages} Pages</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-primary/70">
                  <Languages size={14} className="text-gold shrink-0" />
                  <span>{language}</span>
                </div>
                {book?.rating != null ? (
                  <div className="flex items-center gap-1.5 text-primary/70">
                    <Star size={13} className="text-gold fill-gold shrink-0" />
                    <span>{book.rating} Rating</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-primary/70">
                    <Clock size={13} className="text-gold shrink-0" />
                    <span>~{Math.max(15, Math.round((pages || 120) * 1.5))} mins</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary/50 mb-1.5">
                  About this book
                </h4>
                <p
                  className={`text-sm text-primary/75 leading-relaxed ${
                    showFullDesc ? "" : "line-clamp-4"
                  }`}
                >
                  {description}
                </p>
                {description.length > 200 && (
                  <button
                    type="button"
                    onClick={() => setShowFullDesc((v) => !v)}
                    className="mt-1 text-xs font-semibold text-gold hover:underline"
                  >
                    {showFullDesc ? "Show less" : "Read more"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 sm:p-6 border-t border-primary/10 bg-white/70 backdrop-blur-sm flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleBookmark}
              aria-label={fav ? "Remove from bookmarks" : "Save to bookmarks"}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition ${
                fav
                  ? "bg-primary text-gold border-primary"
                  : "bg-white border-primary/15 text-primary hover:bg-mint"
              }`}
            >
              <Bookmark size={14} className={fav ? "fill-gold text-gold" : ""} />
              <span>{fav ? "Bookmarked" : "Bookmark"}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              aria-label="Share book link"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white border border-primary/15 text-primary hover:bg-mint transition"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Share2 size={14} />}
              <span>{copied ? "Link Copied" : "Share"}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleStartReading}
            className="inline-flex items-center justify-center gap-2 bg-primary text-cream px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-light transition shadow-soft hover:scale-[1.01] active:scale-[0.99]"
          >
            <BookOpen size={15} />
            <span>{progress?.page ? `Continue Page ${progress.page}` : "Read Book Now"}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
