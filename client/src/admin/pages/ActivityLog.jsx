import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  History,
  Search,
  RefreshCw,
  AlertCircle,
  X,
  Calendar,
  Upload,
  Send,
  Undo2,
  Pencil,
  Trash2,
  FileEdit,
  CheckCircle2,
  UserPlus,
  UserMinus,
  BookOpen,
  FolderTree,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity,
  Shield,
  ArrowRight,
  Layers,
} from "lucide-react";

import Loader from "../../components/ui/Loader";
import { analyticsAPI } from "../../api/analyticsApi";
import useFetch from "../dashboard/hooks/useFetch";
import { formatDateTime } from "../dashboard/utils/format";

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */
const PAGE_SIZE = 12;

const ACTION_META = {
  upload: {
    label: "Uploaded",
    icon: Upload,
    tone: "primary",
    verb: "uploaded",
  },
  publish: {
    label: "Published",
    icon: Send,
    tone: "emerald",
    verb: "published",
  },
  unpublish: {
    label: "Unpublished",
    icon: Undo2,
    tone: "gold",
    verb: "moved to draft",
  },
  update: { label: "Updated", icon: Pencil, tone: "primary", verb: "updated" },
  edit: { label: "Edited", icon: FileEdit, tone: "primary", verb: "edited" },
  delete: { label: "Deleted", icon: Trash2, tone: "red", verb: "deleted" },
  create: {
    label: "Created",
    icon: CheckCircle2,
    tone: "emerald",
    verb: "created",
  },
  user_add: {
    label: "User added",
    icon: UserPlus,
    tone: "primary",
    verb: "added a user",
  },
  user_del: {
    label: "User removed",
    icon: UserMinus,
    tone: "red",
    verb: "removed a user",
  },
  login: {
    label: "Logged in",
    icon: Shield,
    tone: "primary",
    verb: "logged in",
  },
  logout: {
    label: "Logged out",
    icon: Shield,
    tone: "primary",
    verb: "logged out",
  },
};

const ENTITY_META = {
  book: { label: "Book", icon: BookOpen, tone: "primary" },
  category: { label: "Category", icon: FolderTree, tone: "gold" },
  user: { label: "User", icon: Users, tone: "accent" },
  admin: { label: "Admin", icon: Shield, tone: "primary" },
  settings: { label: "Settings", icon: Settings, tone: "primary" },
};

