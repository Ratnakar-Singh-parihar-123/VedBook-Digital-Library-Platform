import { useEffect, useMemo, useState } from "react";
import {
  Users as UsersIcon,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  ShieldCheck,
  X,
} from "lucide-react";

import useFetch from "../dashboard/hooks/useFetch";
import { formatDate } from "../dashboard/utils/format";
import { usersAPI } from "../../api/adminApi";
import { resolveAvatarUrl } from "../../utils/urlUtils";

import UserDetailModal from "../components/UserDetailModal";
import TableSkeleton from "../../components/ui/TableSkeleton";
import EmptyState from "../../components/ui/EmptyState";
import ErrorState from "../../components/ui/ErrorState";
import RefreshBanner from "../../components/ui/RefreshBanner";

/*  Config                                                             */

const PAGE_SIZE = 10;

const ROLE_OPTIONS = [
  { value: "all", label: "All roles" },
  { value: "admin", label: "Admin" },
  { value: "user", label: "User" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
];

/*  🐛 DEBUG FLAG — set to false in production                        */

const DEBUG = true;

function dbg(...args) {
  if (DEBUG)
    console.log("%c[USERS-DEBUG]", "color:#0ea5e9;font-weight:bold", ...args);
}
function _dbgWarn(...args) {
  if (DEBUG)
    console.warn("%c[USERS-DEBUG]", "color:#f59e0b;font-weight:bold", ...args);
}
function dbgErr(...args) {
  if (DEBUG)
    console.error("%c[USERS-DEBUG]", "color:#ef4444;font-weight:bold", ...args);
}

/*  Helper: extract raw avatar path from user object, then resolve    */

function resolveUserAvatarUrl(user) {
  if (!user) return null;
  const raw =
    user?.profile_pic ||
    user?.avatar ||
    user?.avatarUrl ||
    user?.profilePic ||
    user?.profileImage ||
    user?.photo ||
    user?.image ||
    user?.pic ||
    user?.img ||
    user?.profile_url ||
    null;

  if (!raw) return null;
  if (typeof raw === "object" && raw.url) return resolveAvatarUrl(raw.url);
  return resolveAvatarUrl(raw);
}

/*  Page                                                               */

export default function Users() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, loading, isRefreshing, error, reload } = useFetch(
    () =>
      usersAPI.list({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        role: role !== "all" ? role : undefined,
        status: status !== "all" ? status : undefined,
      }),
    [page, debouncedSearch, role, status, refreshKey],
  );

  /* 🐛 DEBUG: raw API response */
  useEffect(() => {
    if (data) {
      dbg("📥 RAW API RESPONSE:", data);
      if (Array.isArray(data?.users) && data.users[0]) {
        dbg("📥 FIRST USER OBJECT:", JSON.stringify(data.users[0], null, 2));
        dbg("📥 FIRST USER KEYS:", Object.keys(data.users[0]));
      }
      if (Array.isArray(data) && data[0]) {
        dbg(
          "📥 FIRST USER OBJECT (array root):",
          JSON.stringify(data[0], null, 2),
        );
      }
    }
    if (error) dbgErr("API error:", error);
  }, [data, error]);

  const { users, total, totalPages } = useMemo(() => {
    const raw = data || {};
    const list =
      (Array.isArray(raw.users) && raw.users) ||
      (Array.isArray(raw.data) && raw.data) ||
      (Array.isArray(raw.results) && raw.results) ||
      (Array.isArray(raw) && raw) ||
      [];

    const t = raw.total ?? raw.count ?? raw.totalCount ?? list.length;
    const tp =
      raw.totalPages ?? raw.pages ?? Math.max(1, Math.ceil(t / PAGE_SIZE));

    dbg("📊 Normalised list size:", list.length, "| total:", t, "| pages:", tp);
    return { users: list, total: t, totalPages: tp };
  }, [data]);

  const hasFilters = search.trim() !== "" || role !== "all" || status !== "all";

  const clearFilters = () => {
    setSearch("");
    setRole("all");
    setStatus("all");
    setPage(1);
  };

  return (
    <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8 sm:py-8">
      {/* HEADER */}
      <header className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid w-10 h-10 rounded-2xl bg-mint place-items-center text-primary shrink-0">
              <UsersIcon size={18} />
            </span>
            <div>
              <h1 className="text-2xl tracking-tight font-display sm:text-3xl text-primary">
                Users
              </h1>
              <p className="text-sm text-primary/60">
                Manage readers and admin accounts
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setRefreshKey((k) => k + 1)}
          disabled={loading || isRefreshing}
          className="inline-flex items-center gap-2 bg-cream border border-primary/10 text-primary px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-mint hover:border-primary/20 disabled:opacity-60 transition shadow-soft"
        >
          <RefreshCw
            size={14}
            className={loading || isRefreshing ? "animate-spin text-gold" : ""}
          />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      {/* TOOLBAR */}
      <div className="p-3 mb-5 border bg-cream border-primary/10 rounded-2xl sm:p-4 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1 flex items-center gap-2.5 bg-white/70 border border-primary/10 rounded-xl px-3.5 focus-within:ring-2 focus-within:ring-gold/40 focus-within:border-gold/40 transition">
            <Search size={15} className="text-primary/40 shrink-0" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or ID…"
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
            value={role}
            onChange={(v) => {
              setRole(v);
              setPage(1);
            }}
            options={ROLE_OPTIONS}
            icon={ShieldCheck}
            aria-label="Filter by role"
          />

          <Select
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            options={STATUS_OPTIONS}
            icon={UserCheck}
            aria-label="Filter by status"
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
            {role !== "all" && (
              <Chip label={`Role: ${role}`} onClear={() => setRole("all")} />
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

      {/* COUNT & REFRESH */}
      <div className="flex items-center justify-between gap-3 mb-3">
        {!loading && !error && users.length > 0 && (
          <p className="text-sm text-primary/60">
            <span className="text-base font-display text-primary">{total}</span>{" "}
            {total === 1 ? "user" : "users"} found
          </p>
        )}
        {isRefreshing && (
          <RefreshBanner message="Updating users in background..." />
        )}
      </div>

      {/* ERROR */}
      {error && users.length > 0 && (
        <div className="mb-5">
          <ErrorState
            compact
            title="Could not refresh users"
            message={error}
            onRetry={reload}
            retrying={isRefreshing}
          />
        </div>
      )}
      {error && users.length === 0 && !loading && (
        <div className="my-8">
          <ErrorState
            title="Couldn't load users"
            message={error}
            onRetry={reload}
            retrying={loading}
          />
        </div>
      )}

      {/* TABLE / LIST */}
      <div className="overflow-hidden border bg-cream border-primary/10 rounded-2xl shadow-soft">
        {loading && users.length === 0 && (
          <TableSkeleton rows={6} columns={5} hasThumbnail={true} />
        )}

        {!loading && !error && users.length === 0 && (
          <EmptyState
            icon={UsersIcon}
            title={hasFilters ? "No users match your filters" : "No users yet"}
            description={
              hasFilters
                ? "Try adjusting your search query or clear selected status and role filters."
                : "Registered readers and staff members will appear here."
            }
            actionLabel={hasFilters ? "Clear all filters" : undefined}
            onAction={hasFilters ? clearFilters : undefined}
          />
        )}

        {users.length > 0 && (
          <div className={isRefreshing ? "opacity-75 transition-opacity" : ""}>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs tracking-wider text-left uppercase border-b text-primary/50 border-primary/10 bg-mint/40">
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Joined</th>
                    <th className="w-24 px-4 py-3 font-medium text-right">
                      View
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/5">
                  {users.map((u) => (
                    <UserRow
                      key={u._id || u.id}
                      user={u}
                      onOpen={() => setSelectedId(u._id || u.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y md:hidden divide-primary/5">
              {users.map((u) => (
                <UserCard
                  key={u._id || u.id}
                  user={u}
                  onOpen={() => setSelectedId(u._id || u.id)}
                />
              ))}
            </ul>
          </div>
        )}
      </div>

      {!loading && !error && users.length > 0 && totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      )}

      <UserDetailModal
        userId={selectedId}
        onClose={() => setSelectedId(null)}
        onUserUpdated={() => reload()}
        onUserDeleted={() => {
          setSelectedId(null);
          reload();
        }}
      />
    </div>
  );
}

/*  Avatar — full debug + on-screen status badge                       */

function Avatar({ user, size = 36, className = "" }) {
  const name = user?.name || user?.fullName || "Unnamed";
  const initial = (name.charAt(0) || "U").toUpperCase();
  const src = resolveAvatarUrl(user);
  const [broken, setBroken] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | loading | loaded | error | empty

  useEffect(() => {
    setBroken(false);
    setStatus(src ? "loading" : "empty");
  }, [src]);

  useEffect(() => {
    dbg("🖼️ Avatar render:", { name, src, status, broken });
  }, [name, src, status, broken]);

  /* ---- RENDER: image ---- */
  if (src && !broken) {
    return (
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <img
          src={src}
          alt={name}
          width={size}
          height={size}
          onLoad={() => {
            dbg("✅ IMAGE LOADED OK:", src);
            setStatus("loaded");
          }}
          onError={(e) => {
            dbgErr("❌ IMAGE FAILED TO LOAD:", src, e?.target?.src);
            setBroken(true);
            setStatus("error");
          }}
          className={`rounded-full object-cover w-full h-full bg-mint ${className}`}
        />

        {/* on-screen debug badge — sirf DEBUG mode me */}
        {DEBUG && (
          <span
            title={`src=${src}\nstatus=${status}`}
            className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-cream ${
              status === "loading"
                ? "bg-yellow-400"
                : status === "loaded"
                  ? "bg-emerald-500"
                  : status === "error"
                    ? "bg-red-500"
                    : "bg-primary/30"
            }`}
          />
        )}
      </div>
    );
  }

  /* ---- RENDER: initials fallback ---- */
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        aria-label={name}
        className={`grid rounded-full bg-gold text-primary place-items-center font-display font-bold w-full h-full ${className}`}
        style={{ fontSize: Math.max(10, size * 0.4) }}
      >
        {initial}
      </div>
      {DEBUG && (
        <span
          title={src ? `broken: ${src}` : "no avatar field on user"}
          className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-cream ${
            broken ? "bg-red-500" : "bg-primary/30"
          }`}
        />
      )}
    </div>
  );
}

/*  UserRow                                                            */

function UserRow({ user, onOpen }) {
  /* 🐛 DEBUG — sirf pehle user ke liye, har render pe spam na ho */
  if (DEBUG) {
    dbg("👤 UserRow user:", JSON.stringify(user, null, 2));
  }

  const name = user.name || user.fullName || "Unnamed";
  const email = user.email || "—";
  const role = user.role || "user";
  const status = (user.status || "active").toLowerCase();

  return (
    <tr onClick={onOpen} className="transition cursor-pointer hover:bg-mint/30">
      <td className="px-4 py-3">
        <div className="flex items-center min-w-0 gap-3">
          <Avatar user={user} size={36} />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate text-primary">{name}</p>
            <p className="text-xs truncate text-primary/50">{email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <RoleBadge role={role} />
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={status} />
      </td>
      <td className="px-4 py-3 text-xs text-primary/60 whitespace-nowrap">
        {formatDate(user.createdAt || user.joinedAt)}
      </td>
      <td className="px-4 py-3 text-right">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          className="text-xs font-medium text-gold hover:underline"
        >
          View →
        </button>
      </td>
    </tr>
  );
}

/*  UserCard                                                           */

function UserCard({ user, onOpen }) {
  const name = user.name || user.fullName || "Unnamed";
  const email = user.email || "—";
  const role = user.role || "user";
  const status = (user.status || "active").toLowerCase();

  return (
    <li
      onClick={onOpen}
      className="p-4 transition cursor-pointer hover:bg-mint/30"
    >
      <div className="flex items-start gap-3">
        <Avatar user={user} size={40} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate text-primary">{name}</p>
          <p className="text-xs text-primary/50 truncate mt-0.5">{email}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <RoleBadge role={role} />
            <StatusBadge status={status} />
          </div>
        </div>
        <span className="text-xs text-gold shrink-0 pt-0.5">→</span>
      </div>
    </li>
  );
}

/*  Small pieces                                                       */

function RoleBadge({ role }) {
  const isAdmin = String(role).toLowerCase() === "admin";
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full ${
        isAdmin
          ? "bg-gold/20 text-primary border border-gold/40"
          : "bg-mint text-primary border border-primary/10"
      }`}
    >
      {isAdmin ? <ShieldCheck size={10} /> : <UsersIcon size={10} />}
      {role}
    </span>
  );
}

function StatusBadge({ status }) {
  const s = String(status).toLowerCase();
  const config = {
    active: {
      cls: "bg-mint text-primary border-primary/10",
      dot: "bg-emerald-500",
    },
    inactive: {
      cls: "bg-primary/5 text-primary/60 border-primary/10",
      dot: "bg-primary/30",
    },
    suspended: {
      cls: "bg-red-50 text-red-600 border-red-200",
      dot: "bg-red-500",
    },
  };
  const cfg = config[s] || config.inactive;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full border ${cfg.cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
}

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

function Select({ value, onChange, options, icon: Icon, ...rest }) {
  return (
    <div className="relative min-w-0 sm:min-w-[160px]">
      {Icon && (
        <Icon
          size={14}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary/40 pointer-events-none"
        />
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none w-full bg-white/70 border border-primary/10 rounded-xl text-sm text-primary py-2.5 pr-8 outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/40 transition cursor-pointer ${
          Icon ? "pl-9" : "pl-3.5"
        }`}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronRight
        size={14}
        className="absolute rotate-90 -translate-y-1/2 pointer-events-none right-3 top-1/2 text-primary/40"
      />
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
