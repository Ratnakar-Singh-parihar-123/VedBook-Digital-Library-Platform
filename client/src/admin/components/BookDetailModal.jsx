import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  X,
  Library,
  Pencil,
  Trash2,
  AlertCircle,
  Calendar,
  Clock,
  Hash,
  FileText,
  User,
  BookOpen,
  Send,
  Undo2,
  Loader2,
  CheckCircle2,
  FileEdit,
  Archive,
  Download,
  Eye,
} from "lucide-react";

import useFetch from "../dashboard/hooks/useFetch";
import { formatDateTime, formatNumber } from "../dashboard/utils/format";
import { booksAPI } from "../../api/adminApi";

export default function BookDetailModal({
  bookId,
  onClose,
  onDelete,
  onStatusChange,
}) {
  const open = Boolean(bookId);
  const panelRef = useRef(null);
  const closeBtnRef = useRef(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  const {
    data,
    loading,
    error: fetchError,
  } = useFetch(
    () =>
      bookId ? booksAPI.getAdmin(bookId) : Promise.resolve({ data: null }),
    [bookId, open],
  );

  const book =
    data?.book ||
    data?.data ||
    (data && typeof data === "object" && !Array.isArray(data) ? data : null);

  /* Escape */
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && !working && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, working, onClose]);

  /* Body lock */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  /* Auto-focus close */
  useEffect(() => {
    if (open) closeBtnRef.current?.focus();
  }, [open]);

  const coverPath =
    book?.cover_image ||
    book?.coverImage ||
    book?.cover ||
    book?.coverUrl ||
    null;

  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

  const serverBaseUrl = apiBaseUrl.replace(/\/api\/?$/, "");

  const coverUrl = coverPath
    ? /^https?:\/\//i.test(coverPath)
      ? coverPath
      : `${serverBaseUrl}/${coverPath.replace(/^\/+/, "")}`
    : null;

  const trap = (e) => {
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

  const handleToggleStatus = async () => {
    if (!book) return;
    const id = book.id || book._id;
    const isPublished = String(book.status).toLowerCase() === "published";
    setWorking(true);
    setError("");
    try {
      if (isPublished) await booksAPI.unpublish(id);
      else await booksAPI.publish(id);
      onStatusChange?.();
    } catch (err) {
      setError(err?.message || "Could not update status");
    } finally {
      setWorking(false);
    }
  };

  if (!open) return null;

  const status = String(book?.status || "draft").toLowerCase();
  const isPublished = status === "published";
  const pdfUrl =
    book?.id || book?._id ? booksAPI.readPdfUrl(book.id || book._id) : null;

  return (
    <>
      <div
        aria-hidden="true"
        onClick={working ? undefined : onClose}
        className="fixed inset-0 z-[90] bg-primary/50 backdrop-blur-sm"
      />

      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 pointer-events-none">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="book-modal-title"
          onKeyDown={trap}
          className="relative w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[88vh] pointer-events-auto
            bg-cream sm:rounded-3xl rounded-t-3xl shadow-soft overflow-hidden flex flex-col"
        >
          {/* ============ HERO ============ */}
          <div className="relative px-5 pt-5 pb-6 bg-primary sm:px-6 shrink-0">
            <div className="absolute w-48 h-48 rounded-full pointer-events-none -top-16 -right-16 bg-gold/25 blur-3xl" />
            <div className="absolute w-48 h-48 rounded-full pointer-events-none -bottom-16 -left-16 bg-mint/15 blur-3xl" />

            <div className="flex justify-center mb-3 sm:hidden">
              <span className="w-10 h-1 rounded-full bg-cream/25" />
            </div>

            <button
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              disabled={working}
              aria-label="Close"
              className="absolute z-10 grid transition border top-4 right-4 w-9 h-9 rounded-xl bg-cream/10 border-cream/15 place-items-center text-cream hover:bg-cream/20 disabled:opacity-50"
            >
              <X size={16} />
            </button>

            <div className="relative flex items-center gap-2 text-cream/60">
              <Library size={14} />
              <span className="text-[11px] uppercase tracking-[0.15em] font-medium">
                Book details
              </span>
            </div>

            <div className="relative flex gap-4 mt-4">
              <div className="grid w-20 overflow-hidden h-28 sm:w-24 sm:h-32 rounded-2xl bg-cream/10 ring-1 ring-cream/20 shrink-0 place-items-center">
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt={`${book?.title || "Book"} cover`}
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      console.error("Cover image failed to load:", coverUrl);
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <Library size={26} className="text-cream/40" />
                )}
              </div>

              <div className="flex-1 min-w-0 pt-1">
                {loading && !book ? (
                  <div className="space-y-2">
                    <div className="w-40 h-5 rounded bg-cream/15 animate-pulse" />
                    <div className="h-4 rounded w-28 bg-cream/10 animate-pulse" />
                  </div>
                ) : book ? (
                  <>
                    <h2
                      id="book-modal-title"
                      className="text-xl leading-tight font-display sm:text-2xl text-cream"
                    >
                      {book.title || "Untitled"}
                    </h2>
                    <p className="text-sm text-cream/70 mt-1.5 inline-flex items-center gap-1.5">
                      <User size={12} />
                      {book.author || "Unknown author"}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <StatusBadge status={status} onDark />
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          {/* ============ BODY ============ */}
          <div className="flex-1 px-5 py-5 overflow-y-auto sm:px-6">
            {fetchError && (
              <div className="flex items-start gap-2 px-4 py-3 text-sm text-red-600 border border-red-200 bg-red-50 rounded-2xl">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <p>{fetchError}</p>
              </div>
            )}

            {loading && !book && (
              <div className="space-y-3">
                <div className="h-20 rounded-2xl bg-primary/5 animate-pulse" />
                <div className="h-32 rounded-2xl bg-primary/5 animate-pulse" />
              </div>
            )}

            {book && (
              <div className="space-y-5">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatTile
                    icon={BookOpen}
                    label="Year"
                    value={book.published_year || book.publishedYear || "—"}
                    raw
                  />
                  <StatTile
                    icon={Eye}
                    label="Reads"
                    value={book.reads || book.readCount || 0}
                  />
                  <StatTile
                    icon={FileText}
                    label="Category ID"
                    value={book.category_id || book.categoryId || "—"}
                    raw
                  />
                  <StatTile
                    icon={Calendar}
                    label="Uploaded"
                    value={
                      book.created_at
                        ? new Date(book.created_at).getFullYear()
                        : "—"
                    }
                    raw
                  />
                </div>

                {/* Description */}
                {book.description && (
                  <div className="p-4 border bg-white/60 border-primary/10 rounded-2xl">
                    <h3 className="inline-flex items-center gap-2 mb-2 text-sm font-semibold text-primary">
                      <FileText size={14} className="text-gold" />
                      Description
                    </h3>
                    <p className="text-sm leading-relaxed whitespace-pre-line text-primary/70">
                      {book.description}
                    </p>
                  </div>
                )}

                {/* Meta */}
                <div className="overflow-hidden border bg-white/60 border-primary/10 rounded-2xl">
                  <ul className="divide-y divide-primary/5">
                    <MetaRow
                      icon={Hash}
                      label="Book ID"
                      value={book.id || book._id}
                    />
                    <MetaRow icon={User} label="Author" value={book.author} />
                    <MetaRow
                      icon={Calendar}
                      label="Created"
                      value={formatDateTime(book.created_at || book.createdAt)}
                    />
                    {book.updated_at && (
                      <MetaRow
                        icon={Clock}
                        label="Updated"
                        value={formatDateTime(
                          book.updated_at || book.updatedAt,
                        )}
                      />
                    )}
                    {book.pdf_path && (
                      <MetaRow
                        icon={FileText}
                        label="PDF"
                        value={book.pdf_path}
                      />
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* ============ FOOTER ============ */}
          {book && (
            <div className="shrink-0 border-t border-primary/10 bg-cream/95 backdrop-blur-sm px-5 sm:px-6 py-3.5">
              {error && (
                <div className="flex items-center gap-2 mb-2 text-xs text-red-600">
                  <AlertCircle size={13} />
                  {error}
                </div>
              )}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={working}
                  className="px-3 py-2 text-sm transition text-primary/60 hover:text-primary disabled:opacity-50"
                >
                  Close
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  {isPublished && pdfUrl && (
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-cream border border-primary/15 text-primary px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-mint transition"
                    >
                      <Download size={14} /> View PDF
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={handleToggleStatus}
                    disabled={working}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition shadow-soft disabled:opacity-70 ${
                      isPublished
                        ? "bg-gold text-primary hover:bg-gold/90"
                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                    }`}
                  >
                    {working ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Please
                        wait…
                      </>
                    ) : isPublished ? (
                      <>
                        <Undo2 size={14} /> Move to draft
                      </>
                    ) : (
                      <>
                        <Send size={14} /> Publish
                      </>
                    )}
                  </button>

                  <Link
                    to={`/admin/books/edit/${book.id || book._id}`}
                    className="inline-flex items-center gap-2 bg-primary text-cream px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition shadow-soft"
                  >
                    <Pencil size={14} /> Edit
                  </Link>

                  <button
                    type="button"
                    onClick={() => onDelete?.(book)}
                    aria-label="Delete book"
                    className="inline-flex items-center gap-2 text-red-600 border border-red-200 bg-cream px-3.5 py-2.5 rounded-xl text-sm font-medium hover:bg-red-50 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */
function StatTile({ icon: Icon, label, value, raw }) {
  const display = raw ? String(value || "—") : formatNumber(value || 0);
  return (
    <div className="bg-white/60 border border-primary/10 rounded-2xl p-3.5">
      <span className="grid w-8 h-8 rounded-lg place-items-center bg-mint text-primary">
        <Icon size={14} />
      </span>
      <p className="mt-2 text-lg truncate font-display text-primary tabular-nums">
        {display}
      </p>
      <p className="text-[10px] uppercase tracking-wider text-primary/40 mt-0.5">
        {label}
      </p>
    </div>
  );
}

function MetaRow({ icon: Icon, label, value }) {
  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <span className="w-7 h-7 rounded-lg bg-mint grid place-items-center text-primary shrink-0 mt-0.5">
        <Icon size={13} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-primary/40 font-medium">
          {label}
        </p>
        <p className="text-sm text-primary mt-0.5 break-all">{value || "—"}</p>
      </div>
    </li>
  );
}

function StatusBadge({ status, onDark = false }) {
  const s = String(status).toLowerCase();
  const config = {
    published: {
      cls: onDark
        ? "bg-emerald-500/20 text-emerald-100 border-emerald-400/40"
        : "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: CheckCircle2,
    },
    draft: {
      cls: onDark
        ? "bg-gold/20 text-gold border-gold/40"
        : "bg-gold/15 text-primary border-gold/40",
      icon: FileEdit,
    },
    archived: {
      cls: onDark
        ? "bg-cream/10 text-cream/70 border-cream/20"
        : "bg-primary/5 text-primary/60 border-primary/10",
      icon: Archive,
    },
  };
  const cfg = config[s] || config.draft;
  const Icon = cfg.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full border ${cfg.cls}`}
    >
      <Icon size={10} />
      {status}
    </span>
  );
}
