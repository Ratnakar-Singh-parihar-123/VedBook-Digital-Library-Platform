import { useEffect, useRef, useState } from "react";
import {
  X,
  Mail,
  ShieldCheck,
  Users as UsersIcon,
  Calendar,
  Clock,
  BookOpen,
  BookMarked,
  Flame,
  Award,
  Activity,
  Ban,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Hash,
  Send,
} from "lucide-react";

import useFetch from "../dashboard/hooks/useFetch";
import { formatDateTime, formatNumber } from "../dashboard/utils/format";
import { usersAPI } from "../../api/adminApi";

/* ------------------------------------------------------------------ */
/*  Avatar URL resolver — same as Users.jsx                           */
/* ------------------------------------------------------------------ */
const API_BASE = import.meta.env?.VITE_API_URL || "";

function resolveAvatarUrl(user) {
  if (!user) return null;

  const raw =
    user?.profile_pic || // 👈 backend isi naam se bhej raha hai
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

  if (typeof raw === "string") {
    if (
      raw.startsWith("http") ||
      raw.startsWith("data:") ||
      raw.startsWith("blob:")
    ) {
      return raw;
    }
    return API_BASE
      ? `${API_BASE.replace(/\/$/, "")}/${raw.replace(/^\//, "")}`
      : raw;
  }

  if (typeof raw === "object" && raw.url) {
    return resolveAvatarUrl({ profile_pic: raw.url });
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export default function UserDetailModal({
  userId,
  onClose,
  onUserUpdated,
  onUserDeleted,
}) {
  const open = Boolean(userId);
  const panelRef = useRef(null);
  const closeBtnRef = useRef(null);
  const [tab, setTab] = useState("overview");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  /* Reset tab and action error when opening a different user */
  useEffect(() => {
    if (open) {
      setTab("overview");
      setActionError("");
      setCurrentUser(null);
      setConfirmDelete(false);
    }
  }, [open, userId]);

  /* Fetch user details when open */
  const { data, loading, error } = useFetch(
    () => (userId ? usersAPI.get(userId) : Promise.resolve({ data: null })),
    [userId, open],
  );

  /* Extract user — handle wrapped responses */
  const fetchedUser =
    data?.user ||
    data?.data ||
    (data && typeof data === "object" && !Array.isArray(data) ? data : null);

  useEffect(() => {
    if (fetchedUser) {
      setCurrentUser(fetchedUser);
    }
  }, [fetchedUser]);

  const user = currentUser || fetchedUser;

  const handleToggleStatus = async () => {
    if (!user || actionLoading) return;
    const isCurrentlyActive = isActive(user);
    const newStatus = isCurrentlyActive ? "suspended" : "active";
    try {
      setActionLoading(true);
      setActionError("");
      const res = await usersAPI.update(user.id, { status: newStatus });
      const updated = res.data?.user || { ...user, status: newStatus };
      setCurrentUser(updated);
      onUserUpdated?.(updated);
    } catch (err) {
      setActionError(err.message || "Failed to update user status");
    } finally {
      setActionLoading(false);
    }
  };

  const executeDelete = async () => {
    if (!user || actionLoading) return;
    try {
      setActionLoading(true);
      setActionError("");
      await usersAPI.remove(user.id);
      onUserDeleted?.(user.id);
      onClose();
    } catch (err) {
      setActionError(err.message || "Failed to delete user");
      setActionLoading(false);
    }
  };

  /* ---------- Escape to close ---------- */
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  /* ---------- Body scroll lock ---------- */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  /* ---------- Auto focus close ---------- */
  useEffect(() => {
    if (open) closeBtnRef.current?.focus();
  }, [open]);

  /* ---------- Focus trap ---------- */
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

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-[90] bg-primary/50 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Modal wrapper — centers on desktop, bottom sheet on mobile */}
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 pointer-events-none">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-modal-title"
          onKeyDown={trap}
          className={`relative w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[88vh] pointer-events-auto
            bg-cream sm:rounded-3xl rounded-t-3xl shadow-soft overflow-hidden
            flex flex-col
            transition-all duration-300 ease-out
            ${open ? "opacity-100 translate-y-0 sm:scale-100" : "opacity-0 translate-y-4 sm:scale-95"}`}
        >
          {/* ============ HERO ============ */}
          <div className="relative px-5 pt-5 pb-16 bg-primary sm:px-6 shrink-0">
            {/* Decorative blurs */}
            <div className="absolute w-48 h-48 rounded-full pointer-events-none -top-16 -right-16 bg-gold/25 blur-3xl" />
            <div className="absolute w-48 h-48 rounded-full pointer-events-none -bottom-16 -left-16 bg-mint/15 blur-3xl" />

            {/* Mobile drag handle */}
            <div className="flex justify-center mb-3 sm:hidden">
              <span className="w-10 h-1 rounded-full bg-cream/25" />
            </div>

            {/* Close */}
            <button
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute z-10 grid transition border top-4 right-4 w-9 h-9 rounded-xl bg-cream/10 border-cream/15 place-items-center text-cream hover:bg-cream/20"
            >
              <X size={16} />
            </button>

            {/* Title row */}
            <div className="relative flex items-center gap-2 text-cream/60">
              <UsersIcon size={14} />
              <span className="text-[11px] uppercase tracking-[0.15em] font-medium">
                User profile
              </span>
            </div>

            {/* Avatar + name */}
            <div className="relative flex items-end gap-4 mt-5">
              <div className="relative -mb-8 shrink-0">
                <ModalAvatar user={user} />
                {/* Status dot */}
                <span
                  className={`absolute bottom-2 right-1 w-5 h-5 rounded-full ring-4 ring-primary ${
                    isActive(user) ? "bg-emerald-400" : "bg-primary/40"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* ============ SCROLLABLE BODY ============ */}
          <div className="flex-1 overflow-y-auto">
            {/* Name / email below hero */}
            <div className="px-5 pt-6 pb-5 sm:px-6">
              {loading && !user ? (
                <div className="space-y-3">
                  <div className="w-48 h-6 rounded bg-primary/10 animate-pulse" />
                  <div className="w-64 h-4 rounded bg-primary/5 animate-pulse" />
                </div>
              ) : error ? (
                <div className="flex items-start gap-2 px-4 py-3 text-sm text-red-600 border border-red-200 bg-red-50 rounded-2xl">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              ) : user ? (
                <>
                  <h2
                    id="user-modal-title"
                    className="text-2xl leading-tight font-display sm:text-3xl text-primary"
                  >
                    {user.name || user.fullName || "Unnamed user"}
                  </h2>
                  <p className="text-sm text-primary/60 mt-1.5 inline-flex items-center gap-1.5">
                    <Mail size={13} />
                    {user.email || "—"}
                  </p>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <RoleBadge role={user.role || "user"} />
                    <StatusBadge status={user.status || "active"} />
                    {user.verified && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={10} />
                        Verified
                      </span>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            {user && (
              <>
                {/* ============ TABS ============ */}
                <div className="px-5 sm:px-6">
                  <div className="inline-flex bg-mint/60 rounded-xl p-0.5 w-full sm:w-auto">
                    {[
                      { k: "overview", label: "Overview" },
                      { k: "reading", label: "Reading" },
                      { k: "account", label: "Account" },
                    ].map(({ k, label }) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setTab(k)}
                        className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-medium transition ${
                          tab === k
                            ? "bg-primary text-cream shadow-sm"
                            : "text-primary/60 hover:text-primary"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ============ TAB CONTENT ============ */}
                <div className="px-5 pt-5 pb-5 sm:px-6">
                  {tab === "overview" && <OverviewTab user={user} />}
                  {tab === "reading" && <ReadingTab user={user} />}
                  {tab === "account" && <AccountTab user={user} />}
                </div>
              </>
            )}
          </div>

          {/* ============ STICKY FOOTER ============ */}
          {user && (
            <div className="shrink-0 border-t border-primary/10 bg-cream/95 backdrop-blur-sm px-5 sm:px-6 py-3.5">
              {actionError && (
                <div className="mb-2 p-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg flex items-center gap-1.5">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 text-sm transition text-primary/60 hover:text-primary"
                >
                  Close
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={user.email ? `mailto:${user.email}` : undefined}
                    className="inline-flex items-center gap-2 bg-cream border border-primary/15 text-primary px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-mint transition"
                  >
                    <Send size={14} />
                    Email user
                  </a>
                  <button
                    type="button"
                    onClick={handleToggleStatus}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 bg-gold/90 text-primary px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gold transition shadow-soft disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Ban size={14} />
                    )}
                    {isActive(user) ? "Suspend" : "Activate"}
                  </button>
                  {confirmDelete ? (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl animate-fade-in">
                      <span className="text-xs font-semibold text-red-700">Delete user?</span>
                      <button
                        type="button"
                        onClick={executeDelete}
                        disabled={actionLoading}
                        className="px-2.5 py-1 text-xs font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                      >
                        {actionLoading ? <Loader2 size={12} className="animate-spin" /> : "Confirm"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-900"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1.5 text-red-600 border border-red-200 bg-cream px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium hover:bg-red-50 transition disabled:opacity-50"
                      aria-label="Delete user"
                      title="Delete user"
                    >
                      <Trash2 size={14} />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  )}
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
/*  Modal Avatar (image with initials fallback)                        */
/* ------------------------------------------------------------------ */
function ModalAvatar({ user }) {
  const name = user?.name || user?.fullName || "Unnamed";
  const initial = (name.charAt(0) || "U").toUpperCase();
  const src = resolveAvatarUrl(user);
  const [broken, setBroken] = useState(false);

  /* Reset broken state if src changes (e.g. different user opened) */
  useEffect(() => {
    setBroken(false);
  }, [src]);

  const ringCls = "ring-4 ring-primary ring-offset-4 ring-offset-primary";

  if (src && !broken) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setBroken(true)}
        className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover bg-mint ${ringCls}`}
      />
    );
  }

  return (
    <div
      aria-label={name}
      className={`grid w-20 h-20 text-3xl font-bold sm:w-24 sm:h-24 rounded-3xl bg-gold text-primary place-items-center font-display sm:text-4xl ${ringCls}`}
    >
      {initial}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tabs                                                               */
/* ------------------------------------------------------------------ */
function OverviewTab({ user }) {
  const stats = [
    {
      icon: BookOpen,
      label: "Books read",
      value: pick(user, ["booksRead", "totalBooks", "booksReadCount"]),
      tone: "primary",
    },
    {
      icon: BookMarked,
      label: "Sessions",
      value: pick(user, ["sessions", "readingSessions", "totalSessions"]),
      tone: "gold",
    },
    {
      icon: Clock,
      label: "Hours read",
      value: pick(user, ["hoursRead", "readingHours", "totalHours"]),
      tone: "mint",
      suffix: "h",
    },
    {
      icon: Flame,
      label: "Current streak",
      value: pick(user, ["streak", "readingStreak", "currentStreak"]),
      tone: "gold",
      suffix: "d",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <StatTile key={s.label} {...s} />
        ))}
      </div>

      {/* Recent highlights */}
      <div className="p-4 border bg-white/60 border-primary/10 rounded-2xl">
        <h3 className="inline-flex items-center gap-2 mb-3 text-sm font-semibold text-primary">
          <Award size={14} className="text-gold" />
          Highlights
        </h3>
        <ul className="space-y-2.5 text-sm">
          <HighlightRow
            label="Most read category"
            value={user.mostReadCategory || user.favouriteCategory || "—"}
          />
          <HighlightRow
            label="Favourite book"
            value={user.favouriteBook || user.topBook || "—"}
          />
          <HighlightRow
            label="Last active"
            value={formatDateTime(user.lastActive || user.lastLoginAt) || "—"}
          />
        </ul>
      </div>
    </div>
  );
}

