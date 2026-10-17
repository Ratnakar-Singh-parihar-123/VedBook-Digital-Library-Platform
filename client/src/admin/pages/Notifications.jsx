import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  RefreshCw,
  AlertCircle,
  X,
  BookOpen,
  UserPlus,
  AlertTriangle,
  Info,
  Shield,
  Clock,
  Loader2,
  Plus,
  Trash2,
  Send,
  Sparkles,
  Type,
  MessageSquare,
  User,
  Pencil,
  Mail,
  Calendar,
  Activity,
  Hash,
  Users as UsersIcon,
  Link2,
  Inbox as InboxIcon,
} from "lucide-react";

import Loader from "../../components/ui/Loader";
import { notificationsAPI, usersAPI } from "../../api/adminApi";
import useFetch from "../dashboard/hooks/useFetch";
import {
  formatDateTime,
  formatDate,
  formatNumber,
} from "../dashboard/utils/format";

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */
const FILTERS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "read", label: "Read" },
];

const TYPE_META = {
  user_signup: { icon: UserPlus, tone: "emerald", label: "New User" },
  user: { icon: UserPlus, tone: "emerald", label: "User" },
  new_user: { icon: UserPlus, tone: "emerald", label: "New User" },
  signup: { icon: UserPlus, tone: "emerald", label: "Signup" },
  book_upload: { icon: BookOpen, tone: "primary", label: "Book" },
  book: { icon: BookOpen, tone: "primary", label: "Book" },
  upload: { icon: BookOpen, tone: "primary", label: "Book" },
  report: { icon: AlertTriangle, tone: "gold", label: "Report" },
  warning: { icon: AlertTriangle, tone: "gold", label: "Warning" },
  security: { icon: Shield, tone: "red", label: "Security" },
  system: { icon: Info, tone: "primary", label: "System" },
  info: { icon: Info, tone: "primary", label: "Info" },
  admin_message: { icon: Sparkles, tone: "gold", label: "Message" },
  custom: { icon: Sparkles, tone: "gold", label: "Custom" },
};

const TONE = {
  primary: { iconBg: "bg-mint text-primary", border: "border-primary/10" },
  emerald: {
    iconBg: "bg-emerald-50 text-emerald-600",
    border: "border-emerald-100",
  },
  gold: { iconBg: "bg-gold/25 text-primary", border: "border-gold/40" },
  red: { iconBg: "bg-red-50 text-red-600", border: "border-red-100" },
};

const CREATE_TYPE_OPTIONS = [
  { value: "info", label: "Info", icon: Info },
  { value: "system", label: "System", icon: Info },
  { value: "warning", label: "Warning", icon: AlertTriangle },
  { value: "security", label: "Security", icon: Shield },
  { value: "custom", label: "Custom", icon: Sparkles },
];

/* ------------------------------------------------------------------ */
/*  Detection helpers                                                  */
/* ------------------------------------------------------------------ */
function isUserNotification(n) {
  if (!n) return false;
  const t = String(n.type || "").toLowerCase();
  const title = String(n.title || "").toLowerCase();
  const msg = String(n.message || "").toLowerCase();

  const typeHit =
    t.includes("user") ||
    t.includes("signup") ||
    t.includes("sign_up") ||
    t.includes("sign-up") ||
    t.includes("register") ||
    t === "new_user";

  const textHit =
    title.includes("new user") ||
    title.includes("signed up") ||
    title.includes("registered") ||
    msg.includes("new user") ||
    msg.includes("signed up") ||
    msg.includes("registered");

  return typeHit || textHit;
}

