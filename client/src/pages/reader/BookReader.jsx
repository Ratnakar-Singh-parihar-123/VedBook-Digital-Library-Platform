import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  List,
  X,
  BookOpen,
  Loader2,
  AlertCircle,
  RefreshCw,
  Book,
  BookOpenCheck,
  Bookmark,
  Palette,
  Check,
} from "lucide-react";

import { booksAPI } from "../../api/adminApi";
import {
  getReadingProgress,
  saveReadingProgress,
  addRecentlyViewed,
  isFavorite,
  toggleFavorite,
  getReaderPrefs,
  saveReaderPrefs,
} from "../../utils/libraryStorage";
import { useToast } from "../../context/ToastContext";

/*  PDF.js worker — CDN, matched to react-pdf's bundled version       */

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

/*  Config                                                             */

const ZOOM_STEPS = [75, 100, 125, 150, 200];
const DEFAULT_ZOOM_INDEX = 1;
const MIN_ZOOM = 0;
const MAX_ZOOM = ZOOM_STEPS.length - 1;

const PDF_RATIO = 8.5 / 11;
const SPREAD_GAP = 2; // px between two pages (spine)

const THEMES = {
  forest: {
    id: "forest",
    name: "Forest Midnight",
    bg: "#0B1613",
    headerBg: "rgba(11, 22, 19, 0.75)",
    glow1: "rgba(214,181,109,0.10)",
    glow2: "rgba(228,237,229,0.05)",
  },
  sepia: {
    id: "sepia",
    name: "Warm Sepia",
    bg: "#1D160E",
    headerBg: "rgba(29, 22, 14, 0.75)",
    glow1: "rgba(214,160,109,0.12)",
    glow2: "rgba(140,90,50,0.06)",
  },
  charcoal: {
    id: "charcoal",
    name: "Pure Dark",
    bg: "#111111",
    headerBg: "rgba(17, 17, 17, 0.75)",
    glow1: "rgba(255,255,255,0.04)",
    glow2: "rgba(255,255,255,0.02)",
  },
  cream: {
    id: "cream",
    name: "Emerald Night",
    bg: "#1A2621",
    headerBg: "rgba(26, 38, 33, 0.75)",
    glow1: "rgba(214,181,109,0.14)",
    glow2: "rgba(228,237,229,0.08)",
  },
};

/*  Book Reader                                                        */

