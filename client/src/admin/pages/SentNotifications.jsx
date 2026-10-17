import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Send,
  RefreshCw,
  AlertCircle,
  X,
  Loader2,
  Users,
  User,
  MessageSquare,
  CheckCheck,
  Link2,
  Calendar,
  Hash,
  Check,
  Circle,
  BarChart3,
  Search,
  Inbox as InboxIcon,
  ChevronRight,
  Pencil,
  Trash2,
  Type,
  AlertTriangle,
} from "lucide-react";

import Loader from "../../components/ui/Loader";
import { notificationsAPI } from "../../api/adminApi";
import useFetch from "../dashboard/hooks/useFetch";
import { formatDateTime, formatNumber } from "../dashboard/utils/format";

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function SentNotifications() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [workingId, setWorkingId] = useState(null);
  const [toast, setToast] = useState(null);

  const { data, loading, error, reload } = useFetch(
    () => notificationsAPI.listSent(),
    [refreshKey],
  );

  /* Auto-dismiss toast */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

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

  /* Normalise */
  const notifications = useMemo(() => {
    return rawList.map((n) => ({
      id: n.id || n.broadcast_id || n._id,
      title: n.title || "Untitled",
      message: n.message || "",
      link: n.link || null,
      recipientType: n.recipient_type || n.recipientType || "all",
      totalRecipients: Number(
        n.total_recipients ?? n.totalRecipients ?? n.recipientCount ?? 0,
      ),
      readCount: Number(n.read_count ?? n.readCount ?? 0),
      createdAt: n.created_at || n.createdAt || n.sent_at,
    }));
  }, [rawList]);

  /* Filter */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return notifications;
    return notifications.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q),
    );
  }, [notifications, search]);

  /* Handlers */
  const handleEditClick = (n, e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setEditing(n);
  };

  const handleDeleteClick = (n, e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setDeleting(n);
  };

  const handleDeleteConfirm = async () => {
    if (!deleting || workingId) return;
    const target = deleting;
    setWorkingId(target.id);

    try {
      await notificationsAPI.remove(target.id);
      setToast({ type: "success", text: "Notification deleted" });
      setDeleting(null);
      setSelectedId(null);
      reload();
    } catch (err) {
      setToast({
        type: "error",
        text: err?.message || "Could not delete notification",
      });
    } finally {
      setWorkingId(null);
    }
  };

  const handleEditSuccess = () => {
    setEditing(null);
    setToast({ type: "success", text: "Notification updated" });
    reload();
  };

  return (
    <div className="max-w-3xl px-4 py-6 mx-auto sm:px-6 lg:px-8 sm:py-8">
      {/* ================= TOAST ================= */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[150] flex items-center gap-2 px-4 py-3 rounded-2xl shadow-soft transition-all duration-300 ${
            toast.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
              : "bg-red-50 border border-red-200 text-red-600"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCheck size={15} className="shrink-0" />
          ) : (
            <AlertCircle size={15} className="shrink-0" />
          )}
          <span className="text-xs font-medium">{toast.text}</span>
        </div>
      )}

      {/* ================= HEADER ================= */}
      <header className="flex flex-col gap-4 mb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="grid w-10 h-10 rounded-2xl bg-gold/25 place-items-center text-primary shrink-0">
            <Send size={18} />
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl tracking-tight font-display sm:text-3xl text-primary">
              Sent Notifications
            </h1>
            <p className="text-sm truncate text-primary/60">
              {notifications.length > 0
                ? `${notifications.length} ${notifications.length === 1 ? "notification" : "notifications"} sent`
                : "Track what you've sent to users"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setRefreshKey((k) => k + 1)}
          disabled={loading}
          aria-label="Refresh"
          className="self-start sm:self-auto inline-flex items-center justify-center gap-2 bg-cream border border-primary/10 text-primary px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-mint disabled:opacity-60 transition shadow-soft"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </header>

      {/* ================= TABS ================= */}
      <div className="grid grid-cols-2 gap-1 p-1 mb-5 border bg-mint/40 border-primary/10 rounded-2xl">
        <Link
          to="/admin/notifications"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-primary/70 hover:bg-mint transition"
        >
          <InboxIcon size={14} />
          Inbox
        </Link>
        <div className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-primary text-cream shadow-soft">
          <Send size={14} />
          Sent
        </div>
      </div>

      {/* ================= ERROR ================= */}
      {error && (
        <div className="flex items-start gap-2 px-4 py-3 mb-5 text-sm text-red-600 border border-red-200 bg-red-50 rounded-2xl">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium">Couldn't load sent notifications</p>
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

      {/* ================= SEARCH ================= */}
      {!loading && notifications.length > 0 && (
        <div className="mb-5 flex items-center gap-2.5 bg-white/70 border border-primary/10 rounded-xl px-3.5 focus-within:ring-2 focus-within:ring-gold/40 focus-within:border-gold/40 transition">
          <Search size={15} className="text-primary/40 shrink-0" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or message…"
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
      )}

      {/* ================= CONTENT ================= */}
      {loading ? (
        <div className="py-20 border bg-cream border-primary/10 rounded-2xl">
          <Loader center size={32} label="Loading sent notifications" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState hasSearch={search.trim().length > 0} />
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => (
            <SentCard
              key={n.id}
              notification={n}
              onClick={() => setSelectedId(n.id)}
              onEdit={(e) => handleEditClick(n, e)}
              onDelete={(e) => handleDeleteClick(n, e)}
            />
          ))}
        </div>
      )}

      {/* ================= DETAIL MODAL ================= */}
      <SentDetailModal
        notificationId={selectedId}
        onClose={() => setSelectedId(null)}
        onEdit={(n) => {
          setSelectedId(null);
          setEditing(n);
        }}
        onDelete={(n) => {
          setSelectedId(null);
          setDeleting(n);
        }}
      />

      {/* ================= EDIT MODAL ================= */}
      <EditSentModal
        open={Boolean(editing)}
        notification={editing}
        onClose={() => setEditing(null)}
        onSuccess={handleEditSuccess}
      />

      {/* ================= DELETE DIALOG ================= */}
      <DeleteDialog
        open={Boolean(deleting)}
        notification={deleting}
        working={workingId === deleting?.id}
        onClose={() => setDeleting(null)}
        onConfirm={handleDeleteConfirm}
      />

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sent Card — with edit/delete on hover                              */
/* ------------------------------------------------------------------ */
function SentCard({ notification, onClick, onEdit, onDelete }) {
  const isBroadcast = notification.recipientType === "all";
  const readPct =
    notification.totalRecipients > 0
      ? Math.round(
          (notification.readCount / notification.totalRecipients) * 100,
        )
      : 0;

  return (
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
      className="w-full p-4 text-left transition-all border cursor-pointer group bg-cream border-primary/10 rounded-2xl hover:shadow-soft hover:border-gold/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <span
          className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${
            isBroadcast
              ? "bg-mint text-primary"
              : "bg-emerald-50 text-emerald-600"
          }`}
        >
          {isBroadcast ? <Users size={17} /> : <User size={17} />}
        </span>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate text-primary">
                {notification.title}
              </p>
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

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span
              className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md border ${
                isBroadcast
                  ? "bg-mint text-primary border-primary/10"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}
            >
              {isBroadcast ? <Users size={10} /> : <User size={10} />}
              {isBroadcast ? "All users" : "One user"}
            </span>

            <span className="inline-flex items-center gap-1 text-[10.5px] text-primary/60">
              <Users size={11} />
              {formatNumber(notification.totalRecipients)}{" "}
              {notification.totalRecipients === 1 ? "recipient" : "recipients"}
            </span>

            <span className="inline-flex items-center gap-1 text-[10.5px] text-emerald-600">
              <CheckCheck size={11} />
              {formatNumber(notification.readCount)} read ({readPct}%)
            </span>

            {notification.link && (
              <span className="inline-flex items-center gap-1 text-[10.5px] text-primary/40">
                <Link2 size={11} /> Link
              </span>
            )}

            {/* Edit / Delete on hover */}
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
                aria-label="Delete notification"
                title="Delete"
                className="grid transition rounded-lg opacity-0 w-7 h-7 place-items-center text-primary/30 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 focus:opacity-100"
              >
                <Trash2 size={12} />
              </button>

              <ChevronRight
                size={14}
                className="text-primary/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0"
              />
            </div>
          </div>

          {/* Progress bar */}
          {notification.totalRecipients > 0 && (
            <div className="mt-2.5 h-1.5 rounded-full bg-mint overflow-hidden">
              <div
                className="h-full transition-all duration-500 rounded-full bg-emerald-500"
                style={{ width: `${readPct}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty state                                                        */
/* ------------------------------------------------------------------ */
function EmptyState({ hasSearch }) {
  return (
    <div className="px-6 py-16 text-center border bg-cream border-primary/10 rounded-2xl">
      <div className="grid mx-auto mb-4 w-14 h-14 rounded-2xl bg-gold/25 place-items-center">
        <Send size={22} className="text-primary/50" />
      </div>
      <h3 className="text-lg font-display text-primary">
        {hasSearch ? "No matches found" : "Nothing sent yet"}
      </h3>
      <p className="max-w-sm mx-auto mt-1 text-sm text-primary/50">
        {hasSearch
          ? "Try a different search term."
          : "Notifications you send from the Inbox tab will appear here with stats."}
      </p>
      {!hasSearch && (
        <Link
          to="/admin/notifications"
          className="mt-5 inline-flex items-center gap-2 bg-primary text-cream px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition shadow-soft"
        >
          <InboxIcon size={14} /> Go to Inbox
        </Link>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Detail Modal                                                       */
/* ------------------------------------------------------------------ */
function SentDetailModal({ notificationId, onClose, onEdit, onDelete }) {
  const open = Boolean(notificationId);

  const { data, loading, error } = useFetch(
    () =>
      notificationId
        ? notificationsAPI.getSent(notificationId)
        : Promise.resolve({ data: null }),
    [notificationId],
  );

  const notification =
    data?.notification ||
    data?.data?.notification ||
    (data &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    !data.recipients
      ? data
      : null);

  const recipients = useMemo(() => {
    if (Array.isArray(data?.recipients)) return data.recipients;
    if (Array.isArray(data?.data?.recipients)) return data.data.recipients;
    return [];
  }, [data]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const totalRecipients =
    recipients.length || Number(notification?.total_recipients ?? 0);
  const readCount = recipients.length
    ? recipients.filter((r) => r.is_read || r.isRead).length
    : Number(notification?.read_count ?? 0);
  const readPct =
    totalRecipients > 0 ? Math.round((readCount / totalRecipients) * 100) : 0;

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 z-[130] bg-primary/60 backdrop-blur-sm"
      />

      <div className="fixed inset-0 z-[140] flex items-end sm:items-center justify-center sm:p-6 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="sent-detail-title"
          className="relative w-full sm:max-w-lg pointer-events-auto flex flex-col
            h-[100dvh] sm:h-auto sm:max-h-[88vh]
            bg-cream sm:rounded-3xl rounded-t-3xl shadow-soft overflow-hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          {/* HEADER */}
          <header className="relative px-4 pt-4 pb-5 shrink-0 bg-primary sm:px-6 sm:pt-5 sm:pb-6">
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
              <Send size={14} />
              <span className="text-[11px] uppercase tracking-[0.15em] font-medium">
                Sent notification
              </span>
            </div>

            <h2
              id="sent-detail-title"
              className="relative mt-3 text-xl leading-tight break-words font-display sm:text-2xl text-cream"
            >
              {loading ? (
                <span className="inline-block w-40 h-6 rounded bg-cream/15 animate-pulse" />
              ) : (
                notification?.title || "Notification"
              )}
            </h2>
          </header>

          {/* BODY */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
            {loading ? (
              <div className="p-5 space-y-3 sm:p-6">
                <div className="h-20 rounded-2xl bg-primary/5 animate-pulse" />
                <div className="h-40 rounded-2xl bg-primary/5 animate-pulse" />
              </div>
            ) : error ? (
              <div className="p-5">
                <div className="flex items-start gap-2 px-4 py-3 text-sm text-red-600 border border-red-200 bg-red-50 rounded-2xl">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              </div>
            ) : notification ? (
              <>
                <div className="px-4 pt-5 pb-4 sm:px-6">
                  <div className="grid grid-cols-3 gap-2.5">
                    <StatBox
                      icon={Users}
                      label="Recipients"
                      value={formatNumber(totalRecipients)}
                      tone="primary"
                    />
                    <StatBox
                      icon={CheckCheck}
                      label="Read"
                      value={formatNumber(readCount)}
                      tone="emerald"
                    />
                    <StatBox
                      icon={BarChart3}
                      label="Read %"
                      value={`${readPct}%`}
                      tone="gold"
                    />
                  </div>

                  {totalRecipients > 0 && (
                    <>
                      <div className="h-2 mt-4 overflow-hidden rounded-full bg-mint">
                        <div
                          className="h-full transition-all duration-500 rounded-full bg-emerald-500"
                          style={{ width: `${readPct}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-primary/50 mt-2">
                        {readCount} of {totalRecipients} recipients have read
                        this notification
                      </p>
                    </>
                  )}
                </div>

                {notification.message && (
                  <div className="px-4 pb-4 sm:px-6">
                    <div className="p-4 border bg-white/60 border-primary/10 rounded-2xl">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare size={13} className="text-gold" />
                        <p className="text-[10px] uppercase tracking-wider text-primary/50 font-semibold">
                          Message
                        </p>
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-line text-primary/80">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                )}

                <div className="px-4 pb-4 sm:px-6">
                  <div className="overflow-hidden border bg-white/60 border-primary/10 rounded-2xl">
                    <ul className="divide-y divide-primary/5">
                      <DetailRow
                        icon={Hash}
                        label="Notification ID"
                        value={notification.id || notification._id}
                      />
                      <DetailRow
                        icon={Send}
                        label="Recipient type"
                        value={
                          notification.recipient_type === "all" ||
                          notification.recipientType === "all"
                            ? "Broadcast (all users)"
                            : "Single user"
                        }
                      />
                      {notification.link && (
                        <DetailRow
                          icon={Link2}
                          label="Attached link"
                          value={notification.link}
                        />
                      )}
                      <DetailRow
                        icon={Calendar}
                        label="Sent at"
                        value={formatDateTime(
                          notification.created_at || notification.createdAt,
                        )}
                      />
                    </ul>
                  </div>
                </div>

                {recipients.length > 0 && (
                  <div className="px-4 pb-5 sm:px-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-display text-primary">
                        Recipients
                      </h3>
                      <span className="text-[10.5px] text-primary/50">
                        {recipients.length}{" "}
                        {recipients.length === 1 ? "user" : "users"}
                      </span>
                    </div>

                    <div className="overflow-hidden border bg-white/60 border-primary/10 rounded-2xl">
                      <ul className="overflow-y-auto divide-y divide-primary/5 max-h-72">
                        {recipients.map((r, i) => (
                          <RecipientRow
                            key={r.id || r.user_id || i}
                            recipient={r}
                          />
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-6 text-center">
                <p className="text-sm text-primary/60">
                  Notification details not available.
                </p>
              </div>
            )}
          </div>

          {/* FOOTER — with Edit + Delete */}
          <footer className="shrink-0 border-t border-primary/10 bg-cream px-4 sm:px-6 py-3.5 sm:py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {notification && (
                  <>
                    <button
                      type="button"
                      onClick={() => onEdit(notification)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-cream border border-primary/15 px-3 py-2 rounded-xl hover:bg-mint transition"
                    >
                      <Pencil size={12} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(notification)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 bg-cream border border-red-200 px-3 py-2 rounded-xl hover:bg-red-50 transition"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 text-sm transition text-primary/60 hover:text-primary"
                >
                  Close
                </button>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Edit Modal                                                         */
/* ------------------------------------------------------------------ */
function EditSentModal({ open, notification, onClose, onSuccess }) {
  const [form, setForm] = useState({ title: "", message: "", link: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !notification) return;
    setForm({
      title: notification.title || "",
      message: notification.message || "",
      link: notification.link || "",
    });
    setError("");
    setSaving(false);
  }, [open, notification]);

  useEffect(() => {
    if (!open || saving) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, saving, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

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

    setSaving(true);
    try {
      await notificationsAPI.update(notification.id, {
        title: form.title.trim(),
        message: form.message.trim(),
        link: form.link.trim() || null,
      });
      onSuccess?.();
    } catch (err) {
      setError(err?.message || "Could not update notification.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div
        aria-hidden="true"
        onClick={saving ? undefined : onClose}
        className="fixed inset-0 z-[150] bg-primary/60 backdrop-blur-sm"
      />

      <div className="fixed inset-0 z-[160] flex items-end sm:items-center justify-center sm:p-6 pointer-events-none">
        <form
          onSubmit={handleSubmit}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-sent-title"
          className="relative w-full sm:max-w-lg pointer-events-auto flex flex-col
            h-[100dvh] sm:h-auto sm:max-h-[88vh]
            bg-cream sm:rounded-3xl rounded-t-3xl shadow-soft overflow-hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          {/* HEADER */}
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
                <Pencil size={17} />
              </span>
              <div className="min-w-0">
                <h2
                  id="edit-sent-title"
                  className="text-lg leading-tight font-display sm:text-xl text-cream"
                >
                  Edit notification
                </h2>
                <p className="text-cream/60 text-[11px] sm:text-xs mt-0.5">
                  Update title, message or link
                </p>
              </div>
            </div>
          </header>

          {/* BODY */}
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
                    placeholder="Notification title"
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
                    placeholder="Notification message…"
                    rows={3}
                    className="w-full text-sm leading-relaxed bg-transparent outline-none resize-none text-primary placeholder:text-primary/40"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-primary/70 mb-1.5 block">
                  Link{" "}
                  <span className="font-normal text-primary/40">
                    (optional)
                  </span>
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

          {/* FOOTER */}
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
                    <Loader2 size={15} className="animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    <Check size={14} /> Save changes
                  </>
                )}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Delete Confirmation Dialog                                         */
/* ------------------------------------------------------------------ */
function DeleteDialog({ open, notification, working, onClose, onConfirm }) {
  useEffect(() => {
    if (!open || working) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, working, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const totalRecipients = notification?.totalRecipients ?? 0;

  return (
    <>
      <div
        aria-hidden="true"
        onClick={working ? undefined : onClose}
        className="fixed inset-0 z-[150] bg-primary/60 backdrop-blur-sm"
      />

      <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 pointer-events-none">
        <div
          role="alertdialog"
          aria-modal="true"
          className="relative w-full max-w-md overflow-hidden pointer-events-auto bg-cream rounded-3xl shadow-soft"
        >
          <button
            type="button"
            onClick={onClose}
            disabled={working}
            aria-label="Close"
            className="absolute top-3.5 right-3.5 w-8 h-8 rounded-lg grid place-items-center text-primary/50 hover:bg-mint transition disabled:opacity-50"
          >
            <X size={15} />
          </button>

          <div className="p-6 sm:p-7">
            <div className="grid mx-auto border border-red-200 w-14 h-14 rounded-2xl bg-red-50 place-items-center">
              <AlertTriangle size={24} className="text-red-500" />
            </div>

            <h2 className="mt-4 text-xl text-center font-display text-primary">
              Delete this notification?
            </h2>
            <p className="max-w-sm mx-auto mt-2 text-sm text-center text-primary/60">
              "
              <span className="font-medium text-primary">
                {notification?.title}
              </span>
              "
              {totalRecipients > 0 && (
                <>
                  {" "}
                  was sent to{" "}
                  <span className="font-medium text-primary">
                    {totalRecipients}{" "}
                    {totalRecipients === 1 ? "recipient" : "recipients"}
                  </span>
                </>
              )}
              . This cannot be undone.
            </p>

            <div className="flex flex-col-reverse gap-2 mt-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={working}
                className="inline-flex items-center justify-center w-full gap-2 px-5 py-3 text-sm font-medium transition border sm:w-auto bg-cream border-primary/15 text-primary rounded-xl hover:bg-mint disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={working}
                className="inline-flex items-center justify-center w-full gap-2 px-5 py-3 text-sm font-medium text-white transition bg-red-600 sm:w-auto rounded-xl hover:bg-red-700 shadow-soft disabled:opacity-70"
              >
                {working ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 size={14} /> Delete notification
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */
function StatBox({ icon: Icon, label, value, tone }) {
  const toneCls =
    {
      primary: "bg-mint text-primary",
      emerald: "bg-emerald-50 text-emerald-600",
      gold: "bg-gold/25 text-primary",
    }[tone] || "bg-mint text-primary";

  return (
    <div className="p-3 text-center border bg-white/60 border-primary/10 rounded-2xl">
      <span
        className={`w-7 h-7 rounded-lg grid place-items-center mx-auto ${toneCls}`}
      >
        <Icon size={13} />
      </span>
      <p className="font-display text-lg text-primary mt-1.5 tabular-nums">
        {value}
      </p>
      <p className="text-[9.5px] uppercase tracking-wider text-primary/40 mt-0.5">
        {label}
      </p>
    </div>
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

function RecipientRow({ recipient }) {
  const name =
    recipient.name || recipient.user?.name || recipient.fullName || "Unknown";
  const email = recipient.email || recipient.user?.email || "—";
  const initial = (name.charAt(0) || "U").toUpperCase();
  const isRead = recipient.is_read ?? recipient.isRead ?? false;
  const readAt = recipient.read_at || recipient.readAt;

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span className="grid text-sm font-bold w-9 h-9 rounded-xl bg-gold text-primary place-items-center font-display shrink-0">
        {initial}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate text-primary">{name}</p>
        <p className="text-[11px] text-primary/50 truncate">{email}</p>
      </div>
      {isRead ? (
        <span
          className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0"
          title={readAt ? formatDateTime(readAt) : undefined}
        >
          <Check size={9} /> Read
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full bg-primary/5 text-primary/50 border border-primary/10 shrink-0">
          <Circle size={9} /> Unread
        </span>
      )}
    </li>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
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