function extractUserId(n) {
  if (!n) return null;

  const direct =
    n.userId ||
    n.user_id ||
    n.user?.id ||
    n.user?._id ||
    n.details?.userId ||
    n.details?.user_id ||
    n.details?.user?.id ||
    n.metadata?.userId ||
    n.metadata?.user_id ||
    n.target?.id ||
    null;
  if (direct) return direct;

  if (n.recipient_type === "user" || n.recipientType === "user") {
    return n.recipient_id || n.recipientId || null;
  }

  const link = n.link || n.url || n.actionUrl;
  if (link) {
    const m = String(link).match(/\/users?\/(\d+)/i);
    if (m) return m[1];
  }

  const msg = String(n.message || "");
  const msgMatch = msg.match(/(?:user|id)\s*[:#]?\s*(\d+)/i);
  if (msgMatch) return msgMatch[1];

  return null;
}

/* ------------------------------------------------------------------ */
/*  Reusable Modal Shell — smooth + responsive                         */
/* ------------------------------------------------------------------ */
function ModalShell({ open, onClose, children, ariaLabel, closeDisabled }) {
  useEffect(() => {
    if (!open || closeDisabled) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closeDisabled, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const [mounted, setMounted] = useState(open);
  useEffect(() => {
    if (open) setMounted(true);
    else {
      const t = setTimeout(() => setMounted(false), 260);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!mounted) return null;

  return (
    <>
      <div
        aria-hidden="true"
        onClick={closeDisabled ? undefined : onClose}
        className={`fixed inset-0 z-[110] bg-primary/60 backdrop-blur-sm transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center sm:p-6 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
          className={`relative w-full sm:max-w-lg pointer-events-auto flex flex-col
            h-[100dvh] sm:h-auto sm:max-h-[88vh]
            bg-cream sm:rounded-3xl rounded-t-3xl shadow-soft overflow-hidden
            transition-all duration-300 ease-out will-change-transform
            ${
              open
                ? "opacity-100 translate-y-0 sm:scale-100"
                : "opacity-0 translate-y-6 sm:translate-y-0 sm:scale-95"
            }`}
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          {children}
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function Notifications() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [filter, setFilter] = useState("all");
  const [workingId, setWorkingId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [userDetailId, setUserDetailId] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const { data, loading, error, reload } = useFetch(
    () => notificationsAPI.list(),
    [refreshKey],
  );

  /* Extract */
  const rawList = useMemo(() => {
    const raw = data || {};
    return (
      (Array.isArray(raw.data) && raw.data) ||
      (Array.isArray(raw.notifications) && raw.notifications) ||
      (Array.isArray(raw.results) && raw.results) ||
      (Array.isArray(raw) && raw) ||
      []
    );
  }, [data]);

  const serverUnread = data?.unreadCount ?? null;

  /* Normalise */
  const notifications = useMemo(() => {
    return rawList.map((n) => ({
      id: n.id || n._id,
      title: n.title || n.subject || "Notification",
      message: n.message || n.body || n.description || "",
      type: String(n.type || n.category || "system").toLowerCase(),
      isRead:
        typeof n.is_read === "boolean"
          ? n.is_read
          : typeof n.isRead === "boolean"
            ? n.isRead
            : typeof n.read === "boolean"
              ? n.read
              : Boolean(n.readAt),
      link: n.link || n.url || n.actionUrl || null,
      createdAt: n.created_at || n.createdAt || n.timestamp || n.date,
      recipientType: n.recipient_type || n.recipientType || null,
      recipientId: n.recipient_id || n.recipientId || null,
      senderAdminId: n.sender_admin_id || n.senderAdminId || null,
      /* Admin-created notification → editable/deletable */
      isCustom:
        n.is_custom === true ||
        n.isCustom === true ||
        n.type === "custom" ||
        n.type === "admin_message" ||
        n.sender_admin_id != null ||
        n.senderAdminId != null ||
        n.created_by != null ||
        n.createdBy != null,
    }));
  }, [rawList]);

  const unreadCount = useMemo(() => {
    if (serverUnread != null) return serverUnread;
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications, serverUnread]);

  const filtered = useMemo(() => {
    if (filter === "unread") return notifications.filter((n) => !n.isRead);
    if (filter === "read") return notifications.filter((n) => n.isRead);
    return notifications;
  }, [notifications, filter]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  /* Handlers */
  const markRead = async (n) => {
    if (n.isRead || workingId) return;
    setWorkingId(n.id);
    try {
      await notificationsAPI.markRead(n.id);
      reload();
    } catch {
      /* ignore */
    } finally {
      setWorkingId(null);
    }
  };

  const handleClick = async (n) => {
    if (!n.isRead) await markRead(n);

    const userId = extractUserId(n);
    const isUser = isUserNotification(n);

    if (isUser || userId) {
      setSelectedNotification(n);
      setUserDetailId(userId || "unknown");
    }
  };

  const handleMarkAll = async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await notificationsAPI.markAllRead();
      reload();
    } catch {
      /* ignore */
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (n, e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (deletingId) return;
    setDeletingId(n.id);
    try {
      await notificationsAPI.remove(n.id);
      reload();
    } catch {
      /* ignore */
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (n, e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setEditing(n);
    setCreateOpen(true);
  };

  const handleCreateSuccess = () => {
    setCreateOpen(false);
    setEditing(null);
    reload();
  };

  return (
    <div className="max-w-3xl px-4 py-6 mx-auto sm:px-6 lg:px-8 sm:py-8">
      {/* ================= HEADER ================= */}
      <header className="flex flex-col gap-4 mb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="relative grid w-10 h-10 rounded-2xl bg-mint place-items-center text-primary shrink-0">
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-gold text-primary text-[10px] font-bold grid place-items-center ring-2 ring-cream tabular-nums">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl tracking-tight font-display sm:text-3xl text-primary">
              Notifications
            </h1>
            <p className="text-sm truncate text-primary/60">
              {unreadCount > 0
                ? `${unreadCount} unread ${unreadCount === 1 ? "notification" : "notifications"}`
                : "You're all caught up"}
            </p>
          </div>
        </div>

        <div className="flex items-center w-full gap-2 sm:w-auto">
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setCreateOpen(true);
            }}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-primary text-cream px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium hover:bg-primary/90 transition shadow-soft"
          >
            <Plus size={14} /> New
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAll}
              disabled={markingAll}
              aria-label="Mark all as read"
              className="shrink-0 inline-flex items-center justify-center gap-2 bg-cream border border-primary/10 text-primary px-3.5 py-2.5 rounded-xl text-sm font-medium hover:bg-mint disabled:opacity-60 transition shadow-soft"
            >
              {markingAll ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CheckCheck size={14} />
              )}
              <span className="hidden sm:inline">Mark all</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={loading}
            aria-label="Refresh"
            className="shrink-0 inline-flex items-center justify-center gap-2 bg-cream border border-primary/10 text-primary px-3.5 py-2.5 rounded-xl text-sm font-medium hover:bg-mint disabled:opacity-60 transition shadow-soft"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      {/* ================= TABS ================= */}
      <div className="grid grid-cols-2 gap-1 p-1 mb-5 border bg-mint/40 border-primary/10 rounded-2xl">
        <div className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-primary text-cream shadow-soft">
          <InboxIcon size={14} />
          Inbox
          {unreadCount > 0 && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-cream/20 text-cream tabular-nums">
              {unreadCount}
            </span>
          )}
        </div>
        <Link
          to="/admin/notifications/sent"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-primary/70 hover:bg-mint transition"
        >
          <Send size={14} /> Sent
        </Link>
      </div>

      {/* ================= ERROR ================= */}
      {error && (
        <div className="flex items-start gap-2 px-4 py-3 mb-5 text-sm text-red-600 border border-red-200 bg-red-50 rounded-2xl">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium">Couldn't load notifications</p>
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

      {/* ================= FILTERS ================= */}
      <div className="flex items-center gap-2 px-1 pb-1 mb-5 -mx-1 overflow-x-auto no-scrollbar">
        {FILTERS.map((f) => {
          const on = filter === f.key;
          const count =
            f.key === "unread"
              ? unreadCount
              : f.key === "read"
                ? notifications.length - unreadCount
                : notifications.length;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition ${
                on
                  ? "bg-primary text-cream shadow-soft"
                  : "bg-white border border-primary/10 text-primary/70 hover:bg-mint hover:text-primary"
              }`}
            >
              {f.label}
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

      {/* ================= CONTENT ================= */}
      {loading ? (
        <div className="py-20 border bg-cream border-primary/10 rounded-2xl">
          <Loader center size={32} label="Loading notifications" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          filter={filter}
          onCreate={() => {
            setEditing(null);
            setCreateOpen(true);
          }}
        />
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <section key={group.date}>
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary/60 bg-mint/60 px-3 py-1.5 rounded-full">
                  <Clock size={11} />
                  {group.label}
                </span>
                <span className="text-[11px] text-primary/40">
                  {group.items.length}
                </span>
                <span className="flex-1 h-px bg-primary/10" />
              </div>

              <div className="overflow-hidden border bg-cream border-primary/10 rounded-2xl shadow-soft">
                <ul className="divide-y divide-primary/5">
                  {group.items.map((n) => (
                    <NotificationRow
                      key={n.id}
                      notification={n}
                      working={workingId === n.id}
                      deleting={deletingId === n.id}
                      onClick={() => handleClick(n)}
                      onEdit={(e) => handleEdit(n, e)}
                      onDelete={(e) => handleDelete(n, e)}
                    />
                  ))}
                </ul>
              </div>
            </section>
          ))}
        </div>
      )}

      {/* ================= MODALS ================= */}
      <NotificationFormModal
        open={createOpen}
        editing={editing}
        onClose={() => {
          setCreateOpen(false);
          setEditing(null);
        }}
        onSuccess={handleCreateSuccess}
      />

      <UserDetailModal
        userId={userDetailId}
        notification={selectedNotification}
        onClose={() => {
          setUserDetailId(null);
          setSelectedNotification(null);
        }}
      />

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Notification Row                                                   */
/*  Edit/Delete buttons ONLY for admin-created (custom) notifications  */
/* ------------------------------------------------------------------ */
function NotificationRow({
  notification,
  working,
  deleting,
  onClick,
  onEdit,
  onDelete,
}) {
  const meta = TYPE_META[notification.type] || TYPE_META.system;
  const tone = TONE[meta.tone] || TONE.primary;
  const Icon = meta.icon;
  const unread = !notification.isRead;

  return (
    <li>
      <div
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
        className={`group relative block px-4 py-4 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-inset ${
          unread ? "bg-mint/20 hover:bg-mint/40" : "hover:bg-mint/20"
        }`}
      >
        <div className="flex items-start gap-3">
          <span
            className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${tone.iconBg}`}
          >
            <Icon size={17} />
          </span>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p
                    className={`text-sm truncate ${unread ? "font-semibold text-primary" : "font-medium text-primary/80"}`}
                  >
                    {notification.title}
                  </p>
                  {unread && (
                    <span className="w-2 h-2 rounded-full bg-gold shrink-0" />
                  )}
                  {notification.isCustom && (
                    <span className="text-[9.5px] font-semibold uppercase tracking-wider bg-gold/20 text-primary px-1.5 py-0.5 rounded">
                      Custom
                    </span>
                  )}
                </div>
                {notification.message && (
                  <p className="mt-1 text-xs leading-relaxed text-primary/60 line-clamp-2">
                    {notification.message}
                  </p>
                )}
              </div>

              <time
                className="text-[11px] text-primary/40 whitespace-nowrap shrink-0 pt-0.5"
                title={formatDateTime(notification.createdAt)}
              >
                {relativeTime(notification.createdAt)}
              </time>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border text-primary/60 ${tone.border}`}
              >
                {meta.label}
              </span>

              {!unread && (
                <span className="inline-flex items-center gap-1 text-[10px] text-primary/40">
                  <Check size={10} /> Read
                </span>
              )}

              {working && (
                <span className="inline-flex items-center gap-1.5 text-[10.5px] text-primary/50">
                  <Loader2 size={10} className="animate-spin" /> Marking…
                </span>
              )}

              {/* Edit / Delete — only for admin-created notifications */}
              {notification.isCustom && (
                <div
                  className="flex items-center gap-1 ml-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={onEdit}
                    aria-label="Edit notification"
                    title="Edit"
                    className="grid transition rounded-lg opacity-0 w-7 h-7 place-items-center text-primary/30 hover:bg-mint hover:text-primary group-hover:opacity-100 focus:opacity-100"
                  >
                    <Pencil size={12} />
                  </button>

                  <button
                    type="button"
                    onClick={onDelete}
                    disabled={deleting}
                    aria-label="Delete notification"
                    title="Delete"
                    className="grid transition rounded-lg opacity-0 w-7 h-7 place-items-center text-primary/30 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50"
                  >
                    {deleting ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Trash2 size={12} />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty state                                                        */
/* ------------------------------------------------------------------ */
function EmptyState({ filter, onCreate }) {
  const config = {
    unread: {
      icon: CheckCheck,
      title: "You're all caught up",
      desc: "No unread notifications right now.",
    },
    read: {
      icon: BellOff,
      title: "No read notifications",
      desc: "Notifications you've read will appear here.",
    },
    all: {
      icon: Bell,
      title: "No notifications yet",
      desc: "You'll see updates about books, users, and reports here.",
    },
  }[filter] || {
    icon: Bell,
    title: "No notifications",
    desc: "Nothing to show here yet.",
  };

  const Icon = config.icon;

  return (
    <div className="px-6 py-16 text-center border bg-cream border-primary/10 rounded-2xl">
      <div className="grid mx-auto mb-4 w-14 h-14 rounded-2xl bg-mint place-items-center">
        <Icon size={22} className="text-primary/50" />
      </div>
      <h3 className="text-lg font-display text-primary">{config.title}</h3>
      <p className="max-w-sm mx-auto mt-1 text-sm text-primary/50">
        {config.desc}
      </p>

      {filter === "all" && (
        <button
          type="button"
          onClick={onCreate}
          className="mt-5 inline-flex items-center gap-2 bg-primary text-cream px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition shadow-soft"
        >
          <Plus size={14} /> Create notification
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Create / Edit Modal                                               */
/* ------------------------------------------------------------------ */
function NotificationFormModal({ open, editing, onClose, onSuccess }) {
  const isEdit = Boolean(editing);

  const [form, setForm] = useState({
    title: "",
    message: "",
    type: "info",
    recipientType: "all",
    userId: "",
    link: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (isEdit) {
      setForm({
        title: editing.title || "",
        message: editing.message || "",
        type: editing.type || "info",
        recipientType: editing.recipientType || "all",
        userId: editing.recipientId ? String(editing.recipientId) : "",
        link: editing.link || "",
      });
    } else {
      setForm({
        title: "",
        message: "",
        type: "info",
        recipientType: "all",
        userId: "",
        link: "",
      });
    }
    setError("");
    setSaving(false);
  }, [open, editing, isEdit]);

  const update = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (form.title.trim().length > 200) {
      setError("Title must be under 200 characters.");
      return;
    }
    if (!form.message.trim()) {
      setError("Message is required.");
      return;
    }

    if (!isEdit && form.recipientType === "user") {
      const id = Number(form.userId);
      if (!Number.isSafeInteger(id) || id <= 0) {
        setError("A valid user ID is required.");
        return;
      }
    }

    setSaving(true);
    try {
      if (isEdit) {
        await notificationsAPI.update(editing.id, {
          title: form.title.trim(),
          message: form.message.trim(),
          link: form.link.trim() || null,
        });
      } else {
        await notificationsAPI.create({
          title: form.title.trim(),
          message: form.message.trim(),
          type: form.type || "info",
          recipientType: form.recipientType,
          userId:
            form.recipientType === "user" ? Number(form.userId) : undefined,
          link: form.link.trim() || null,
        });
      }
      onSuccess?.();
    } catch (err) {
      setError(
        err?.message ||
          (isEdit
            ? "Could not update notification."
            : "Could not create notification."),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      ariaLabel={isEdit ? "Edit notification" : "New notification"}
      closeDisabled={saving}
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        <header className="relative px-4 pt-4 pb-4 shrink-0 bg-primary sm:px-6 sm:pt-5 sm:pb-5">
          <div className="absolute w-40 h-40 rounded-full pointer-events-none -top-12 -right-12 bg-gold/25 blur-3xl" />

          <div className="flex justify-center mb-2 sm:hidden">
            <span className="w-10 h-1 rounded-full bg-cream/25" />
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 w-9 h-9 rounded-xl bg-cream/10 border border-cream/15 grid place-items-center text-cream hover:bg-cream/20 transition disabled:opacity-50 z-10"
          >
            <X size={16} />
          </button>

          <div className="relative flex items-center gap-3">
            <span className="grid w-10 h-10 border sm:w-11 sm:h-11 rounded-2xl bg-cream/10 border-cream/15 place-items-center text-gold shrink-0">
              {isEdit ? <Pencil size={17} /> : <Sparkles size={17} />}
            </span>
            <div className="min-w-0">
              <h2 className="text-lg leading-tight font-display sm:text-xl text-cream">
                {isEdit ? "Edit notification" : "New notification"}
              </h2>
              <p className="text-cream/60 text-[11px] sm:text-xs mt-0.5">
                {isEdit
                  ? "Update title, message or link"
                  : "Send to all users or a specific user"}
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <div className="p-4 space-y-4 sm:p-6 sm:space-y-5">
            <div>
              <label className="text-xs font-medium text-primary/70 mb-1.5 block">
                Title <span className="text-gold">*</span>
              </label>
              <div className="flex items-center gap-2.5 bg-white/70 border border-primary/10 rounded-2xl px-3.5 sm:px-4 focus-within:ring-2 focus-within:ring-gold/40 focus-within:border-gold/40 transition">
                <Type size={15} className="text-primary/40 shrink-0" />
                <input
                  type="text"
                  value={form.title}
                  onChange={update("title")}
                  placeholder="e.g. Server maintenance tonight"
                  maxLength={200}
                  className="w-full bg-transparent outline-none text-sm text-primary placeholder:text-primary/40 py-3 sm:py-3.5"
                />
              </div>
              <p className="text-[10.5px] text-primary/40 mt-1.5 text-right tabular-nums">
                {form.title.length}/200
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-primary/70 mb-1.5 block">
                Message <span className="text-gold">*</span>
              </label>
              <div className="flex items-start gap-2.5 bg-white/70 border border-primary/10 rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 focus-within:ring-2 focus-within:ring-gold/40 focus-within:border-gold/40 transition">
                <MessageSquare
                  size={15}
                  className="mt-1 text-primary/40 shrink-0"
                />
                <textarea
                  value={form.message}
                  onChange={update("message")}
                  placeholder="Write the notification message…"
                  rows={3}
                  className="w-full text-sm leading-relaxed bg-transparent outline-none resize-none text-primary placeholder:text-primary/40"
                />
              </div>
            </div>

            {!isEdit && (
              <div>
                <label className="block mb-2 text-xs font-medium text-primary/70">
                  Send to
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "all", label: "All users", icon: UsersIcon },
                    { value: "user", label: "One user", icon: User },
                  ].map((opt) => {
                    const Icon = opt.icon;
                    const on = form.recipientType === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            recipientType: opt.value,
                            userId: opt.value === "all" ? "" : f.userId,
                          }))
                        }
                        className={`inline-flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs font-medium transition border ${
                          on
                            ? "bg-primary text-cream border-primary shadow-soft"
                            : "bg-white/70 border-primary/10 text-primary/70 hover:bg-mint"
                        }`}
                      >
                        <Icon size={14} />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

                {form.recipientType === "user" && (
                  <div className="mt-3">
                    <label className="text-xs font-medium text-primary/70 mb-1.5 block">
                      User ID <span className="text-gold">*</span>
                    </label>
                    <div className="flex items-center gap-2.5 bg-white/70 border border-primary/10 rounded-2xl px-3.5 sm:px-4 focus-within:ring-2 focus-within:ring-gold/40 focus-within:border-gold/40 transition">
                      <Hash size={15} className="text-primary/40 shrink-0" />
                      <input
                        type="number"
                        value={form.userId}
                        onChange={update("userId")}
                        placeholder="e.g. 42"
                        min={1}
                        className="w-full bg-transparent outline-none text-sm text-primary placeholder:text-primary/40 py-3 sm:py-3.5"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {!isEdit && (
              <div>
                <label className="block mb-2 text-xs font-medium text-primary/70">
                  Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {CREATE_TYPE_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const on = form.type === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          setForm((f) => ({ ...f, type: opt.value }))
                        }
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition border ${
                          on
                            ? "bg-primary text-cream border-primary shadow-soft"
                            : "bg-white/70 border-primary/10 text-primary/70 hover:bg-mint"
                        }`}
                      >
                        <Icon size={13} />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-primary/70 mb-1.5 block">
                Link{" "}
                <span className="font-normal text-primary/40">(optional)</span>
              </label>
              <div className="flex items-center gap-2.5 bg-white/70 border border-primary/10 rounded-2xl px-3.5 sm:px-4 focus-within:ring-2 focus-within:ring-gold/40 focus-within:border-gold/40 transition">
                <Link2 size={15} className="text-primary/40 shrink-0" />
                <input
                  type="text"
                  value={form.link}
                  onChange={update("link")}
                  placeholder="/admin/books or https://…"
                  maxLength={500}
                  className="w-full bg-transparent outline-none text-sm text-primary placeholder:text-primary/40 py-3 sm:py-3.5"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-3 py-2.5">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        <footer className="shrink-0 border-t border-primary/10 bg-cream px-4 sm:px-6 py-3.5 sm:py-4">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="inline-flex items-center justify-center w-full gap-2 px-5 py-3 text-sm font-medium transition border sm:w-auto bg-cream border-primary/15 text-primary rounded-2xl hover:bg-mint disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary text-cream px-5 py-3 rounded-2xl text-sm font-medium hover:bg-primary/90 active:scale-[0.98] transition shadow-soft disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  {isEdit ? "Saving…" : "Sending…"}
                </>
              ) : (
                <>
                  <Send size={14} />
                  {isEdit ? "Save changes" : "Send notification"}
                </>
              )}
            </button>
          </div>
        </footer>
      </form>
    </ModalShell>
  );
}

/* ------------------------------------------------------------------ */
/*  User Detail Modal                                                 */
/* ------------------------------------------------------------------ */
function UserDetailModal({ userId, notification, onClose }) {
  const open = Boolean(userId);
  const isRealId =
    userId && userId !== "unknown" && String(userId).match(/^\d+$/);

  const { data, loading, error } = useFetch(
    () => (isRealId ? usersAPI.get(userId) : Promise.resolve({ data: null })),
    [userId],
  );

  const user =
    data?.user ||
    data?.data ||
    (data && typeof data === "object" && !Array.isArray(data) ? data : null);

  const name = user?.name || user?.fullName || "User";
  const email = user?.email || "—";
  const initial = (name.charAt(0) || "U").toUpperCase();
  const role = user?.role || "user";
  const status = String(user?.status || "active").toLowerCase();

  const statusTone =
    status === "active"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : status === "suspended"
        ? "bg-red-50 text-red-600 border-red-200"
        : "bg-primary/5 text-primary/60 border-primary/10";

  const showFallback = !isRealId;

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      ariaLabel={showFallback ? "Notification details" : "User details"}
    >
      <div className="flex flex-col h-full">
        <header className="relative px-4 pt-4 shrink-0 bg-primary sm:px-6 pb-14 sm:pt-5 sm:pb-16">
          <div className="absolute w-48 h-48 rounded-full pointer-events-none -top-16 -right-16 bg-gold/25 blur-3xl" />
          <div className="absolute w-40 h-40 rounded-full pointer-events-none -bottom-12 -left-12 bg-mint/15 blur-3xl" />

          <div className="flex justify-center mb-2 sm:hidden">
            <span className="w-10 h-1 rounded-full bg-cream/25" />
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 w-9 h-9 rounded-xl bg-cream/10 border border-cream/15 grid place-items-center text-cream hover:bg-cream/20 transition z-10"
          >
            <X size={16} />
          </button>

          <div className="relative flex items-center gap-2 text-cream/60">
            <User size={14} />
            <span className="text-[11px] uppercase tracking-[0.15em] font-medium">
              {showFallback ? "Notification" : "User details"}
            </span>
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          {showFallback ? (
            <div className="px-4 pt-6 pb-5 space-y-4 sm:px-6">
              <div className="flex items-start gap-2.5 bg-gold/15 border border-gold/40 rounded-2xl px-3.5 py-3">
                <AlertCircle
                  size={15}
                  className="text-primary/70 shrink-0 mt-0.5"
                />
                <p className="text-xs leading-relaxed text-primary/80">
                  User ID not found in this notification. Here's what we know:
                </p>
              </div>

              {notification && (
                <div className="overflow-hidden border bg-white/60 border-primary/10 rounded-2xl">
                  <ul className="divide-y divide-primary/5">
                    <DetailRow
                      icon={Bell}
                      label="Title"
                      value={notification.title}
                    />
                    {notification.message && (
                      <DetailRow
                        icon={MessageSquare}
                        label="Message"
                        value={notification.message}
                      />
                    )}
                    <DetailRow
                      icon={Info}
                      label="Type"
                      value={notification.type}
                    />
                    <DetailRow
                      icon={Clock}
                      label="Received"
                      value={formatDateTime(notification.createdAt)}
                    />
                  </ul>
                </div>
              )}

              <details className="text-[10px] text-primary/40">
                <summary className="cursor-pointer hover:text-primary/60">
                  Show raw data
                </summary>
                <pre className="p-2 mt-2 overflow-auto rounded-lg bg-primary/5 max-h-40">
                  {JSON.stringify(notification, null, 2)}
                </pre>
              </details>
            </div>
          ) : (
            <>
              <div className="relative px-4 -mt-10 sm:px-6 sm:-mt-12">
                <div className="flex items-end gap-4">
                  <div className="relative shrink-0">
                    <div className="grid w-20 h-20 text-3xl font-bold sm:w-24 sm:h-24 rounded-3xl bg-gold text-primary place-items-center font-display sm:text-4xl ring-4 ring-cream">
                      {loading ? (
                        <Loader2
                          size={24}
                          className="animate-spin text-primary/60"
                        />
                      ) : (
                        initial
                      )}
                    </div>
                    {!loading && !error && (
                      <span
                        className={`absolute bottom-1 right-1 w-5 h-5 rounded-full ring-4 ring-cream ${
                          status === "active"
                            ? "bg-emerald-400"
                            : status === "suspended"
                              ? "bg-red-400"
                              : "bg-primary/40"
                        }`}
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="px-4 pt-5 pb-4 sm:px-6">
                {loading ? (
                  <div className="space-y-2">
                    <div className="w-40 h-6 rounded bg-primary/10 animate-pulse" />
                    <div className="w-56 h-4 rounded bg-primary/5 animate-pulse" />
                  </div>
                ) : error ? (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-3 py-2.5">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                ) : user ? (
                  <>
                    <h2 className="text-xl leading-tight font-display sm:text-2xl text-primary">
                      {name}
                    </h2>
                    <p className="text-sm text-primary/60 mt-1 inline-flex items-center gap-1.5">
                      <Mail size={13} />
                      {email}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full border ${
                          role === "admin"
                            ? "bg-gold/20 text-primary border-gold/40"
                            : "bg-mint text-primary border-primary/10"
                        }`}
                      >
                        {role === "admin" ? (
                          <Shield size={10} />
                        ) : (
                          <UsersIcon size={10} />
                        )}
                        {role}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full border ${statusTone}`}
                      >
                        {status}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-primary/60">
                    User details not available.
                  </p>
                )}
              </div>

              {user && !loading && (
                <div className="px-4 pb-5 sm:px-6">
                  <div className="overflow-hidden border bg-white/60 border-primary/10 rounded-2xl">
                    <ul className="divide-y divide-primary/5">
                      <DetailRow
                        icon={Hash}
                        label="User ID"
                        value={user.id || user._id}
                      />
                      <DetailRow icon={User} label="Name" value={name} />
                      <DetailRow icon={Mail} label="Email" value={email} />
                      <DetailRow icon={Shield} label="Role" value={role} />
                      <DetailRow
                        icon={Activity}
                        label="Status"
                        value={status}
                      />
                      <DetailRow
                        icon={Calendar}
                        label="Joined"
                        value={formatDate(
                          user.created_at || user.createdAt || user.joinedAt,
                        )}
                      />
                      {(user.last_login_at || user.lastLoginAt) && (
                        <DetailRow
                          icon={Clock}
                          label="Last active"
                          value={formatDateTime(
                            user.last_login_at || user.lastLoginAt,
                          )}
                        />
                      )}
                      {user.books_read != null && (
                        <DetailRow
                          icon={BookOpen}
                          label="Books read"
                          value={formatNumber(
                            user.books_read || user.booksRead,
                          )}
                        />
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <footer className="shrink-0 border-t border-primary/10 bg-cream px-4 sm:px-6 py-3.5 sm:py-4">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center w-full gap-2 px-5 py-3 text-sm font-medium transition border sm:w-auto bg-cream border-primary/15 text-primary rounded-2xl hover:bg-mint"
            >
              Close
            </button>
            {isRealId && (
              <Link
                to="/admin/users"
                className="inline-flex items-center justify-center w-full gap-2 px-5 py-3 text-sm font-medium transition sm:w-auto bg-primary text-cream rounded-2xl hover:bg-primary/90 shadow-soft"
              >
                <UsersIcon size={14} />
                View in Users
              </Link>
            )}
          </div>
        </footer>
      </div>
    </ModalShell>
  );
}

function DetailRow({ icon: Icon, label, value }) {
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

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function groupByDate(items) {
  const map = new Map();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  for (const n of items) {
    const dt = n.createdAt ? new Date(n.createdAt) : null;
    let key = "unknown";
    let label = "Earlier";

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
    map.get(key).items.push(n);
  }
  return Array.from(map.values());
}

function relativeTime(dateStr) {
  if (!dateStr) return "—";
  const dt = new Date(dateStr);
  if (isNaN(dt.getTime())) return "—";

  const diffMs = Date.now() - dt.getTime();
  const sec = Math.floor(diffMs / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);

  if (sec < 60) return "just now";
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day < 7) return `${day}d ago`;
  return dt.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}
