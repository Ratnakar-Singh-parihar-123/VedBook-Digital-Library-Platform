import { useEffect, useMemo, useState } from "react";
import {
  FolderTree,
  Search,
  RefreshCw,
  AlertCircle,
  X,
  Plus,
  CheckCircle2,
  Pencil,
  Trash2,
  Library,
  Loader2,
  Power,
  PowerOff,
} from "lucide-react";

import useFetch from "../dashboard/hooks/useFetch";
import { formatDate } from "../dashboard/utils/format";
import { categoriesAPI } from "../../api/adminApi";

import CategoryModal from "../components/CategoryModal";
import DeleteCategoryDialog from "../components/DeleteCategoryDialog";
import TableSkeleton from "../../components/ui/TableSkeleton";
import EmptyState from "../../components/ui/EmptyState";
import ErrorState from "../../components/ui/ErrorState";
import RefreshBanner from "../../components/ui/RefreshBanner";

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */
const FILTER_OPTIONS = [
  { value: "all", label: "All categories" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

/* ------------------------------------------------------------------ */
/*  Robust isActive — handles boolean | 1/0 | "1"/"0" | "true"/"false"  */
/* ------------------------------------------------------------------ */
function isActive(category) {
  if (!category) return true;
  const v =
    category.is_active !== undefined
      ? category.is_active
      : category.isActive !== undefined
        ? category.isActive
        : category.active !== undefined
          ? category.active
          : category.status;

  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  if (typeof v === "string") {
    const s = v.toLowerCase().trim();
    if (["1", "true", "active", "yes", "on"].includes(s)) return true;
    if (["0", "false", "inactive", "no", "off", "disabled"].includes(s)) {
      return false;
    }
  }
  return true; // fallback — assume active
}

/* ================================================================== */
/*  Page                                                              */
/* ================================================================== */
export default function Categories() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [workingId, setWorkingId] = useState(null);
  const [toast, setToast] = useState(null);

  /* Local copy for optimistic updates */
  const [localCategories, setLocalCategories] = useState([]);

  const { data, loading, isRefreshing, error, reload } = useFetch(
    () => categoriesAPI.listAdmin(),
    [refreshKey],
  );

  /* Auto-dismiss toast */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  /* Normalise response → local state */
  useEffect(() => {
    const raw = data || {};
    const list =
      (Array.isArray(raw.categories) && raw.categories) ||
      (Array.isArray(raw.data) && raw.data) ||
      (Array.isArray(raw.results) && raw.results) ||
      (Array.isArray(raw) && raw) ||
      [];
    setLocalCategories(list);
  }, [data]);

  /* Client-side filter */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return localCategories.filter((c) => {
      const active = isActive(c);
      if (statusFilter === "active" && !active) return false;
      if (statusFilter === "inactive" && active) return false;
      if (!q) return true;
      return (
        String(c.name || "")
          .toLowerCase()
          .includes(q) ||
        String(c.description || "")
          .toLowerCase()
          .includes(q)
      );
    });
  }, [localCategories, search, statusFilter]);

  const hasFilters = search.trim() !== "" || statusFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (category) => {
    setEditing(category);
    setModalOpen(true);
  };

  const handleModalSuccess = () => {
    setModalOpen(false);
    setEditing(null);
    setRefreshKey((k) => k + 1);
  };

  const handleDeleteSuccess = () => {
    setDeleteTarget(null);
    setRefreshKey((k) => k + 1);
  };

  /* ---------- Status toggle (optimistic + rollback) ---------- */
  const handleStatusToggle = async (category) => {
    const id = category.id || category._id;
    if (!id || workingId) return;

    const current = isActive(category);
    const next = !current;

    /* 1. Optimistic local update — toggle flips instantly */
    setLocalCategories((prev) =>
      prev.map((c) =>
        (c.id || c._id) === id ? { ...c, is_active: next, isActive: next } : c,
      ),
    );
    setWorkingId(id);

    try {
      /* 2. Hit API */
      await categoriesAPI.updateStatus(id, next);

      setToast({
        type: "success",
        text: `"${category.name || "Category"}" marked ${
          next ? "Active" : "Inactive"
        }`,
      });
    } catch (err) {
      /* 3. Rollback on failure */
      setLocalCategories((prev) =>
        prev.map((c) =>
          (c.id || c._id) === id
            ? { ...c, is_active: current, isActive: current }
            : c,
        ),
      );
      setToast({
        type: "error",
        text: err?.message || "Could not update status",
      });
    } finally {
      setWorkingId(null);
    }
  };

  /* Counts for filter labels */
  const counts = useMemo(() => {
    const total = localCategories.length;
    const active = localCategories.filter((c) => isActive(c)).length;
    return { all: total, active, inactive: total - active };
  }, [localCategories]);

  return (
    <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8 sm:py-8">
      {/* ================= TOAST ================= */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[150] flex items-center gap-2 px-4 py-3 rounded-2xl shadow-soft backdrop-blur-md transition-all duration-300 ${
            toast.type === "success"
              ? "bg-emerald-50/95 border border-emerald-200 text-emerald-700"
              : "bg-red-50/95 border border-red-200 text-red-600"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={15} className="shrink-0" />
          ) : (
            <AlertCircle size={15} className="shrink-0" />
          )}
          <span className="text-xs font-medium">{toast.text}</span>
        </div>
      )}

      {/* ============ HEADER ============ */}
      <header className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-2.5">
          <span className="relative grid w-10 h-10 rounded-2xl bg-gradient-to-br from-mint to-mint/60 place-items-center text-primary shrink-0 shadow-soft">
            <FolderTree size={18} />
          </span>
          <div>
            <h1 className="text-2xl tracking-tight font-display sm:text-3xl text-primary">
              Categories
            </h1>
            <p className="text-sm text-primary/60">
              Organise your library by subject
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
            <span className="hidden sm:inline">
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </span>
          </button>

          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 bg-primary text-cream px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 active:scale-[0.98] transition shadow-soft"
          >
            <Plus size={14} />
            New Category
          </button>
        </div>
      </header>

      {/* ============ SUMMARY STATS ============ */}
      <section className="grid grid-cols-3 gap-3 mb-5 sm:gap-4">
        <SummaryCard
          icon={Library}
          label="Total"
          value={counts.all}
          tone="primary"
        />
        <SummaryCard
          icon={Power}
          label="Active"
          value={counts.active}
          tone="emerald"
        />
        <SummaryCard
          icon={PowerOff}
          label="Inactive"
          value={counts.inactive}
          tone="muted"
        />
      </section>

      {/* ============ TOOLBAR ============ */}
      <div className="p-3 mb-5 border bg-cream border-primary/10 rounded-2xl sm:p-4 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1 flex items-center gap-2.5 bg-white/70 border border-primary/10 rounded-xl px-3.5 focus-within:ring-2 focus-within:ring-gold/40 focus-within:border-gold/40 transition">
            <Search size={15} className="text-primary/40 shrink-0" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories by name…"
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

          <div className="relative min-w-0 sm:min-w-[180px]">
            <FolderTree
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary/40 pointer-events-none"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter categories"
              className="appearance-none w-full bg-white/70 border border-primary/10 rounded-xl text-sm text-primary py-2.5 pl-9 pr-8 outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/40 transition cursor-pointer"
            >
              {FILTER_OPTIONS.map((o) => (
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
        </div>

        {hasFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-3 mt-3 border-t border-primary/10">
            <span className="text-[11px] uppercase tracking-wider text-primary/40 font-medium">
              Filters:
            </span>
            {search.trim() && (
              <Chip label={`"${search}"`} onClear={() => setSearch("")} />
            )}
            {statusFilter !== "all" && (
              <Chip
                label={`Status: ${statusFilter}`}
                onClear={() => setStatusFilter("all")}
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

      {/* ============ COUNT & REFRESH ============ */}
      <div className="flex items-center justify-between gap-3 mb-3">
        {!loading && !error && localCategories.length > 0 && (
          <p className="text-sm text-primary/60">
            <span className="text-base font-display text-primary">
              {filtered.length}
            </span>{" "}
            {filtered.length === 1 ? "category" : "categories"} found
          </p>
        )}

        {isRefreshing && (
          <RefreshBanner message="Updating categories in background..." />
        )}
      </div>

      {/* ============ ERROR ============ */}
      {error && localCategories.length > 0 && (
        <div className="mb-5">
          <ErrorState
            compact
            title="Could not refresh categories"
            message={error}
            onRetry={reload}
            retrying={isRefreshing}
          />
        </div>
      )}

      {error && localCategories.length === 0 && !loading && (
        <div className="my-8">
          <ErrorState
            title="Couldn't load categories"
            message={error}
            onRetry={reload}
            retrying={loading}
          />
        </div>
      )}

      {/* ============ TABLE ============ */}
      <div className="overflow-hidden border bg-cream border-primary/10 rounded-2xl shadow-soft">
        {loading && localCategories.length === 0 && (
          <TableSkeleton rows={5} columns={5} hasThumbnail={false} />
        )}

        {!loading && !error && filtered.length === 0 && (
          <EmptyState
            icon={FolderTree}
            title={
              hasFilters
                ? "No categories match your filters"
                : "No categories yet"
            }
            description={
              hasFilters
                ? "Try adjusting your search query or clear selected status filters."
                : "Organise your library by adding your first category."
            }
            actionLabel={hasFilters ? "Clear all filters" : "Create Category"}
            onAction={hasFilters ? clearFilters : openAdd}
          />
        )}

        {filtered.length > 0 && (
          <div className={isRefreshing ? "opacity-75 transition-opacity" : ""}>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs tracking-wider text-left uppercase border-b text-primary/50 border-primary/10 bg-mint/40">
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Books</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Created</th>
                    <th className="w-40 px-4 py-3 font-medium text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/5">
                  {filtered.map((c) => (
                    <CategoryRow
                      key={c.id || c._id}
                      category={c}
                      working={workingId === (c.id || c._id)}
                      onEdit={() => openEdit(c)}
                      onDelete={() => setDeleteTarget(c)}
                      onToggleStatus={() => handleStatusToggle(c)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="divide-y md:hidden divide-primary/5">
              {filtered.map((c) => (
                <CategoryCard
                  key={c.id || c._id}
                  category={c}
                  working={workingId === (c.id || c._id)}
                  onEdit={() => openEdit(c)}
                  onDelete={() => setDeleteTarget(c)}
                  onToggleStatus={() => handleStatusToggle(c)}
                />
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ============ MODALS ============ */}
      <CategoryModal
        open={modalOpen}
        category={editing}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSuccess={handleModalSuccess}
      />

      <DeleteCategoryDialog
        category={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Summary card                                                       */
/* ------------------------------------------------------------------ */
function SummaryCard({ icon: Icon, label, value, tone }) {
  const toneMap = {
    primary: { bg: "bg-mint text-primary", ring: "ring-primary/10" },
    emerald: { bg: "bg-emerald-50 text-emerald-600", ring: "ring-emerald-100" },
    muted: { bg: "bg-primary/5 text-primary/50", ring: "ring-primary/5" },
  };
  const t = toneMap[tone] || toneMap.primary;

  return (
    <div
      className={`bg-cream border border-primary/10 rounded-2xl p-3.5 sm:p-4 ring-1 ${t.ring} hover:shadow-soft transition-all duration-300`}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 ${t.bg}`}
        >
          <Icon size={15} />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-primary/50 font-medium">
            {label}
          </p>
          <p className="font-display text-xl sm:text-2xl text-primary tabular-nums mt-0.5">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Category row (desktop)                                             */
/* ------------------------------------------------------------------ */
function CategoryRow({ category, working, onEdit, onDelete, onToggleStatus }) {
  const name = category.name || "Untitled";
  const description = category.description || "";
  const active = isActive(category);
  const booksCount =
    category.bookCount ??
    category.booksCount ??
    category.books ??
    category.totalBooks ??
    null;

  return (
    <tr
      className={`transition-colors ${
        active
          ? "hover:bg-mint/30"
          : "hover:bg-primary/[0.02] bg-primary/[0.015]"
      }`}
    >
      <td className="px-4 py-3">
        <div className="flex items-center min-w-0 gap-3">
          <div
            className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 transition-colors ${
              active ? "bg-mint text-primary" : "bg-primary/5 text-primary/40"
            }`}
          >
            <FolderTree size={15} />
          </div>
          <div className="min-w-0">
            <p
              className={`text-sm font-medium truncate ${
                active ? "text-primary" : "text-primary/60"
              }`}
            >
              {name}
            </p>
            {description && (
              <p className="text-xs text-primary/50 truncate max-w-[300px] mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>
      </td>

      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg bg-mint text-primary">
          <Library size={11} />
          {booksCount != null ? booksCount : "—"}
        </span>
      </td>

      <td className="px-4 py-3">
        <StatusToggle
          active={active}
          working={working}
          onToggle={onToggleStatus}
        />
      </td>

      <td className="px-4 py-3 text-xs text-primary/60 whitespace-nowrap">
        {formatDate(category.createdAt || category.created_at)}
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={onEdit}
            aria-label="Edit category"
            className="grid w-8 h-8 transition rounded-lg bg-mint place-items-center text-primary hover:bg-gold/30"
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete category"
            className="grid w-8 h-8 transition rounded-lg bg-mint place-items-center text-primary hover:bg-red-100 hover:text-red-600"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ------------------------------------------------------------------ */
/*  Category card (mobile)                                             */
/* ------------------------------------------------------------------ */
function CategoryCard({ category, working, onEdit, onDelete, onToggleStatus }) {
  const name = category.name || "Untitled";
  const description = category.description || "";
  const active = isActive(category);
  const booksCount =
    category.bookCount ??
    category.booksCount ??
    category.books ??
    category.totalBooks ??
    null;

  return (
    <li className={`p-4 ${active ? "" : "bg-primary/[0.015]"}`}>
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${
            active ? "bg-mint text-primary" : "bg-primary/5 text-primary/40"
          }`}
        >
          <FolderTree size={16} />
        </div>

        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium truncate ${
              active ? "text-primary" : "text-primary/60"
            }`}
          >
            {name}
          </p>
          {description && (
            <p className="text-xs text-primary/50 truncate mt-0.5">
              {description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-2">
            <StatusToggle
              active={active}
              working={working}
              onToggle={onToggleStatus}
              compact
            />
            {booksCount != null && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-mint text-primary px-2 py-0.5 rounded-lg font-medium">
                <Library size={10} /> {booksCount} books
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-3">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-primary px-2.5 py-1.5 bg-mint rounded-lg hover:bg-gold/30 transition"
            >
              <Pencil size={11} /> Edit
            </button>
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

/* ------------------------------------------------------------------ */
/*  Status toggle (inline switch)                                      */
/* ------------------------------------------------------------------ */
function StatusToggle({ active, working, onToggle, compact = false }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={working}
      role="switch"
      aria-checked={active}
      aria-label={active ? "Deactivate category" : "Activate category"}
      className={`group inline-flex items-center gap-2 rounded-xl border px-2.5 py-1.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${
        active
          ? "bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
          : "bg-primary/[0.04] border-primary/15 hover:bg-primary/[0.08]"
      }`}
    >
      {/* Switch track — bigger + clearer */}
      <span
        className={`relative inline-flex h-5 w-9 rounded-full transition-colors duration-200 shrink-0 ${
          active ? "bg-emerald-500" : "bg-primary/25"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-transform duration-200 ${
            active ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </span>

      {/* Label */}
      {!compact && (
        <span
          className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
            active ? "text-emerald-700" : "text-primary/50"
          }`}
        >
          {active ? "Active" : "Inactive"}
        </span>
      )}

      {/* Spinner during API call */}
      {working && (
        <Loader2
          size={11}
          className={`shrink-0 animate-spin ${
            active ? "text-emerald-600" : "text-primary/50"
          }`}
        />
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Chip                                                               */
/* ------------------------------------------------------------------ */
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
