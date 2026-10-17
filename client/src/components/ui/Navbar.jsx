import { useState, useEffect, useRef, useCallback } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Menu,
  Search,
  X,
  Sparkles,
  Home,
  Compass,
  LayoutGrid,
  Info,
  Mail,
  Download,
  ShieldCheck,
  ArrowRight,
  LayoutDashboard,
  User,
  LogOut,
  ChevronDown,
  Settings,
  Loader2,
} from "lucide-react";

import { booksAPI } from "../../api/adminApi";

/* ------------------------------------------------------------------ */
/*  Brand logo                                                         */
/* ------------------------------------------------------------------ */
const LOGO_SRC = "/mainLogo.png";

/* ------------------------------------------------------------------ */
/*  Shared config                                                      */
/* ------------------------------------------------------------------ */
const navLinks = [
  { label: "Home", to: "/", end: true, icon: Home },
  { label: "About", to: "/about", icon: Info },
  { label: "Explore Books", to: "/explore", icon: Compass },
  { label: "Categories", to: "/categories", icon: LayoutGrid },
  { label: "Contact", to: "/contact", icon: Mail },
];

/* ------------------------------------------------------------------ */
/*  Cover palettes — same as Explore page                              */
/* ------------------------------------------------------------------ */
const COVER_PALETTES = [
  { from: "#1A4A3E", to: "#0B241C", text: "#FAF7F0", accent: "#D6B56D" },
  { from: "#B08F4A", to: "#6E5A2A", text: "#FAF7F0", accent: "#FAF7F0" },
  { from: "#2A5E4E", to: "#0F2B22", text: "#FAF7F0", accent: "#D6B56D" },
  { from: "#D6B56D", to: "#8E7538", text: "#173F35", accent: "#173F35" },
  { from: "#3A6A55", to: "#152E24", text: "#FAF7F0", accent: "#D6B56D" },
  { from: "#8B6E32", to: "#4E3D1B", text: "#FAF7F0", accent: "#D6B56D" },
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
/*  Cover URL resolver                                                 */
/* ------------------------------------------------------------------ */

function resolveCoverUrl(raw) {
  if (!raw || typeof raw !== "string") return "";

  const s = raw.trim();
  if (!s) return "";

  // Already a complete URL
  if (/^(https?:\/\/|data:|blob:)/i.test(s)) {
    return s;
  }

  const base = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

  const host = base.replace(/\/api\/?$/, "");

  // Database path: uploads/covers/book.png
  if (s.startsWith("uploads/")) {
    return `${host}/${s}`;
  }

  // Absolute server path
  if (s.startsWith("/")) {
    return `${host}${s}`;
  }

  // Cover filename only
  if (s.toLowerCase().endsWith(".png")) {
    return `${host}/uploads/covers/${s}`;
  }

  // Legacy cover filename fallback
  return `${host}/uploads/books/${s}`;
}

function pickCover(b) {
  if (!b) return "";

  const raw =
    b.cover_image ||
    b.coverImage ||
    b.cover ||
    b.coverUrl ||
    b.cover_url ||
    b.coverPath ||
    b.cover_path ||
    b.thumbnail ||
    b.thumbnailUrl ||
    b.image ||
    b.imageUrl ||
    "";

  return resolveCoverUrl(raw);
}

/* ------------------------------------------------------------------ */
/*  MiniCover — used in search results                                 */
/*  Real image if available, otherwise premium auto-generated cover    */
/* ------------------------------------------------------------------ */
function MiniCover({ book, className = "" }) {
  const [errored, setErrored] = useState(false);
  const src = pickCover(book);

  if (src && !errored) {
    return (
      <div className={`overflow-hidden ${className}`}>
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => setErrored(true)}
          className="object-cover w-full h-full"
        />
      </div>
    );
  }

  const seed = hashString(
    `${book?.title || ""}-${book?.id || book?._id || ""}`,
  );
  const p = COVER_PALETTES[seed % COVER_PALETTES.length];
  const initial = (book?.author || book?.title || "?").charAt(0).toUpperCase();

  return (
    <div
      className={`relative overflow-hidden flex flex-col justify-between ${className}`}
      style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }}
    >
      {/* Spine (left) */}
      <span
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ background: "rgba(0,0,0,0.28)" }}
      />
      {/* Page edge (right) */}
      <span
        className="absolute right-0 top-0 bottom-0 w-[2px]"
        style={{ background: "rgba(255,255,255,0.10)" }}
      />
      {/* Soft light */}
      <span
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.22), transparent 55%)",
        }}
      />

      {/* Category (top) */}
      <p
        className="relative text-[5.5px] uppercase tracking-wider font-bold truncate pl-1 pt-0.5"
        style={{ color: p.accent }}
      >
        {book?.category || "Book"}
      </p>

      {/* Title (middle) */}
      <p
        className="relative text-[7px] leading-[1.15] font-semibold pl-1 pr-0.5 line-clamp-3"
        style={{ color: p.text, fontFamily: "'Playfair Display', serif" }}
      >
        {book?.title || "Untitled"}
      </p>

      {/* Initial (bottom right) */}
      <p
        className="relative text-[6px] font-bold text-right pr-1 pb-0.5"
        style={{ color: p.accent, opacity: 0.75 }}
      >
        {initial}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Avatar URL resolver                                                */