function ReadingTab({ user }) {
  const history = user.readingHistory || user.recentReads || user.history || [];

  if (!history.length) {
    return (
      <div className="py-10 text-center">
        <div className="grid w-12 h-12 mx-auto mb-3 rounded-2xl bg-mint place-items-center">
          <BookOpen size={18} className="text-primary/50" />
        </div>
        <p className="text-sm text-primary/60">No reading history yet.</p>
      </div>
    );
  }

  return (
    <ul className="overflow-hidden border divide-y divide-primary/5 bg-white/60 border-primary/10 rounded-2xl">
      {history.slice(0, 8).map((h, i) => {
        const title = h.title || h.book?.title || h.bookTitle || "Untitled";
        const when =
          h.lastRead || h.readAt || h.completedAt || h.createdAt || h.date;
        const progress =
          typeof h.progress === "number"
            ? Math.min(100, Math.max(0, h.progress))
            : null;

        return (
          <li key={i} className="flex items-center gap-3 px-4 py-3">
            <div className="rounded-md w-9 h-11 bg-primary/80 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-primary">
                {title}
              </p>
              <p className="text-[11px] text-primary/50 mt-0.5">
                {when ? formatDateTime(when) : "—"}
              </p>
              {progress !== null && (
                <div className="mt-1.5 h-1 rounded-full bg-mint overflow-hidden max-w-[140px]">
                  <div
                    className="h-full rounded-full bg-gold"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
            {progress !== null && (
              <span className="text-xs font-medium text-primary/60 shrink-0">
                {progress}%
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function AccountTab({ user }) {
  const rows = [
    { icon: Hash, label: "User ID", value: user._id || user.id },
    { icon: Mail, label: "Email", value: user.email },
    { icon: ShieldCheck, label: "Role", value: user.role || "user" },
    { icon: Activity, label: "Status", value: user.status || "active" },
    {
      icon: Calendar,
      label: "Joined",
      value: formatDateTime(user.createdAt || user.joinedAt),
    },
    {
      icon: Clock,
      label: "Last active",
      value: formatDateTime(user.lastActive || user.lastLoginAt),
    },
  ];

  return (
    <div className="overflow-hidden border bg-white/60 border-primary/10 rounded-2xl">
      <ul className="divide-y divide-primary/5">
        {rows.map(({ icon: Icon, label, value }) => (
          <li key={label} className="flex items-start gap-3 px-4 py-3">
            <span className="w-7 h-7 rounded-lg bg-mint grid place-items-center text-primary shrink-0 mt-0.5">
              <Icon size={13} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-primary/40 font-medium">
                {label}
              </p>
              <p className="text-sm text-primary mt-0.5 break-all">
                {value || "—"}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Small helpers                                                      */
/* ------------------------------------------------------------------ */
function StatTile({ icon: Icon, label, value, tone = "primary", suffix = "" }) {
  const toneCls =
    {
      primary: "bg-mint text-primary",
      gold: "bg-gold/25 text-primary",
      mint: "bg-mint text-primary",
    }[tone] || "bg-mint text-primary";

  const display =
    value === undefined || value === null
      ? "0" + suffix
      : formatNumber(value) + suffix;

  return (
    <div className="bg-white/60 border border-primary/10 rounded-2xl p-3.5">
      <span className={`w-8 h-8 rounded-lg grid place-items-center ${toneCls}`}>
        <Icon size={14} />
      </span>
      <p className="font-display text-xl text-primary mt-2.5 tabular-nums">
        {display}
      </p>
      <p className="text-[10px] uppercase tracking-wider text-primary/40 mt-0.5">
        {label}
      </p>
    </div>
  );
}

function HighlightRow({ label, value }) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="text-primary/60">{label}</span>
      <span className="text-primary font-medium truncate max-w-[55%] text-right">
        {value}
      </span>
    </li>
  );
}

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
  const cls =
    {
      active: "bg-mint text-primary border-primary/10",
      inactive: "bg-primary/5 text-primary/60 border-primary/10",
      suspended: "bg-red-50 text-red-600 border-red-200",
    }[s] || "bg-primary/5 text-primary/60 border-primary/10";

  return (
    <span
      className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full border ${cls}`}
    >
      {status}
    </span>
  );
}

function isActive(user) {
  return String(user?.status || "active").toLowerCase() === "active";
}

function pick(obj, keys) {
  if (!obj) return 0;
  for (const k of keys) {
    const v = obj[k];
    if (v != null && !Number.isNaN(Number(v))) return Number(v);
  }
  return 0;
}