export default function BookReader() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const passedBook = location.state?.book || null;

  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(() => {
    const saved = id ? getReadingProgress(id) : null;
    return saved?.page ? Math.max(1, saved.page) : 1;
  });
  const [pdfError, setPdfError] = useState("");
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX);
  const [tocOpen, setTocOpen] = useState(false);
  const [toc, setToc] = useState([]);
  const [fullscreen, setFullscreen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  const [fav, setFav] = useState(() => (id ? isFavorite(id) : false));
  const [themeKey, setThemeKey] = useState(() => {
    const prefs = getReaderPrefs();
    return prefs?.theme && THEMES[prefs.theme] ? prefs.theme : "forest";
  });
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [pageInput, setPageInput] = useState(String(pageNumber));
  const themeMenuRef = useRef(null);

  /* Spread mode: 1 = single, 2 = two-page spread */
  const [spread, setSpread] = useState(() => {
    if (typeof window === "undefined") return 1;
    return window.innerWidth >= 1024 ? 2 : 1;
  });

  const containerRef = useRef(null);
  const readerRef = useRef(null);

  const pdfUrl = useMemo(() => (id ? booksAPI.readPdfUrl(id) : null), [id]);
  const zoom = ZOOM_STEPS[zoomIndex];
  const title = passedBook?.title || "Book";
  const author = passedBook?.author || "";

  // Save reading progress & recently viewed
  useEffect(() => {
    if (id && numPages > 0) {
      saveReadingProgress(id, pageNumber, numPages);
    }
  }, [id, pageNumber, numPages]);

  useEffect(() => {
    if (id) {
      addRecentlyViewed(passedBook || { id, title, author });
    }
  }, [id, passedBook, title, author]);

  // Click outside listener for theme popup
  useEffect(() => {
    if (!themeMenuOpen) return;
    const onClick = (e) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target)) {
        setThemeMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [themeMenuOpen]);

  /* ---------- Force single on small screens ---------- */
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 1024 && spread === 2) setSpread(1);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [spread]);

  /* ---------- Measure viewport ---------- */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () =>
      setViewport({ width: el.clientWidth, height: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ---------- Fullscreen ---------- */
  useEffect(() => {
    const onFsChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  /* ---------- Body scroll lock ---------- */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  /* ---------- Extract TOC ---------- */
  const loadOutline = useCallback(async (pdfDoc) => {
    try {
      const outline = await pdfDoc.getOutline();
      if (!outline) return [];
      const items = [];
      const walk = async (nodes, depth = 0) => {
        for (const node of nodes) {
          let pg = null;
          try {
            if (node.dest) {
              const dest =
                typeof node.dest === "string"
                  ? await pdfDoc.getDestination(node.dest)
                  : node.dest;
              if (dest && dest[0]) {
                const idx = await pdfDoc.getPageIndex(dest[0]);
                pg = idx + 1;
              }
            }
          } catch {
            /* skip */
          }
          items.push({
            title: node.title || "Untitled",
            pageNumber: pg,
            depth,
          });
          if (node.items?.length) await walk(node.items, depth + 1);
        }
      };
      await walk(outline);
      return items;
    } catch {
      return [];
    }
  }, []);

  /* ----------------------------------------------------------------- */
  /*  Page math — for both spread modes                                 */
  /* ----------------------------------------------------------------- */
  const stepSize = spread; // 1 or 2 pages per step

  /* Left page of current spread (in 2-page mode) */
  const leftPage =
    spread === 2
      ? pageNumber % 2 === 1
        ? pageNumber
        : pageNumber - 1
      : pageNumber;

  /* Right page of current spread */
  const rightPage = spread === 2 ? leftPage + 1 : null;
  const rightPageValid = rightPage && rightPage <= numPages;

  /* ---------- Navigation ---------- */
  const goPrev = useCallback(() => {
    setPageNumber((p) => Math.max(1, p - stepSize));
  }, [stepSize]);

  const goNext = useCallback(() => {
    setPageNumber((p) => Math.min(numPages || 1, p + stepSize));
  }, [numPages, stepSize]);

  const goToPage = useCallback(
    (n) => {
      if (!numPages) return;
      let target = Math.min(Math.max(1, n), numPages);
      /* In 2-page mode, snap to odd page (left side of spread) */
      if (spread === 2 && target % 2 === 0) target = Math.max(1, target - 1);
      setPageNumber(target);
    },
    [numPages, spread],
  );

  /* When toggling spread, snap current page appropriately */
  const changeSpread = (nextOrUpdater) => {
    setSpread((prev) => {
      const next =
        typeof nextOrUpdater === "function"
          ? nextOrUpdater(prev)
          : nextOrUpdater;
      if (next === 2) {
        setPageNumber((p) => (p % 2 === 0 ? Math.max(1, p - 1) : p));
      }
      return next;
    });
  };

  /* ---------- Zoom ---------- */
  const zoomIn = () => setZoomIndex((i) => Math.min(MAX_ZOOM, i + 1));
  const zoomOut = () => setZoomIndex((i) => Math.max(MIN_ZOOM, i - 1));
  const zoomReset = () => setZoomIndex(DEFAULT_ZOOM_INDEX);

  /* ---------- Fullscreen ---------- */
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement)
        await readerRef.current?.requestFullscreen();
      else await document.exitFullscreen();
    } catch {
      /* ignore */
    }
  };

  /* ---------- Keyboard ---------- */
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      switch (e.key) {
        case "ArrowLeft":
        case "PageUp":
          e.preventDefault();
          goPrev();
          break;
        case "ArrowRight":
        case "PageDown":
        case " ":
          e.preventDefault();
          goNext();
          break;
        case "+":
        case "=":
          e.preventDefault();
          zoomIn();
          break;
        case "-":
          e.preventDefault();
          zoomOut();
          break;
        case "0":
          e.preventDefault();
          zoomReset();
          break;
        case "f":
        case "F":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "t":
        case "T":
          e.preventDefault();
          setTocOpen((v) => !v);
          break;
        case "d":
        case "D":
          e.preventDefault();
          if (window.innerWidth >= 1024) changeSpread((s) => (s === 1 ? 2 : 1));
          break;
        case "Escape":
          if (tocOpen) setTocOpen(false);
          break;
        default:
          break;
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [goPrev, goNext, tocOpen]);

  /* ----------------------------------------------------------------- */
  /*  Page width — fits BOTH dimensions, adapts to spread mode          */
  /* ----------------------------------------------------------------- */
  const pageWidth = useMemo(() => {
    const { width: cw, height: ch } = viewport;
    if (!cw || !ch) return 500;

    const horizPad = cw < 640 ? 24 : 96;
    const vertPad = ch < 640 ? 32 : 72;

    const availW = cw - horizPad;
    const availH = ch - vertPad;

    const fitByHeight = availH * PDF_RATIO;
    const perPageW = spread === 2 ? (availW - SPREAD_GAP) / 2 : availW;

    const baseFit = Math.min(perPageW, fitByHeight, spread === 2 ? 560 : 900);

    return Math.max(180, Math.round((baseFit * zoom) / 100));
  }, [viewport, zoom, spread]);

  const pageHeight = Math.round(pageWidth / PDF_RATIO);

  const progress = numPages ? (pageNumber / numPages) * 100 : 0;

  /* Toggle spread only on wide screens */
  const canSpread = viewport.width >= 1024;

  return (
    <div
      ref={readerRef}
      className="fixed inset-0 z-40 flex flex-col"
      style={{ background: (THEMES[themeKey] || THEMES.forest).bg }}
    >
      <style>{`
        @keyframes page-enter {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .page-enter { animation: page-enter 0.28s cubic-bezier(.2,.7,.3,1); }
      `}</style>

      {/* ================= TOP BAR ================= */}
      <header
        className="relative z-20 border-b shrink-0 backdrop-blur-md border-white/5"
        style={{ background: (THEMES[themeKey] || THEMES.forest).headerBg }}
      >
        <div className="flex items-center justify-between gap-3 px-3 h-14 sm:px-5">
          {/* Left */}
          <div className="flex items-center min-w-0 gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/10 grid place-items-center text-cream/80 hover:bg-white/10 hover:text-cream transition shrink-0"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="hidden min-w-0 sm:block">
              <p className="text-sm font-medium truncate text-cream">{title}</p>
              {author && (
                <p className="text-[10.5px] text-cream/40 truncate">{author}</p>
              )}
            </div>
          </div>

          {/* Center — page info */}
          <p className="hidden md:block text-[11px] text-cream/50 tabular-nums">
            {spread === 2 ? (
              rightPageValid ? (
                <>
                  Pages{" "}
                  <span className="font-medium text-cream/80">{leftPage}</span>
                  <span className="mx-1 text-cream/25">–</span>
                  <span className="font-medium text-cream/80">{rightPage}</span>
                  <span className="mx-2 text-cream/25">of</span>
                  {numPages}
                </>
              ) : (
                <>
                  Page{" "}
                  <span className="font-medium text-cream/80">{leftPage}</span>
                  <span className="mx-2 text-cream/25">of</span>
                  {numPages}
                </>
              )
            ) : (
              <>
                Page{" "}
                <span className="font-medium text-cream/80">{pageNumber}</span>
                <span className="mx-2 text-cream/25">of</span>
                {numPages || "…"}
              </>
            )}
          </p>

          {/* Right */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Spread toggle (desktop only) */}
            {canSpread && (
              <div className="hidden lg:flex items-center bg-white/[0.06] border border-white/10 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => changeSpread(1)}
                  aria-label="Single page"
                  title="Single page (D)"
                  className={`w-9 h-9 grid place-items-center transition ${
                    spread === 1
                      ? "bg-white/15 text-cream"
                      : "text-cream/60 hover:bg-white/10 hover:text-cream"
                  }`}
                >
                  <Book size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => changeSpread(2)}
                  aria-label="Two pages"
                  title="Two pages (D)"
                  className={`w-9 h-9 grid place-items-center transition ${
                    spread === 2
                      ? "bg-white/15 text-cream"
                      : "text-cream/60 hover:bg-white/10 hover:text-cream"
                  }`}
                >
                  <BookOpenCheck size={15} />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setTocOpen(true)}
              aria-label="Table of contents"
              className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/10 grid place-items-center text-cream/80 hover:bg-white/10 hover:text-cream transition"
            >
              <List size={15} />
            </button>

            {/* Zoom */}
            <div className="hidden sm:flex items-center bg-white/[0.06] border border-white/10 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={zoomOut}
                disabled={zoomIndex === MIN_ZOOM}
                aria-label="Zoom out"
                className="grid transition w-9 h-9 place-items-center text-cream/70 hover:bg-white/10 hover:text-cream disabled:opacity-30"
              >
                <ZoomOut size={15} />
              </button>
              <button
                type="button"
                onClick={zoomReset}
                title="Reset zoom"
                className="px-2.5 text-[11px] font-medium text-cream/70 hover:text-cream tabular-nums min-w-[3rem] text-center"
              >
                {zoom}%
              </button>
              <button
                type="button"
                onClick={zoomIn}
                disabled={zoomIndex === MAX_ZOOM}
                aria-label="Zoom in"
                className="grid transition w-9 h-9 place-items-center text-cream/70 hover:bg-white/10 hover:text-cream disabled:opacity-30"
              >
                <ZoomIn size={15} />
              </button>
            </div>

            {/* Bookmark button */}
            <button
              type="button"
              onClick={() => {
                const isNow = toggleFavorite(
                  passedBook || { id, title, author },
                );
                setFav(isNow);
                if (isNow) {
                  toast.success(`"${title}" saved to your bookmarks.`);
                } else {
                  toast.info(`"${title}" removed from bookmarks.`);
                }
              }}
              aria-label={fav ? "Remove from bookmarks" : "Save bookmark"}
              title={fav ? "Bookmarked" : "Bookmark this book"}
              className={`w-9 h-9 rounded-xl border transition grid place-items-center ${
                fav
                  ? "bg-primary text-gold border-gold/40 shadow-soft"
                  : "bg-white/[0.06] border-white/10 text-cream/80 hover:bg-white/10 hover:text-cream"
              }`}
            >
              <Bookmark
                size={15}
                className={fav ? "fill-gold text-gold" : ""}
              />
            </button>

            {/* Reading ambience theme selector */}
            <div ref={themeMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setThemeMenuOpen((v) => !v)}
                aria-label="Reading ambience theme"
                title="Reading ambience theme"
                className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/10 grid place-items-center text-cream/80 hover:bg-white/10 hover:text-cream transition"
              >
                <Palette size={15} />
              </button>

              {themeMenuOpen && (
                <div className="absolute right-0 z-50 w-48 p-2 mt-2 border shadow-2xl top-full bg-stone-900/95 border-white/10 rounded-2xl backdrop-blur-md">
                  <p className="text-[10px] uppercase font-bold text-cream/40 px-2 py-1 tracking-wider">
                    Reading Ambience
                  </p>
                  {Object.values(THEMES).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setThemeKey(t.id);
                        saveReaderPrefs({ theme: t.id });
                        setThemeMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition ${
                        themeKey === t.id
                          ? "bg-white/15 text-cream font-bold"
                          : "text-cream/70 hover:bg-white/10 hover:text-cream"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                          style={{ background: t.bg }}
                        />
                        <span>{t.name}</span>
                      </div>
                      {themeKey === t.id && (
                        <Check size={13} className="text-gold" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/10 grid place-items-center text-cream/80 hover:bg-white/10 hover:text-cream transition"
            >
              {fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="h-[2px] bg-white/5">
          <div
            className="h-full bg-gradient-to-r from-gold/80 via-gold to-gold/80 transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* ================= READING ROOM ================= */}
      <main
        ref={containerRef}
        className="relative flex-1 overflow-auto"
        style={{
          background:
            `radial-gradient(ellipse 60% 55% at 50% 0%, ${(THEMES[themeKey] || THEMES.forest).glow1}, transparent 70%), ` +
            `radial-gradient(ellipse 80% 60% at 50% 100%, ${(THEMES[themeKey] || THEMES.forest).glow2}, transparent 60%), ` +
            (THEMES[themeKey] || THEMES.forest).bg,
        }}
      >
        <div className="relative flex items-start justify-center min-h-full px-4 py-8 sm:py-14 sm:px-8">
          {pdfError ? (
            <ErrorState
              message={pdfError}
              onRetry={() => {
                setPdfError("");
                setReloadKey((k) => k + 1);
              }}
            />
          ) : (
            <Document
              key={reloadKey}
              file={pdfUrl}
              onLoadSuccess={async (pdfDoc) => {
                setNumPages(pdfDoc.numPages);
                const outline = await loadOutline(pdfDoc);
                setToc(outline);
              }}
              onLoadError={(err) => {
                const msg = String(err?.message || "");
                if (msg.includes("403") || msg.includes("not available")) {
                  setPdfError(
                    "This book is not available for reading. It may be a draft.",
                  );
                } else if (msg.includes("404")) {
                  setPdfError("PDF file not found on the server.");
                } else if (msg.toLowerCase().includes("fetch")) {
                  setPdfError(
                    "Couldn't reach the server. Please check your connection and try again.",
                  );
                } else {
                  setPdfError(
                    "Could not open this book. Please try again in a moment.",
                  );
                }
              }}
              loading={<LoadingState />}
              error={
                <ErrorState
                  message="Could not load the PDF."
                  onRetry={() => setReloadKey((k) => k + 1)}
                />
              }
            >
              {/* ============ THE BOOK ============ */}
              <div className="page-enter" key={`${pageNumber}-${spread}`}>
                {/* Floor shadow */}
                <div
                  aria-hidden="true"
                  className="absolute left-1/2 -translate-x-1/2 -bottom-5 w-[92%] h-10 blur-2xl pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(ellipse at center, rgba(0,0,0,0.9), transparent 75%)",
                  }}
                />

                {spread === 1 ? (
                  /* =============== SINGLE PAGE =============== */
                  <div className="relative" style={{ width: pageWidth }}>
                    {/* Right stacked edges */}
                    <div
                      aria-hidden="true"
                      className="absolute top-1 bottom-1 -right-[3px] w-[6px] rounded-r-md"
                      style={{
                        background: "linear-gradient(180deg, #E8E0CE, #D8CEB6)",
                        boxShadow: "2px 0 4px rgba(0,0,0,0.25)",
                      }}
                    />
                    <div
                      aria-hidden="true"
                      className="absolute top-2 bottom-2 -right-[6px] w-[5px] rounded-r-md"
                      style={{
                        background: "linear-gradient(180deg, #DDD4BF, #C9BE9F)",
                        boxShadow: "2px 0 4px rgba(0,0,0,0.2)",
                      }}
                    />
                    {/* Left stacked edge */}
                    <div
                      aria-hidden="true"
                      className="absolute top-1 bottom-1 -left-[3px] w-[5px] rounded-l-md"
                      style={{
                        background: "linear-gradient(180deg, #D8CEB6, #C7BC9F)",
                        boxShadow: "-2px 0 4px rgba(0,0,0,0.2)",
                      }}
                    />

                    <PaperPage
                      pageNumber={pageNumber}
                      width={pageWidth}
                      height={pageHeight}
                      side="single"
                    />
                  </div>
                ) : (
                  /* =============== TWO-PAGE SPREAD =============== */
                  <div
                    className="relative"
                    style={{
                      width: pageWidth * 2 + SPREAD_GAP,
                    }}
                  >
                    {/* Right stacked edges (outer) */}
                    <div
                      aria-hidden="true"
                      className="absolute top-1 bottom-1 -right-[3px] w-[6px] rounded-r-md"
                      style={{
                        background: "linear-gradient(180deg, #E8E0CE, #D8CEB6)",
                        boxShadow: "2px 0 4px rgba(0,0,0,0.25)",
                      }}
                    />
                    <div
                      aria-hidden="true"
                      className="absolute top-2 bottom-2 -right-[6px] w-[5px] rounded-r-md"
                      style={{
                        background: "linear-gradient(180deg, #DDD4BF, #C9BE9F)",
                        boxShadow: "2px 0 4px rgba(0,0,0,0.2)",
                      }}
                    />
                    {/* Left stacked edges (outer) */}
                    <div
                      aria-hidden="true"
                      className="absolute top-1 bottom-1 -left-[3px] w-[6px] rounded-l-md"
                      style={{
                        background: "linear-gradient(180deg, #E8E0CE, #D8CEB6)",
                        boxShadow: "-2px 0 4px rgba(0,0,0,0.25)",
                      }}
                    />
                    <div
                      aria-hidden="true"
                      className="absolute top-2 bottom-2 -left-[6px] w-[5px] rounded-l-md"
                      style={{
                        background: "linear-gradient(180deg, #DDD4BF, #C9BE9F)",
                        boxShadow: "-2px 0 4px rgba(0,0,0,0.2)",
                      }}
                    />

                    {/* The spread */}
                    <div
                      className="relative flex"
                      style={{
                        gap: `${SPREAD_GAP}px`,
                        borderRadius: "4px",
                        boxShadow:
                          "0 30px 70px -25px rgba(0,0,0,0.9), " +
                          "0 15px 30px -15px rgba(0,0,0,0.6), " +
                          "0 0 0 1px rgba(0,0,0,0.2)",
                      }}
                    >
                      {/* LEFT PAGE */}
                      <PaperPage
                        pageNumber={leftPage}
                        width={pageWidth}
                        height={pageHeight}
                        side="left"
                      />

                      {/* CENTER SPINE — dark gap between pages */}
                      <div
                        aria-hidden="true"
                        className="absolute top-0 bottom-0 z-30 pointer-events-none"
                        style={{
                          left: pageWidth - 14,
                          width: 28,
                          background:
                            "linear-gradient(to right, " +
                            "rgba(0,0,0,0) 0%, " +
                            "rgba(60,45,20,0.15) 25%, " +
                            "rgba(30,20,5,0.35) 50%, " +
                            "rgba(60,45,20,0.15) 75%, " +
                            "rgba(0,0,0,0) 100%)",
                        }}
                      />

                      {/* RIGHT PAGE */}
                      {rightPageValid ? (
                        <PaperPage
                          pageNumber={rightPage}
                          width={pageWidth}
                          height={pageHeight}
                          side="right"
                        />
                      ) : (
                        /* Blank right page when last page is odd */
                        <div
                          style={{
                            width: pageWidth,
                            height: pageHeight,
                            background: "#F0EAD8",
                          }}
                          className="relative"
                        >
                          <div
                            aria-hidden="true"
                            className="absolute inset-0"
                            style={{
                              background:
                                "radial-gradient(circle at 40% 40%, rgba(255,246,220,0.5), transparent 60%)",
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Page counter chip */}
                <div className="flex items-center justify-center mt-6">
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-[11px] text-cream/60 tabular-nums backdrop-blur-sm">
                    <BookOpen size={11} className="text-gold/80" />
                    {spread === 2 ? (
                      rightPageValid ? (
                        <>
                          <span className="font-medium text-cream/90">
                            {leftPage}
                          </span>
                          <span className="text-cream/30">–</span>
                          <span className="font-medium text-cream/90">
                            {rightPage}
                          </span>
                        </>
                      ) : (
                        <span className="font-medium text-cream/90">
                          {leftPage}
                        </span>
                      )
                    ) : (
                      <span className="font-medium text-cream/90">
                        {pageNumber}
                      </span>
                    )}
                    <span className="text-cream/30">/</span>
                    <span>{numPages || "…"}</span>
                  </span>
                </div>
              </div>
            </Document>
          )}
        </div>
      </main>

      {/* ================= BOTTOM BAR ================= */}
      <footer
        className="relative z-20 border-t shrink-0 backdrop-blur-md border-white/5"
        style={{ background: (THEMES[themeKey] || THEMES.forest).headerBg }}
      >
        <div className="flex items-center justify-between h-16 gap-3 px-3 sm:px-6">
          {/* Prev */}
          <button
            type="button"
            onClick={goPrev}
            disabled={pageNumber <= 1}
            className="inline-flex items-center gap-1.5 bg-white/[0.06] border border-white/10 text-cream/80 px-3 sm:px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-white/10 hover:text-cream disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">
              {spread === 2 ? "Back" : "Previous"}
            </span>
          </button>

          {/* Slider & Page Jump (desktop) */}
          <div className="items-center flex-1 hidden max-w-xl gap-3 mx-auto sm:flex">
            <div className="flex items-center gap-1.5 bg-white/[0.06] border border-white/10 rounded-xl px-2.5 py-1 shrink-0">
              <span className="text-[10px] uppercase text-cream/40 font-semibold tracking-wider">
                Page
              </span>
              <input
                type="number"
                min={1}
                max={numPages || 1}
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const p = parseInt(pageInput, 10);
                    if (!isNaN(p)) goToPage(p);
                  }
                }}
                onBlur={() => {
                  const p = parseInt(pageInput, 10);
                  if (!isNaN(p)) goToPage(p);
                  else setPageInput(String(leftPage));
                }}
                aria-label="Direct page jump"
                className="text-xs font-bold text-center bg-transparent outline-none w-11 text-cream tabular-nums"
              />
              <span className="text-[11px] text-cream/30">/</span>
              <span className="text-[11px] text-cream/50 tabular-nums">
                {numPages || "—"}
              </span>
            </div>

            <input
              type="range"
              min={1}
              max={numPages || 1}
              step={spread}
              value={leftPage}
              onChange={(e) => goToPage(Number(e.target.value))}
              aria-label="Jump to page"
              className="flex-1 cursor-pointer accent-gold"
            />
          </div>

          {/* Mobile counter */}
          <p className="sm:hidden text-[11px] text-cream/50 tabular-nums">
            <span className="font-medium text-cream/80">{leftPage}</span>
            <span className="mx-0.5 text-cream/25">/</span>
            {numPages || "…"}
          </p>

          {/* Next */}
          <button
            type="button"
            onClick={goNext}
            disabled={numPages > 0 && pageNumber + stepSize - 1 >= numPages}
            className="inline-flex items-center gap-1.5 bg-gold text-primary px-3 sm:px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gold/90 disabled:opacity-40 disabled:cursor-not-allowed transition"
            style={{ boxShadow: "0 8px 24px -8px rgba(214,181,109,0.6)" }}
          >
            <span className="hidden sm:inline">
              {spread === 2 ? "Forward" : "Next"}
            </span>
            <ChevronRight size={16} />
          </button>
        </div>
      </footer>

      {/* ================= TOC ================= */}
      <TocPanel
        open={tocOpen}
        onClose={() => setTocOpen(false)}
        items={toc}
        currentPage={pageNumber}
        onJump={(pg) => {
          goToPage(pg);
          setTocOpen(false);
        }}
      />
    </div>
  );
}

/*  PaperPage — single page with book aesthetic                       */

function PaperPage({ pageNumber, width, height, side }) {
  /* side: "left" | "right" | "single" */
  const isLeft = side === "left";
  const isRight = side === "right";
  const isSingle = side === "single";

  const radius = isLeft ? "4px 0 0 4px" : isRight ? "0 4px 4px 0" : "4px";

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width,
        height,
        background: "#FBF8F0",
        borderRadius: radius,
        boxShadow: isSingle
          ? "0 30px 70px -25px rgba(0,0,0,0.9), 0 15px 30px -15px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,0,0,0.2)"
          : "0 20px 50px -20px rgba(0,0,0,0.85), 0 8px 20px -10px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.15)",
      }}
    >
      {/* Warm paper texture */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 30% 20%, rgba(255,246,220,0.5), transparent 60%), " +
            "radial-gradient(circle at 80% 85%, rgba(180,160,120,0.08), transparent 55%)",
        }}
      />

      {/* Inner edge shadow — near spine (right page: left side; left page: right side) */}
      {(isLeft || isRight) && (
        <>
          <div
            aria-hidden="true"
            className="absolute top-0 bottom-0 z-20 w-10 pointer-events-none"
            style={{
              [isLeft ? "right" : "left"]: 0,
              background: isLeft
                ? "linear-gradient(to left, rgba(60,45,20,0.18), transparent)"
                : "linear-gradient(to right, rgba(60,45,20,0.18), transparent)",
            }}
          />
          <div
            aria-hidden="true"
            className="absolute top-4 bottom-4 w-px bg-black/[0.12] z-20 pointer-events-none"
            style={{ [isLeft ? "right" : "left"]: "4px" }}
          />
        </>
      )}

      {/* Single page — left spine illusion */}
      {isSingle && (
        <>
          <div
            aria-hidden="true"
            className="absolute top-0 bottom-0 left-0 z-20 w-8 pointer-events-none"
            style={{
              background:
                "linear-gradient(to right, rgba(60,45,20,0.18), rgba(60,45,20,0.05) 50%, transparent)",
            }}
          />
          <div
            aria-hidden="true"
            className="absolute left-[6px] top-4 bottom-4 w-px bg-black/[0.12] z-20 pointer-events-none"
          />
        </>
      )}

      {/* PDF page */}
      <Page
        pageNumber={pageNumber}
        width={width}
        renderTextLayer
        renderAnnotationLayer
        loading={<PageSkeleton width={width} />}
      />
    </div>
  );
}

/*  Loading / Error / Skeleton                                         */

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-cream/60">
      <div className="w-11 h-11 rounded-2xl bg-white/[0.06] border border-white/10 grid place-items-center">
        <Loader2 size={20} className="animate-spin text-gold" />
      </div>
      <p className="text-sm">Opening your book…</p>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="max-w-md px-4 py-16 mx-auto text-center">
      <div className="grid mx-auto border w-14 h-14 rounded-2xl bg-red-500/10 border-red-400/30 place-items-center">
        <AlertCircle size={22} className="text-red-300" />
      </div>
      <h3 className="mt-4 text-lg font-display text-cream">
        Couldn't open this book
      </h3>
      <p className="mt-2 text-sm text-cream/60">{message}</p>
      <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 bg-gold text-primary px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gold/90 transition"
        >
          <RefreshCw size={14} /> Try again
        </button>
        <Link
          to="/explore"
          className="inline-flex items-center gap-2 bg-white/[0.06] border border-white/10 text-cream px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-white/10 transition"
        >
          <ArrowLeft size={14} /> Back to Explore
        </Link>
      </div>
    </div>
  );
}