/* ------------------------------------------------------------------ */
function resolveAvatarUrl(raw) {
  if (!raw || typeof raw !== "string") return "";
  if (/^(https?:\/\/|data:|blob:)/i.test(raw)) return raw;
  if (!raw.startsWith("/")) {
    return `http://localhost:8000/uploads/admin-profiles/${raw}`;
  }
  const base = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
  const host = base.replace(/\/api\/?$/, "");
  return `${host}${raw}`;
}

function getAvatarFromAdmin(admin) {
  if (!admin) return "";
  const raw =
    admin.profile_pic ||
    admin.profilePic ||
    admin.avatar ||
    admin.profileImage ||
    admin.image ||
    admin.photo ||
    "";
  return resolveAvatarUrl(raw);
}

/* ------------------------------------------------------------------ */
/*  Auth hook                                                          */
/* ------------------------------------------------------------------ */
function useAdminAuth() {
  const [admin, setAdmin] = useState(null);

  const read = () => {
    try {
      const token = localStorage.getItem("ved_token");
      const raw = localStorage.getItem("ved_admin");
      if (!token) {
        setAdmin(null);
        return;
      }
      setAdmin(raw ? JSON.parse(raw) : {});
    } catch {
      setAdmin(null);
    }
  };

  useEffect(() => {
    read();
    const onStorage = () => read();
    const onCustom = () => read();
    window.addEventListener("storage", onStorage);
    window.addEventListener("ved-auth-change", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("ved-auth-change", onCustom);
    };
  }, []);

  return { admin, isAuthed: Boolean(admin) };
}

/* ------------------------------------------------------------------ */
/*  Search hook — debounced API call                                   */
/* ------------------------------------------------------------------ */
function useBookSearch(query, { enabled = true } = {}) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const reqIdRef = useRef(0);

  useEffect(() => {
    const q = query.trim();

    if (!enabled || q.length < 2) {
      setResults([]);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    const myReq = ++reqIdRef.current;

    const t = setTimeout(async () => {
      try {
        const res = await booksAPI.searchPublic(q);
        if (myReq !== reqIdRef.current) return;

        const d = res?.data || {};
        const arr =
          (Array.isArray(d.books) && d.books) ||
          (Array.isArray(d.results) && d.results) ||
          (Array.isArray(d.data) && d.data) ||
          (Array.isArray(d) && d) ||
          [];

        setResults(arr.slice(0, 8));
      } catch (err) {
        if (myReq !== reqIdRef.current) return;
        setError(err?.message || "Search failed");
        setResults([]);
      } finally {
        if (myReq === reqIdRef.current) setLoading(false);
      }
    }, 300);

    return () => clearTimeout(t);
  }, [query, enabled]);

  return { results, loading, error };
}