const FILTER_TABS = [
  { key: "all", label: "All", icon: Layers },
  { key: "book", label: "Books", icon: BookOpen },
  { key: "category", label: "Categories", icon: FolderTree },
  { key: "user", label: "Users", icon: Users },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function ActivityLog() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [page, setPage] = useState(1);

  const { data, loading, error, reload } = useFetch(
    () => analyticsAPI.getActivityLog({ limit: 200 }),
    [refreshKey],
  );

  /* Debounce search */
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim().toLowerCase());
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  /* Extract array */
  const rawActivities = useMemo(() => {
    const raw = data || {};
    const arr =
      (Array.isArray(raw.activities) && raw.activities) ||
      (Array.isArray(raw.data) && raw.data) ||
      (Array.isArray(raw.results) && raw.results) ||
      (Array.isArray(raw) && raw) ||
      [];
    return arr;
  }, [data]);

  /* Normalise */
  const activities = useMemo(() => {
    return rawActivities.map((a) => ({
      id: a._id || a.id || `${a.action}-${a.entityId}-${a.createdAt}`,
      action: a.action || a.type || "unknown",
      entityType: a.entityType || a.entity_type || a.targetType || "—",
      entityId: a.entityId || a.entity_id || a.targetId || a.bookId || "—",
      details: a.details || {},
      createdAt: a.createdAt || a.created_at || a.timestamp || a.date,
      adminName:
        a.adminName ||
        a.admin?.name ||
        a.admin?.email ||
        a.performedBy?.name ||
        null,
    }));
  }, [rawActivities]);

  /* Filter */
  const filtered = useMemo(() => {
    let list = [...activities];

    if (entityFilter !== "all") {
      list = list.filter(
        (a) => String(a.entityType).toLowerCase() === entityFilter,
      );
    }

    if (debouncedSearch) {
      list = list.filter((a) => {
        const hay = [
          a.action,
          a.entityType,
          String(a.entityId),
          a.details?.title,
          a.details?.name,
          a.adminName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(debouncedSearch);
      });
    }

    /* Sort newest first */
    list.sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
    );

    return list;
  }, [activities, entityFilter, debouncedSearch]);

  /* Pagination */
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage],
  );

  /* Group by date */
  const grouped = useMemo(() => groupByDate(pageItems), [pageItems]);

  /* Counts per filter */
  const counts = useMemo(() => {
    const c = { all: activities.length, book: 0, category: 0, user: 0 };
    for (const a of activities) {
      const t = String(a.entityType).toLowerCase();
      if (c[t] !== undefined) c[t]++;
    }
    return c;
  }, [activities]);

  const hasFilters = search.trim() !== "" || entityFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setEntityFilter("all");
    setPage(1);
  };

  return (
    <div className="max-w-5xl px-4 py-6 mx-auto sm:px-6 lg:px-8 sm:py-8">
      {/* ================= HEADER ================= */}
      <header className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-2.5">
          <span className="grid w-10 h-10 rounded-2xl bg-mint place-items-center text-primary shrink-0">
            <History size={18} />
          </span>
          <div>
            <h1 className="text-2xl tracking-tight font-display sm:text-3xl text-primary">
              Admin Activity Log
            </h1>
            <p className="text-sm text-primary/60">
              Track everything happening in your library
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setRefreshKey((k) => k + 1)}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-cream border border-primary/10 text-primary px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-mint disabled:opacity-60 transition shadow-soft"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </header>

      {/* ================= ERROR ================= */}
      {error && (
        <div className="flex items-start gap-2 px-4 py-3 mb-6 text-sm text-red-600 border border-red-200 bg-red-50 rounded-2xl">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium">Couldn't load activity log</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
          <button
            type="button"
            onClick={reload}
            className="text-xs font-medium underline underline-offset-2 shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* ================= TOOLBAR ================= */}
      <div className="p-3 mb-5 border bg-cream border-primary/10 rounded-2xl sm:p-4 shadow-soft">
        {/* Filter tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {FILTER_TABS.map((tab) => {
            const Icon = tab.icon;
            const on = entityFilter === tab.key;
            const count = counts[tab.key] ?? 0;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setEntityFilter(tab.key);
                  setPage(1);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition ${
                  on
                    ? "bg-primary text-cream shadow-soft"
                    : "bg-white border border-primary/10 text-primary/70 hover:bg-mint hover:text-primary"
                }`}
              >
                <Icon size={13} />
                {tab.label}
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full tabular-nums ${
                    on ? "bg-cream/20 text-cream" : "bg-mint text-primary/70"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2.5 bg-white/70 border border-primary/10 rounded-xl px-3.5 focus-within:ring-2 focus-within:ring-gold/40 focus-within:border-gold/40 transition">
          <Search size={15} className="text-primary/40 shrink-0" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, entity, title, or admin…"
            className="w-full bg-transparent outline-none text-sm text-primary placeholder:text-primary/40 py-2.5"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="transition text-primary/40 hover:text-primary shrink-0"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Active chips */}
        {hasFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-3 mt-3 border-t border-primary/10">
            <span className="text-[11px] uppercase tracking-wider text-primary/40 font-medium">
              Filters:
            </span>
            {search.trim() && (
              <Chip label={`"${search}"`} onClear={() => setSearch("")} />
            )}
            {entityFilter !== "all" && (
              <Chip
                label={
                  FILTER_TABS.find((t) => t.key === entityFilter)?.label ||
                  entityFilter
                }
                onClear={() => setEntityFilter("all")}
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

      {/* ================= COUNT ================= */}
      {!loading && !error && (
        <p className="mb-4 text-sm text-primary/60">
          <span className="text-base font-display text-primary">{total}</span>{" "}
          {total === 1 ? "activity" : "activities"} found
        </p>
      )}

      {/* ================= LIST ================= */}
      {loading ? (
        <div className="py-16 border bg-cream border-primary/10 rounded-2xl">
          <Loader center size={32} label="Loading activities" />
        </div>
      ) : pageItems.length === 0 ? (
        <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <section key={group.date}>
              {/* Date header */}
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary/60 bg-mint/60 px-3 py-1.5 rounded-full">
                  <Calendar size={11} />
                  {group.label}
                </span>
                <span className="text-[11px] text-primary/40">
                  {group.items.length}{" "}
                  {group.items.length === 1 ? "activity" : "activities"}
                </span>
                <span className="flex-1 h-px bg-primary/10" />
              </div>

              {/* Items */}
              <div className="overflow-hidden border bg-cream border-primary/10 rounded-2xl shadow-soft">
                <ul className="divide-y divide-primary/5">
                  {group.items.map((a) => (
                    <ActivityRow key={a.id} activity={a} />
                  ))}
                </ul>
              </div>
            </section>
          ))}
        </div>
      )}

      {/* ================= PAGINATION ================= */}
      {!loading && !error && totalPages > 1 && (
        <Pagination
          page={safePage}
          totalPages={totalPages}
          onChange={setPage}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Activity Row                                                       */
/* ------------------------------------------------------------------ */
function ActivityRow({ activity }) {
  const actionMeta = ACTION_META[String(activity.action).toLowerCase()] || {
    label: humanise(activity.action),
    icon: Activity,
    tone: "primary",
    verb: String(activity.action).replace(/_/g, " "),
  };

  const entityMeta = ENTITY_META[String(activity.entityType).toLowerCase()] || {
    label: humanise(activity.entityType),
    icon: Layers,
    tone: "primary",
  };

  const ActionIcon = actionMeta.icon;
  const EntityIcon = entityMeta.icon;

  const actionToneCls =
    {
      primary: "bg-mint text-primary",
      emerald: "bg-emerald-50 text-emerald-600",
      gold: "bg-gold/25 text-primary",
      red: "bg-red-50 text-red-600",
    }[actionMeta.tone] || "bg-mint text-primary";

  /* Build descriptive text */
  const title = activity.details?.title || activity.details?.name || null;
  const entityLabel = entityMeta.label.toLowerCase();

  let description = `${actionMeta.verb}`;
  if (activity.entityType && activity.entityType !== "—") {
    description += ` a ${entityLabel}`;
  }
  if (title) {
    description += ` "${title}"`;
  }

  /* Route to related entity */
  const entityId = activity.entityId;
  const entityType = String(activity.entityType).toLowerCase();
  const entityLink =
    entityType === "book" && entityId !== "—"
      ? `/admin/books/edit/${entityId}`
      : null;

  return (
    <li className="group px-4 py-3.5 hover:bg-mint/30 transition">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <span
          className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 ${actionToneCls}`}
        >
          <ActionIcon size={15} />
        </span>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="text-sm leading-snug text-primary">
              <span className="font-medium capitalize">{description}</span>
              {activity.adminName && (
                <>
                  <span className="text-primary/30 mx-1.5">·</span>
                  <span className="text-xs text-primary/50">
                    by {activity.adminName}
                  </span>
                </>
              )}
            </p>

            <time
              className="text-[11px] text-primary/40 whitespace-nowrap shrink-0"
              title={formatDateTime(activity.createdAt)}
            >
              {formatDateTime(activity.createdAt)}
            </time>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {/* Entity chip */}
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-primary/10 text-primary/60">
              <EntityIcon size={9} />
              {entityMeta.label}
            </span>

            {/* Entity ID */}
            {entityId !== "—" && (
              <span className="inline-flex items-center gap-1 text-[10px] text-primary/40 font-mono">
                #{String(entityId).slice(-8)}
              </span>
            )}

            {/* Action type */}
            <span className="text-[10px] text-primary/40 capitalize">
              {activity.action}
            </span>

            {/* Edit link */}
            {entityLink && (
              <Link
                to={entityLink}
                className="ml-auto inline-flex items-center gap-1 text-[10.5px] font-medium text-gold hover:underline opacity-0 group-hover:opacity-100 transition"
              >
                View <ArrowRight size={10} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function humanise(str) {
  if (!str) return "—";
  return String(str)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function groupByDate(items) {
  const map = new Map();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  for (const a of items) {
    const dt = a.createdAt ? new Date(a.createdAt) : null;
    let key = "Unknown";
    let label = "Unknown date";

    if (dt && !isNaN(dt.getTime())) {
      const dayStart = new Date(dt);
      dayStart.setHours(0, 0, 0, 0);

      if (dayStart.getTime() === today.getTime()) {
        key = "today";
        label = "Today";
      } else if (dayStart.getTime() === yesterday.getTime()) {
        key = "yesterday";
        label = "Yesterday";
      } else {
        key = dayStart.toISOString().slice(0, 10);
        label = dayStart.toLocaleDateString(undefined, {
          weekday: "short",
          day: "numeric",
          month: "short",
          year:
            dayStart.getFullYear() !== today.getFullYear()
              ? "numeric"
              : undefined,
        });
      }
    }

    if (!map.has(key)) map.set(key, { date: key, label, items: [] });
    map.get(key).items.push(a);
  }

  return Array.from(map.values());
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

/* ------------------------------------------------------------------ */
/*  Empty state                                                        */
/* ------------------------------------------------------------------ */
function EmptyState({ hasFilters, onClear }) {
  return (
    <div className="px-6 py-16 text-center border bg-cream border-primary/10 rounded-2xl">
      <div className="grid mx-auto mb-4 w-14 h-14 rounded-2xl bg-mint place-items-center">
        <History size={22} className="text-primary/50" />
      </div>
      <h3 className="text-lg font-display text-primary">
        {hasFilters ? "No matching activities" : "No activities yet"}
      </h3>
      <p className="max-w-sm mx-auto mt-1 text-sm text-primary/50">
        {hasFilters
          ? "Try adjusting your search or filters."
          : "Admin actions will appear here as you manage the library."}
      </p>
      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 inline-flex items-center gap-2 bg-primary text-cream px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition shadow-soft"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Pagination                                                         */
/* ------------------------------------------------------------------ */
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
        className="grid transition border w-9 h-9 rounded-xl bg-cream border-primary/10 place-items-center text-primary/70 hover:bg-mint disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={15} />
      </button>

      {start > 1 && (
        <>
          <PageBtn n={1} active={page === 1} onClick={onChange} />
          {start > 2 && <span className="px-1 text-primary/40">…</span>}
        </>
      )}

      {pages.map((n) => (
        <PageBtn key={n} n={n} active={page === n} onClick={onChange} />
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && (
            <span className="px-1 text-primary/40">…</span>
          )}
          <PageBtn
            n={totalPages}
            active={page === totalPages}
            onClick={onChange}
          />
        </>
      )}

      <button
        type="button"
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        aria-label="Next page"
        className="grid transition border w-9 h-9 rounded-xl bg-cream border-primary/10 place-items-center text-primary/70 hover:bg-mint disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronRight size={15} />
      </button>
    </nav>
  );
}

function PageBtn({ n, active, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(n)}
      aria-current={active ? "page" : undefined}
      className={`w-9 h-9 rounded-xl text-sm font-medium transition ${
        active
          ? "bg-primary text-cream shadow-soft"
          : "bg-cream border border-primary/10 text-primary/70 hover:bg-mint"
      }`}
    >
      {n}
    </button>
  );
}