function PageSkeleton({ width }) {
  return (
    <div
      className="animate-pulse"
      style={{
        width,
        height: Math.round(width / PDF_RATIO),
        background:
          "linear-gradient(90deg, #F5EFE0 0%, #FBF8F0 50%, #F5EFE0 100%)",
        backgroundSize: "200% 100%",
      }}
    />
  );
}

/*  TOC Panel                                                          */

function TocPanel({ open, onClose, items, currentPage, onJump }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Table of contents"
        className={`fixed top-0 right-0 z-[95] h-[100dvh] w-[86%] max-w-sm
          flex flex-col shadow-2xl border-l border-white/10
          transition-transform duration-300 ease-out will-change-transform
          ${open ? "translate-x-0" : "translate-x-full"}`}
        style={{ background: "#0F1E19" }}
      >
        <div className="relative px-5 pt-5 pb-4 border-b border-white/5 shrink-0">
          <div className="absolute w-40 h-40 rounded-full pointer-events-none -top-12 -right-12 bg-gold/15 blur-3xl" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-center min-w-0 gap-3">
              <span className="w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/10 grid place-items-center text-gold shrink-0">
                <List size={17} />
              </span>
              <div className="min-w-0">
                <h2 className="text-lg leading-tight font-display text-cream">
                  Contents
                </h2>
                <p className="text-cream/40 text-[11px] mt-0.5">
                  {items.length > 0
                    ? `${items.length} entries`
                    : "No outline available"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/10 grid place-items-center text-cream/70 hover:bg-white/10 hover:text-cream transition shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 px-2 py-3 overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/10 grid place-items-center mx-auto mb-3">
                <BookOpen size={18} className="text-cream/40" />
              </div>
              <p className="text-sm text-cream/60">
                This book doesn't include a table of contents.
              </p>
              <p className="mt-1 text-xs text-cream/30">
                Use the page slider to navigate.
              </p>
            </div>
          ) : (
            <ul className="space-y-0.5">
              {items.map((it, i) => {
                const isCurrent = it.pageNumber === currentPage;
                return (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => it.pageNumber && onJump(it.pageNumber)}
                      disabled={!it.pageNumber}
                      className={`group w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl transition disabled:opacity-30 disabled:cursor-not-allowed ${
                        isCurrent
                          ? "bg-gold text-primary"
                          : "text-cream/70 hover:bg-white/5 hover:text-cream"
                      }`}
                      style={{ paddingLeft: `${12 + it.depth * 14}px` }}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          isCurrent ? "bg-primary" : "bg-gold/60"
                        }`}
                      />
                      <span className="flex-1 text-sm font-medium truncate">
                        {it.title}
                      </span>
                      {it.pageNumber && (
                        <span
                          className={`text-[10.5px] tabular-nums shrink-0 ${
                            isCurrent ? "text-primary/70" : "text-cream/30"
                          }`}
                        >
                          p. {it.pageNumber}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="px-5 py-3 border-t shrink-0 border-white/5 bg-black/20">
          <p className="text-[10px] text-cream/30 text-center">
            ← → page · D spread · + − zoom · F fullscreen · T contents
          </p>
        </div>
      </aside>
    </>
  );
}