/* ------------------------------------------------------------------ */
/*  Brand                                                              */
/* ------------------------------------------------------------------ */
function Brand({ size = "md", onClick }) {
  const isSm = size === "sm";
  return (
    <Link
      to="/"
      onClick={onClick}
      className="flex items-center min-w-0 gap-2 sm:gap-3 shrink-0 group"
      aria-label="VedBook — Home"
    >
      <div
        className={`relative grid place-items-center shrink-0 rounded-2xl bg-primary overflow-hidden ring-1 ring-primary/10 ${
          isSm ? "w-9 h-9" : "w-10 h-10 sm:w-11 sm:h-11"
        }`}
      >
        <img
          src={LOGO_SRC}
          alt="VedBook logo"
          className="object-contain w-full h-full"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            e.currentTarget.nextSibling.style.display = "grid";
          }}
        />
        <span
          className={`hidden absolute inset-0 place-items-center font-display font-bold text-gold ${isSm ? "text-base" : "text-lg"}`}
        >
          V
        </span>
        <span className="absolute w-6 h-6 transition-opacity rounded-full opacity-0 pointer-events-none -top-2 -right-2 bg-gold/40 blur-md group-hover:opacity-100" />
      </div>

      <div className="min-w-0 leading-none">
        <p
          className={`font-display text-primary truncate ${isSm ? "text-base" : "text-base sm:text-lg"}`}
        >
          VedBook
        </p>
        <p
          className={`hidden sm:block text-[10px] text-primary/50 uppercase tracking-[0.2em] mt-1 ${isSm ? "sm:hidden" : ""}`}
        >
          Digital Library
        </p>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Admin dropdown                                                     */
