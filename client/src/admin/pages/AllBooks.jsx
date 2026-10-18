import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Library,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  CheckCircle2,
  FileEdit,
  Archive,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  Send,
  Undo2,
} from "lucide-react";

import useFetch from "../dashboard/hooks/useFetch";
import { formatDate, formatNumber } from "../dashboard/utils/format";
import { booksAPI } from "../../api/adminApi";
import { resolveCoverUrl } from "../../utils/urlUtils";

import BookDetailModal from "../components/BookDetailModal";
import DeleteBookDialog from "../components/DeleteBookDialog";
import TableSkeleton from "../../components/ui/TableSkeleton";
import EmptyState from "../../components/ui/EmptyState";
import ErrorState from "../../components/ui/ErrorState";
import RefreshBanner from "../../components/ui/RefreshBanner";
import { useToast } from "../../context/ToastContext";

/*  Config                                                             */

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "all", label: "All status" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "title", label: "Title A–Z" },
];

/* ================================================================== */
/*  Page                                                              */
/* ================================================================== */
export default function AllBooks() {
  const toast = useToast();
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [workingId, setWorkingId] = useState(null);

  /* Debounce search */
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  /* Fetch all admin books once */
  const { data, loading, isRefreshing, error, reload } = useFetch(
    () => booksAPI.listAdmin(),
    [refreshKey],
  );

  /* Extract array from { success, count, books } */
  const rawBooks = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data.books)) return data.books;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.results)) return data.results;
    if (Array.isArray(data)) return data;
    return [];
  }, [data]);

  /* Client-side filter + sort */
  const filtered = useMemo(() => {
    let list = [...rawBooks];
    const q = debouncedSearch.toLowerCase();

    if (q) {
      list = list.filter((b) => {
        const title = String(b.title || "").toLowerCase();
        const author = String(b.author || "").toLowerCase();
        return title.includes(q) || author.includes(q);
      });
    }

    if (status !== "all") {
      list = list.filter(
        (b) => String(b.status || "").toLowerCase() === status,
      );
    }

    switch (sort) {
      case "oldest":
        list.sort(
          (a, b) =>
            new Date(a.created_at || a.createdAt || 0) -
            new Date(b.created_at || b.createdAt || 0),
        );
        break;
      case "title":
        list.sort((a, b) =>
          String(a.title || "").localeCompare(String(b.title || "")),
        );
        break;
      default:
        list.sort(
          (a, b) =>
            new Date(b.created_at || b.createdAt || 0) -
            new Date(a.created_at || a.createdAt || 0),
        );
    }

    return list;
  }, [rawBooks, debouncedSearch, status, sort]);

  /* Client-side pagination */
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const books = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage],
  );

  const hasFilters = search.trim() !== "" || status !== "all";

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setSort("newest");
    setPage(1);
  };

  const handleDeleteSuccess = () => {
    setDeleteTarget(null);
    setSelectedId(null);
    reload();
  };

  const handlePublishToggle = async (book) => {
    const id = book.id || book._id;
    const isPublished = String(book.status).toLowerCase() === "published";
    setWorkingId(id);
    try {
      if (isPublished) {
        await booksAPI.unpublish(id);
        toast.info(`"${book.title}" moved to drafts.`);
      } else {
        await booksAPI.publish(id);
        toast.success(`"${book.title}" is now published.`);
      }
      reload();
    } catch (err) {
      toast.error(err?.message || "Could not update book status.");
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8 sm:py-8">
      {/* ============ HEADER ============ */}
      <header className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-2.5">
          <span className="grid w-10 h-10 rounded-2xl bg-mint place-items-center text-primary shrink-0">
            <Library size={18} />
          </span>
          <div>
            <h1 className="text-2xl tracking-tight font-display sm:text-3xl text-primary">
              All Books
            </h1>
            <p className="text-sm text-primary/60">
              Manage your library catalogue
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={loading || isRefreshing}
            className="inline-flex items-center gap-2 bg-cream border border-primary/10 text-primary px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-mint disabled:opacity-60 transition shadow-soft"
          >
            <RefreshCw
              size={14}
              className={
                loading || isRefreshing ? "animate-spin text-gold" : ""
              }
            />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>

          <Link
            to="/admin/books/upload"
            className="inline-flex items-center gap-2 bg-primary text-cream px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition shadow-soft"
          >
            <Plus size={14} />
            Upload Book
          </Link>
        </div>
      </header>

      {/* ============ TOOLBAR ============ */}
      <div className="p-3 mb-5 border bg-cream border-primary/10 rounded-2xl sm:p-4 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1 flex items-center gap-2.5 bg-white/70 border border-primary/10 rounded-xl px-3.5 focus-within:ring-2 focus-within:ring-gold/40 focus-within:border-gold/40 transition">
            <Search size={15} className="text-primary/40 shrink-0" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or author…"
              className="w-full bg-transparent outline-none text-sm text-primary placeholder:text-primary/40 py-2.5"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="transition text-primary/40 hover:text-primary"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <Select
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            options={STATUS_OPTIONS}
            aria-label="Filter by status"
          />

          <Select
            value={sort}
            onChange={(v) => {
              setSort(v);
              setPage(1);
            }}
            options={SORT_OPTIONS}
            aria-label="Sort books"
          />
        </div>

        {hasFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-3 mt-3 border-t border-primary/10">
            <span className="text-[11px] uppercase tracking-wider text-primary/40 font-medium">
              Filters:
            </span>
            {search.trim() && (
              <Chip label={`"${search}"`} onClear={() => setSearch("")} />
            )}
            {status !== "all" && (
              <Chip
                label={`Status: ${status}`}
                onClear={() => setStatus("all")}
              />
            )}
            <button
              type="button"
              onClick={clearFilters}
              className="ml-auto text-xs underline text-primary/60 hover:text-primary underline-offset-4"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ============ COUNT & REFRESH NOTICE ============ */}
      <div className="flex items-center justify-between gap-3 mb-3">
        {!loading && !error && rawBooks.length > 0 && (
          <p className="text-sm text-primary/60">
            <span className="text-base font-display text-primary">
              {formatNumber(total)}
            </span>{" "}
            {total === 1 ? "book" : "books"} found
          </p>
        )}

        {isRefreshing && (
          <RefreshBanner message="Updating catalog in background..." />
        )}
      </div>

      {/* ============ ERROR ============ */}
      {error && rawBooks.length > 0 && (
        <div className="mb-5">
          <ErrorState
            compact
            title="Could not refresh books"
            message={error}
            onRetry={reload}
            retrying={isRefreshing}
          />
        </div>
      )}

      {error && rawBooks.length === 0 && !loading && (
        <div className="my-8">
          <ErrorState
            title="Couldn't load books"
            message={error}
            onRetry={reload}
            retrying={loading}
          />
        </div>
      )}

      {/* ============ TABLE ============ */}
      <div className="overflow-hidden border bg-cream border-primary/10 rounded-2xl shadow-soft">
        {loading && rawBooks.length === 0 && (
          <TableSkeleton rows={6} columns={5} />
        )}

        {!loading && !error && books.length === 0 && (
          <EmptyState
            icon={Library}
            title={hasFilters ? "No books match your filters" : "No books yet"}
            description={
              hasFilters
                ? "Try adjusting your search query or clear selected status filters."
                : "Your digital library is waiting for its first title. Upload a book to get started."
            }
            actionLabel={
              hasFilters ? "Clear all filters" : "Upload your first book"
            }
            onAction={
              hasFilters
                ? clearFilters
                : () => (window.location.href = "/admin/books/upload")
            }
          />
        )}

        {books.length > 0 && (
          <div className={isRefreshing ? "opacity-75 transition-opacity" : ""}>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs tracking-wider text-left uppercase border-b text-primary/50 border-primary/10 bg-mint/40">
                    <th className="px-4 py-3 font-medium">Book</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Uploaded</th>
                    <th className="px-4 py-3 font-medium text-right w-52">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/5">
                  {books.map((b) => (
                    <BookRow
                      key={b.id || b._id}
                      book={b}
                      working={workingId === (b.id || b._id)}
                      onView={() => setSelectedId(b.id || b._id)}
                      onDelete={() => setDeleteTarget(b)}
                      onToggleStatus={() => handlePublishToggle(b)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <ul className="divide-y md:hidden divide-primary/5">
              {books.map((b) => (
                <BookCard
                  key={b.id || b._id}
                  book={b}
                  working={workingId === (b.id || b._id)}
                  onView={() => setSelectedId(b.id || b._id)}
                  onDelete={() => setDeleteTarget(b)}
                  onToggleStatus={() => handlePublishToggle(b)}
                />
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ============ PAGINATION ============ */}
      {!loading && !error && books.length > 0 && totalPages > 1 && (
        <Pagination
          page={safePage}
          totalPages={totalPages}
          onChange={setPage}
        />
      )}

      {/* ============ MODALS ============ */}
      <BookDetailModal
        bookId={selectedId}
        onClose={() => setSelectedId(null)}
        onDelete={(book) => {
          setSelectedId(null);
          setDeleteTarget(book);
        }}
        onStatusChange={() => {
          setSelectedId(null);
          reload();
        }}
      />

      <DeleteBookDialog
        book={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}

/*  BookRow (desktop)                                                  */

function BookRow({ book, onView, onDelete, onToggleStatus, working }) {
  const id = book.id || book._id;
  const title = book.title || "Untitled";
  const author = book.author || "—";
  const category =
    book.category_name ||
    book.categoryName ||
    book.category?.name ||
    book.category ||
    "—";
  const status = String(book.status || "draft").toLowerCase();
  const isPublished = status === "published";

  return (
    <tr onClick={onView} className="transition cursor-pointer hover:bg-mint/30">
      <td className="px-4 py-3">
        <div className="flex items-center min-w-0 gap-3">
          <BookThumb book={book} className="w-10 rounded-md h-14 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-primary truncate max-w-[220px]">
              {title}
            </p>
            <p className="text-xs text-primary/50 truncate max-w-[220px] mt-0.5">
              {author}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center px-2 py-1 text-xs rounded-lg bg-mint text-primary/70">
          {category}
        </span>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={status} />
      </td>
      <td className="px-4 py-3 text-xs text-primary/60 whitespace-nowrap">
        {formatDate(book.created_at || book.createdAt)}
      </td>
      <td className="px-4 py-3">
        <div
          className="flex items-center justify-end gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onToggleStatus}
            disabled={working}
            aria-label={isPublished ? "Unpublish book" : "Publish book"}
            title={isPublished ? "Move to draft" : "Publish"}
            className={`w-8 h-8 rounded-lg grid place-items-center transition disabled:opacity-50 ${
              isPublished
                ? "bg-gold/20 text-primary hover:bg-gold/40"
                : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
            }`}
          >
            {working ? (
              <Loader2 size={14} className="animate-spin" />
            ) : isPublished ? (
              <Undo2 size={14} />
            ) : (
              <Send size={14} />
            )}
          </button>

          <button
            type="button"
            onClick={onView}
            aria-label="View book"
            className="grid w-8 h-8 transition rounded-lg bg-mint place-items-center text-primary hover:bg-gold/30"
          >
            <Eye size={14} />
          </button>

          <Link
            to={`/admin/books/edit/${id}`}
            aria-label="Edit book"
            className="grid w-8 h-8 transition rounded-lg bg-mint place-items-center text-primary hover:bg-gold/30"
          >
            <Pencil size={14} />
          </Link>

          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete book"
            className="grid w-8 h-8 transition rounded-lg bg-mint place-items-center text-primary hover:bg-red-100 hover:text-red-600"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}

/*  BookCard (mobile)                                                  */

function BookCard({ book, onView, onDelete, onToggleStatus, working }) {
  const id = book.id || book._id;
  const title = book.title || "Untitled";
  const author = book.author || "—";
  const category =
    book.category_name ||
    book.categoryName ||
    book.category?.name ||
    book.category ||
    "—";
  const status = String(book.status || "draft").toLowerCase();
  const isPublished = status === "published";

  return (
    <li
      onClick={onView}
      className="p-4 transition cursor-pointer hover:bg-mint/30"
    >
      <div className="flex gap-3">
        <BookThumb book={book} className="h-20 rounded-lg w-14 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate text-primary">{title}</p>
          <p className="text-xs text-primary/50 truncate mt-0.5">{author}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="text-[10px] bg-mint text-primary px-2 py-0.5 rounded-lg font-medium">
              {category}
            </span>
            <StatusBadge status={status} />
          </div>

          <div
            className="flex items-center gap-1.5 mt-3 flex-wrap"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onToggleStatus}
              disabled={working}
              className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition disabled:opacity-50 ${
                isPublished
                  ? "bg-gold/20 text-primary hover:bg-gold/40"
                  : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
              }`}
            >
              {working ? (
                <Loader2 size={11} className="animate-spin" />
              ) : isPublished ? (
                <Undo2 size={11} />
              ) : (
                <Send size={11} />
              )}
              {isPublished ? "Unpublish" : "Publish"}
            </button>

            <button
              type="button"
              onClick={onView}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-primary px-2.5 py-1.5 bg-mint rounded-lg hover:bg-gold/30 transition"
            >
              <Eye size={11} /> View
            </button>

            <Link
              to={`/admin/books/edit/${id}`}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-primary px-2.5 py-1.5 bg-mint rounded-lg hover:bg-gold/30 transition"
            >
              <Pencil size={11} /> Edit
            </Link>

            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-red-600 px-2.5 py-1.5 bg-red-50 rounded-lg hover:bg-red-100 transition"
            >
              <Trash2 size={11} /> Delete
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

/*  BookThumb                                                          */

function BookThumb({ book, className = "" }) {
  const [errored, setErrored] = useState(false);

  const cover =
    book.cover_image ||
    book.coverImage ||
    book.cover ||
    book.coverUrl ||
    book.thumbnail;

  const coverUrl = resolveCoverUrl(cover);

  useEffect(() => {
    setErrored(false);
  }, [coverUrl]);

  if (!coverUrl || errored) {
    return (
      <div
        className={`${className} bg-primary grid place-items-center text-cream/70`}
      >
        <Library size={16} />
      </div>
    );
  }

  return (
    <div
      className={`${className} overflow-hidden bg-primary/10 ring-1 ring-primary/10`}
    >
      <img
        src={coverUrl}
        alt={`${book.title || "Book"} cover`}
        className="object-cover w-full h-full"
        loading="lazy"
        onError={() => {
          console.error("Book cover failed to load:", coverUrl);
          setErrored(true);
        }}
      />
    </div>
  );
}

/*  StatusBadge                                                        */

function StatusBadge({ status }) {
  const s = String(status).toLowerCase();
  const config = {
    published: {
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: CheckCircle2,
    },
    draft: { cls: "bg-gold/15 text-primary border-gold/40", icon: FileEdit },
    archived: {
      cls: "bg-primary/5 text-primary/60 border-primary/10",
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

/*  Helpers                                                            */

function Chip({ label, onClear }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-mint text-primary text-xs font-medium pl-2.5 pr-1.5 py-1 rounded-full">
      {label}
      <button
        type="button"
        onClick={onClear}
        aria-label={`Remove filter ${label}`}
        className="grid w-4 h-4 transition rounded-full place-items-center hover:bg-primary/10"
      >
        <X size={10} />
      </button>
    </span>
  );
}

function Select({ value, onChange, options, ...rest }) {
  return (
    <div className="relative min-w-0 sm:min-w-[170px]">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none w-full bg-white/70 border border-primary/10 rounded-xl text-sm text-primary py-2.5 pl-3.5 pr-8 outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/40 transition cursor-pointer"
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        className="absolute -translate-y-1/2 pointer-events-none right-3 top-1/2 text-primary/40"
      >
        <path
          d="M2 4l4 4 4-4"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function Pagination({ page, totalPages, onChange }) {
  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, page - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <nav
      aria-label="Pagination"
      className="mt-5 flex items-center justify-center gap-1.5"
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        aria-label="Previous page"
        className="grid transition border w-9 h-9 rounded-xl bg-cream border-primary/10 place-items-center text-primary/70 hover:bg-mint disabled:opacity-40"
      >
        <ChevronLeft size={15} />
      </button>

      {pages.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-current={page === n ? "page" : undefined}
          className={`w-9 h-9 rounded-xl text-sm font-medium transition ${
            page === n
              ? "bg-primary text-cream shadow-soft"
              : "bg-cream border border-primary/10 text-primary/70 hover:bg-mint"
          }`}
        >
          {n}
        </button>
      ))}

      <button
        type="button"
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        aria-label="Next page"
        className="grid transition border w-9 h-9 rounded-xl bg-cream border-primary/10 place-items-center text-primary/70 hover:bg-mint disabled:opacity-40"
      >
        <ChevronRight size={15} />
      </button>
    </nav>
  );
}