/* ------------------------------------------------------------------ */
function AdminMenu({ admin }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const [broken, setBroken] = useState(false);

  const name = admin?.name || admin?.email || "Admin";
  const email = admin?.email || "";
  const initial = (name.charAt(0) || "A").toUpperCase();
  const avatarUrl = getAvatarFromAdmin(admin);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target))
        setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleLogout = () => {
    localStorage.removeItem("ved_token");
    localStorage.removeItem("ved_admin");
    window.dispatchEvent(new Event("ved-auth-change"));
    setOpen(false);
    navigate("/");
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-2 bg-white border border-primary/10 rounded-xl pl-1 pr-2.5 py-1 hover:bg-mint transition"
      >
        <span className="relative shrink-0">
          <span className="block w-8 h-8 overflow-hidden rounded-lg bg-primary ring-1 ring-gold/40">
            {avatarUrl && !broken ? (
              <img
                src={avatarUrl}
                alt={name}
                className="object-cover w-full h-full"
                onError={() => setBroken(true)}
              />
            ) : (
              <span className="grid w-full h-full text-sm font-bold place-items-center font-display text-gold">
                {initial}
              </span>
            )}
          </span>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
        </span>
        <span className="hidden lg:block text-xs font-medium text-primary max-w-[100px] truncate">
          {name}
        </span>
        <ChevronDown
          size={13}
          className={`text-primary/50 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] w-64 bg-cream border border-primary/10 rounded-2xl shadow-soft overflow-hidden z-50"
        >
          <div className="relative p-4 overflow-hidden bg-primary">
            <div className="absolute w-24 h-24 rounded-full pointer-events-none -top-8 -right-8 bg-gold/25 blur-2xl" />
            <div className="relative flex items-center gap-3">
              <span className="w-10 h-10 overflow-hidden rounded-xl bg-cream/10 ring-1 ring-gold/40 shrink-0">
                {avatarUrl && !broken ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="grid w-full h-full text-base font-bold place-items-center font-display text-gold">
                    {initial}
                  </span>
                )}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate text-cream">
                  {name}
                </p>
                <p className="text-[11px] text-cream/60 truncate">{email}</p>
              </div>
            </div>
          </div>

          <div className="p-1.5">
            <MenuItem
              to="/admin/dashboard"
              icon={LayoutDashboard}
              label="Dashboard"
              onClick={() => setOpen(false)}
            />
            <MenuItem
              to="/admin/profile"
              icon={User}
              label="My Profile"
              onClick={() => setOpen(false)}
            />
            <MenuItem
              to="/admin/settings"
              icon={Settings}
              label="Settings"
              onClick={() => setOpen(false)}
            />

            <div className="h-px bg-primary/10 my-1.5" />

            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition"
            >
              <span className="grid rounded-lg w-7 h-7 bg-red-50 place-items-center shrink-0">
                <LogOut size={14} />
              </span>
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({ to, icon: Icon, label, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      role="menuitem"
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-primary/80 hover:bg-mint hover:text-primary transition"
    >
      <span className="grid rounded-lg w-7 h-7 bg-mint place-items-center shrink-0">
        <Icon size={14} />
      </span>
      {label}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Search results dropdown — with auto-cover                          */
/* ------------------------------------------------------------------ */
function SearchResults({ query, results, loading, error, onSelect }) {
  const showPanel =
    query.trim().length >= 2 && (loading || results.length > 0 || error);

  if (!showPanel) return null;

  return (
    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 bg-cream border border-primary/10 rounded-2xl shadow-soft overflow-hidden">
      {/* Loading */}
      {loading && results.length === 0 && (
        <div className="flex items-center gap-3 px-4 py-4 text-primary/60">
          <Loader2 size={16} className="animate-spin text-gold" />
          <span className="text-sm">Searching…</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="px-4 py-4 text-sm text-red-600">{error}</div>
      )}

      {/* Results */}
      {!loading && !error && results.length > 0 && (
        <>
          <div className="max-h-[60vh] overflow-y-auto">
            {results.map((b) => {
              const id = b.id || b._id;
              const title = b.title || "Untitled";
              const author = b.author || "Unknown author";

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onSelect({ id, title, author })}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-mint/60 active:bg-mint transition text-left"
                >
                  {/* Auto-generated premium cover thumbnail */}
                  <MiniCover
                    book={b}
                    className="w-10 rounded-md shrink-0 h-14"
                  />

                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium truncate text-primary">
                      {title}
                    </span>
                    <span className="block text-xs text-primary/50 truncate mt-0.5">
                      {author}
                    </span>
                  </span>

                  <ArrowRight size={14} className="text-primary/30 shrink-0" />
                </button>
              );
            })}
          </div>

          {/* Footer — see all */}
          <div className="border-t border-primary/10 p-1.5">
            <button
              type="button"
              onClick={() => onSelect(null, true)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-primary hover:bg-mint transition"
            >
              <span>See all results for "{query.trim()}"</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </>
      )}

      {/* No results */}
      {!loading &&
        !error &&
        results.length === 0 &&
        query.trim().length >= 2 && (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-primary/60">
              No matches for "{query.trim()}"
            </p>
            <p className="mt-1 text-xs text-primary/40">
              Try a different title or author
            </p>
          </div>
        )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Navbar                                                             */
/* ------------------------------------------------------------------ */
export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { admin, isAuthed } = useAdminAuth();

  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const searchWrapperRef = useRef(null);

  const {
    results,
    loading: searchLoading,
    error: searchError,
  } = useBookSearch(query, { enabled: searchOpen });

  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setQuery("");
  }, []);

  useEffect(() => {
    if (searchOpen) {
      const t = setTimeout(() => searchInputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (e) => e.key === "Escape" && closeSearch();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [searchOpen, closeSearch]);

  useEffect(() => {
    if (!searchOpen) return;
    const onClick = (e) => {
      if (
        searchWrapperRef.current &&
        !searchWrapperRef.current.contains(e.target)
      ) {
        closeSearch();
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [searchOpen, closeSearch]);

  const handleSelect = useCallback(
    (book, seeAll = false) => {
      if (seeAll) {
        navigate(`/explore?q=${encodeURIComponent(query.trim())}`);
      } else if (book) {
        navigate(`/read/${book.id}`, { state: { book } });
      }
      closeSearch();
    },
    [navigate, query, closeSearch],
  );

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate(`/explore?q=${encodeURIComponent(q)}`);
    closeSearch();
  };

  const linkClass = ({ isActive }) =>
    `relative text-sm transition-colors py-1 font-medium ${
      isActive
        ? "text-primary font-semibold"
        : "text-secondary hover:text-primary"
    }`;

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-cream/90 backdrop-blur-md border-border">
        <div className="flex items-center justify-between h-16 gap-3 px-4 mx-auto max-w-7xl sm:px-5">
          {/* Left cluster */}
          <div
            ref={searchWrapperRef}
            className="flex items-center flex-1 min-w-0 gap-6 lg:gap-7"
          >
            <div
              className={`transition-all duration-300 ${searchOpen ? "hidden md:hidden" : "block"}`}
            >
              <Brand />
            </div>

            <div className="items-center flex-1 hidden min-w-0 md:flex">
              <nav
                aria-label="Primary"
                aria-hidden={searchOpen}
                className={`flex items-center gap-6 lg:gap-7 transition-all duration-300 ${
                  searchOpen
                    ? "opacity-0 -translate-y-2 pointer-events-none absolute"
                    : "opacity-100 translate-y-0 relative"
                }`}
              >
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    tabIndex={searchOpen ? -1 : 0}
                    className={linkClass}
                  >
                    {({ isActive }) => (
                      <>
                        {link.label}
                        <span
                          className={`absolute left-0 -bottom-0.5 h-0.5 rounded-full bg-gold transition-all duration-300 ${isActive ? "w-full opacity-100" : "w-0 opacity-0"}`}
                        />
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>

              <div
                className={`flex-1 max-w-2xl relative transition-all duration-300 ease-out ${
                  searchOpen
                    ? "opacity-100 translate-y-0 scale-100"
                    : "opacity-0 translate-y-2 scale-95 pointer-events-none absolute"
                }`}
              >
                <form onSubmit={handleSearchSubmit} role="search">
                  <div className="flex items-center gap-2.5 bg-white border border-border rounded-2xl px-4 focus-within:ring-2 focus-within:ring-gold focus-within:border-gold transition shadow-[0_1px_0_0_rgba(23,63,53,0.04)]">
                    <Search size={16} className="text-muted shrink-0" />
                    <input
                      ref={searchInputRef}
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search books, authors, subjects…"
                      aria-label="Search books"
                      autoComplete="off"
                      className="w-full bg-transparent outline-none text-sm text-charcoal placeholder:text-muted py-3.5"
                    />
                    {searchLoading && query.trim().length >= 2 && (
                      <Loader2
                        size={14}
                        className="animate-spin text-muted shrink-0"
                      />
                    )}
                    {query && !searchLoading && (
                      <button
                        type="button"
                        onClick={() => setQuery("")}
                        aria-label="Clear search"
                        className="transition text-muted hover:text-charcoal shrink-0"
                      >
                        <X size={14} />
                      </button>
                    )}
                    <button
                      type="submit"
                      className="hidden sm:inline-flex items-center gap-1.5 bg-primary text-cream text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-primary-light transition shrink-0"
                    >
                      Search
                    </button>
                  </div>
                </form>

                <SearchResults
                  query={query}
                  results={results}
                  loading={searchLoading}
                  error={searchError}
                  onSelect={handleSelect}
                />
              </div>
            </div>
          </div>

          {/* Right cluster (desktop) */}
          <div className="items-center hidden gap-2 md:flex shrink-0">
            {!searchOpen ? (
              <button
                type="button"
                onClick={openSearch}
                aria-label="Open search"
                aria-expanded={searchOpen}
                className="grid w-10 h-10 transition bg-white border rounded-xl border-primary/10 place-items-center text-primary/70 hover:bg-mint hover:text-primary"
              >
                <Search size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={closeSearch}
                aria-label="Close search"
                className="grid w-10 h-10 transition bg-white border rounded-xl border-primary/10 place-items-center text-primary hover:bg-mint"
              >
                <X size={17} />
              </button>
            )}

            <span className="w-px h-6 mx-1 bg-primary/10" aria-hidden="true" />

            <Link
              to="/download"
              className="inline-flex items-center gap-2 text-sm text-primary px-4 py-2.5 rounded-xl border border-primary/15 hover:bg-mint transition"
            >
              <Download size={15} /> Download App
            </Link>

            {isAuthed ? (
              <AdminMenu admin={admin} />
            ) : (
              <Link
                to="/admin/login"
                className="inline-flex items-center gap-2 text-sm bg-primary text-cream px-4 py-2.5 rounded-xl hover:bg-primary/90 transition shadow-soft"
              >
                <ShieldCheck size={15} /> Admin Login
              </Link>
            )}
          </div>

          {/* Mobile actions */}
          <div className="flex items-center gap-2 md:hidden shrink-0">
            <button
              type="button"
              onClick={openSearch}
              aria-label="Open search"
              className="grid w-10 h-10 transition bg-white border rounded-xl border-primary/10 place-items-center text-primary/70 active:bg-mint"
            >
              <Search size={16} />
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className="grid w-10 h-10 transition rounded-xl bg-primary text-cream place-items-center active:bg-primary/80"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>

        {/* Mobile search row */}
        <div
          className={`md:hidden overflow-hidden transition-[max-height,opacity] duration-300 ease-out border-t border-primary/10 ${
            searchOpen
              ? "max-h-[70vh] opacity-100"
              : "max-h-0 opacity-0 border-transparent"
          }`}
        >
          <div className="px-4 py-3">
            <form onSubmit={handleSearchSubmit} role="search">
              <div className="flex items-center gap-2.5 bg-white border border-primary/10 rounded-2xl px-4 focus-within:ring-2 focus-within:ring-gold/40 focus-within:border-gold/40 transition">
                <Search size={16} className="text-primary/40 shrink-0" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search books, authors, subjects…"
                  aria-label="Search books"
                  autoComplete="off"
                  className="w-full py-3 text-sm bg-transparent outline-none text-primary placeholder:text-primary/40"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                    className="transition text-primary/40 hover:text-primary shrink-0"
                  >
                    <X size={14} />
                  </button>
                )}
                <button
                  type="submit"
                  aria-label="Submit search"
                  className="grid w-8 h-8 transition rounded-lg bg-primary text-cream place-items-center hover:bg-primary/90 shrink-0"
                >
                  <ArrowRight size={14} />
                </button>
              </div>
            </form>

            {/* Mobile results */}
            <div className="relative">
              <SearchResults
                query={query}
                results={results}
                loading={searchLoading}
                error={searchError}
                onSelect={handleSelect}
              />
            </div>
          </div>
        </div>
      </header>

      <MobileSidebar
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        admin={admin}
        isAuthed={isAuthed}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  MobileSidebar                                                      */
/* ------------------------------------------------------------------ */
function MobileSidebar({ open, onClose, admin, isAuthed }) {
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const closeBtnRef = useRef(null);
  const [avatarBroken, setAvatarBroken] = useState(false);

  const adminName = admin?.name || admin?.email || "Admin";
  const adminEmail = admin?.email || "Signed in";
  const adminInitial = (adminName.charAt(0) || "A").toUpperCase();
  const avatarUrl = getAvatarFromAdmin(admin);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) closeBtnRef.current?.focus();
  }, [open]);

  const trapFocus = (e) => {
    if (e.key !== "Tab" || !panelRef.current) return;
    const f = panelRef.current.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (!f.length) return;
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("ved_token");
    localStorage.removeItem("ved_admin");
    window.dispatchEvent(new Event("ved-auth-change"));
    onClose();
    navigate("/");
  };

  const linkClass = ({ isActive }) =>
    `group flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-colors ${
      isActive
        ? "bg-mint text-primary font-medium"
        : "text-primary/80 hover:bg-mint/60 active:bg-mint"
    }`;

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`md:hidden fixed inset-0 z-[70] bg-primary/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      <aside
        id="mobile-menu"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        onKeyDown={trapFocus}
        className={`md:hidden fixed top-0 right-0 z-[80] h-[100dvh] w-[86%] max-w-[380px] bg-cream shadow-soft flex flex-col transition-transform duration-300 ease-out will-change-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="absolute w-48 h-48 rounded-full pointer-events-none -top-16 -right-16 bg-gold/20 blur-3xl" />
        <div className="absolute w-40 h-40 rounded-full pointer-events-none bottom-32 -left-16 bg-mint blur-3xl" />

        <div className="relative flex items-center justify-between h-16 px-4 border-b border-primary/10 shrink-0">
          <Brand size="sm" onClick={onClose} />
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="grid w-10 h-10 transition bg-white border rounded-xl border-primary/10 place-items-center text-primary hover:bg-mint shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative flex-1 overflow-y-auto overscroll-contain">
          <div className="px-4 pt-4">
            {isAuthed ? (
              <div className="relative p-4 overflow-hidden rounded-2xl bg-primary">
                <div className="absolute w-24 h-24 rounded-full -top-8 -right-8 bg-gold/30 blur-2xl" />
                <div className="relative flex items-center gap-3">
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 overflow-hidden rounded-xl bg-cream/10 ring-1 ring-gold/40">
                      {avatarUrl && !avatarBroken ? (
                        <img
                          src={avatarUrl}
                          alt={adminName}
                          className="object-cover w-full h-full"
                          onError={() => setAvatarBroken(true)}
                        />
                      ) : (
                        <div className="grid w-full h-full text-base font-bold place-items-center font-display text-gold">
                          {adminInitial}
                        </div>
                      )}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-tight truncate text-cream">
                      {adminName}
                    </p>
                    <p className="text-cream/60 text-[11px] mt-0.5 truncate">
                      {adminEmail}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative p-4 overflow-hidden rounded-2xl bg-primary">
                <div className="absolute w-24 h-24 rounded-full -top-8 -right-8 bg-gold/30 blur-2xl" />
                <div className="relative flex items-center gap-3">
                  <div className="grid w-12 h-12 overflow-hidden rounded-xl bg-cream place-items-center shrink-0 ring-1 ring-gold/40">
                    <img
                      src={LOGO_SRC}
                      alt="VedBook"
                      className="object-contain w-full h-full p-1"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.nextSibling.style.display = "grid";
                      }}
                    />
                    <span className="absolute inset-0 hidden place-items-center text-gold">
                      <Sparkles size={17} />
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-tight truncate text-cream">
                      Welcome to VedBook
                    </p>
                    <p className="text-cream/60 text-[11px] mt-0.5 truncate">
                      10,000+ titles in Hindi & English
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <nav aria-label="Primary" className="px-3 py-4 space-y-1">
            {navLinks.map(({ icon: Icon, ...link }) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={onClose}
                className={linkClass}
              >
                <span className="grid w-8 h-8 transition-colors bg-white border rounded-lg border-primary/10 place-items-center text-primary/70 group-hover:text-primary shrink-0">
                  <Icon size={15} />
                </span>
                <span className="flex-1 truncate">{link.label}</span>
                <span className="text-base leading-none transition-colors text-primary/30 group-hover:text-gold shrink-0">
                  ›
                </span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="relative px-4 pt-3 pb-5 space-y-2 border-t border-primary/10 bg-cream shrink-0">
          <Link
            to="/download"
            onClick={onClose}
            className="inline-flex items-center justify-center w-full gap-2 px-4 py-3 text-sm transition bg-white border text-primary rounded-xl border-primary/15 hover:bg-mint"
          >
            <Download size={15} /> Download App
          </Link>

          {isAuthed ? (
            <>
              <Link
                to="/admin/dashboard"
                onClick={onClose}
                className="inline-flex items-center justify-center w-full gap-2 px-4 py-3 text-sm transition bg-primary text-cream rounded-xl hover:bg-primary/90 shadow-soft"
              >
                <LayoutDashboard size={15} /> Dashboard
              </Link>
              <Link
                to="/admin/profile"
                onClick={onClose}
                className="inline-flex items-center justify-center w-full gap-2 px-4 py-3 text-sm transition bg-white border text-primary rounded-xl border-primary/15 hover:bg-mint"
              >
                <User size={15} /> My Profile
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center justify-center w-full gap-2 px-4 py-3 text-sm text-red-600 transition bg-white border border-red-200 rounded-xl hover:bg-red-50"
              >
                <LogOut size={15} /> Log out
              </button>
            </>
          ) : (
            <Link
              to="/admin/login"
              onClick={onClose}
              className="inline-flex items-center justify-center w-full gap-2 px-4 py-3 text-sm transition bg-primary text-cream rounded-xl hover:bg-primary/90 shadow-soft"
            >
              <ShieldCheck size={15} /> Admin Login
            </Link>
          )}

          <p className="text-center text-[10px] text-primary/40 pt-2">
            © {new Date().getFullYear()} VedBook
          </p>
        </div>
      </aside>
    </>
  );
}
