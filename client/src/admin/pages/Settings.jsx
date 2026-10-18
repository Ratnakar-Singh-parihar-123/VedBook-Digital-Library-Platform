import { useState } from "react";
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Sliders,
  ShieldCheck,
  Database,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Globe,
  Mail,
  BookOpen,
  LayoutGrid,
  List,
  Clock,
  Lock,
  Download,
  Upload,
  KeyRound,
  Info,
  Sparkles,
  ChevronRight,
  X,
} from "lucide-react";

import useLocalSettings from "../../admin/dashboard/hooks/useLocalSettings";

/*  Tabs                                                               */

const TABS = [
  { key: "general", label: "General", icon: Globe },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "preferences", label: "Preferences", icon: Sliders },
  { key: "security", label: "Security", icon: ShieldCheck },
  { key: "data", label: "Data", icon: Database },
];

/*  Page                                                               */

export default function Settings() {
  const { settings, update, reset } = useLocalSettings();

  const [tab, setTab] = useState("general");
  const [saved, setSaved] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div className="max-w-6xl px-3 py-5 mx-auto sm:px-6 lg:px-8 sm:py-8">
      {/* ================= HEADER ================= */}
      <header className="flex flex-col gap-4 mb-5 sm:flex-row sm:items-center sm:justify-between sm:mb-6">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="grid w-10 h-10 rounded-2xl bg-mint place-items-center text-primary shrink-0">
            <SettingsIcon size={18} />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl tracking-tight font-display sm:text-2xl lg:text-3xl text-primary">
              Settings
            </h1>
            <p className="text-xs truncate sm:text-sm text-primary/60">
              Configure your library and preferences
            </p>
          </div>
        </div>

        <div className="flex items-center w-full gap-2 sm:w-auto">
          <button
            type="button"
            onClick={() => setShowResetDialog(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-cream border border-primary/10 text-primary px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium hover:bg-mint transition shadow-soft"
          >
            <RotateCcw size={14} />
            Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-primary text-cream px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium hover:bg-primary/90 transition shadow-soft"
          >
            <Save size={14} />
            Save changes
          </button>
        </div>
      </header>

      {/* ================= SAVE MESSAGE ================= */}
      {saved && (
        <div className="flex items-center gap-2 px-4 py-3 mb-5 text-xs border bg-mint border-primary/10 text-primary sm:text-sm rounded-2xl">
          <CheckCircle2 size={16} className="text-gold shrink-0" />
          <span>Settings saved successfully.</span>
        </div>
      )}

      {/* ================= LAYOUT ================= */}
      <div className="grid lg:grid-cols-[220px_1fr] xl:grid-cols-[240px_1fr] gap-5 lg:gap-6">
        {/* ---------- Tabs sidebar ---------- */}
        <aside className="min-w-0">
          <nav aria-label="Settings sections" className="lg:sticky lg:top-24">
            {/* Mobile: horizontal scroll tabs */}
            <ul className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0 -mx-3 px-3 lg:mx-0 lg:px-0 no-scrollbar">
              {TABS.map((t) => {
                const Icon = t.icon;
                const on = tab === t.key;
                return (
                  <li key={t.key} className="shrink-0 lg:w-full">
                    <button
                      type="button"
                      onClick={() => setTab(t.key)}
                      className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition whitespace-nowrap lg:w-full ${
                        on
                          ? "bg-primary text-cream shadow-soft"
                          : "bg-white/60 lg:bg-transparent text-primary/70 hover:bg-mint hover:text-primary border border-primary/10 lg:border-0"
                      }`}
                    >
                      <Icon size={14} className="shrink-0" />
                      {t.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* ---------- Content ---------- */}
        <div className="min-w-0 space-y-5 sm:space-y-6">
          {tab === "general" && (
            <GeneralSection settings={settings} update={update} />
          )}
          {tab === "notifications" && (
            <NotificationsSection settings={settings} update={update} />
          )}
          {tab === "preferences" && (
            <PreferencesSection settings={settings} update={update} />
          )}
          {tab === "security" && (
            <SecuritySection settings={settings} update={update} />
          )}
          {tab === "data" && <DataSection settings={settings} reset={reset} />}
        </div>
      </div>

      {/* ================= RESET DIALOG ================= */}
      <ResetDialog
        open={showResetDialog}
        onClose={() => setShowResetDialog(false)}
        onConfirm={() => {
          reset();
          setShowResetDialog(false);
          setSaved(true);
          setTimeout(() => setSaved(false), 2200);
        }}
      />

      {/* Hide scrollbar utility */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

/*  General                                                            */

function GeneralSection({ settings, update }) {
  return (
    <Card
      icon={Globe}
      title="General"
      description="Basic information about your library"
    >
      <Field label="Site name" icon={Sparkles}>
        <input
          type="text"
          value={settings.siteName}
          onChange={(e) => update("siteName", e.target.value)}
          placeholder="VedBook"
          className="w-full bg-transparent outline-none text-sm text-primary placeholder:text-primary/40 py-3.5"
        />
      </Field>

      <Field label="Tagline" icon={Info}>
        <input
          type="text"
          value={settings.tagline}
          onChange={(e) => update("tagline", e.target.value)}
          placeholder="Digital Library"
          className="w-full bg-transparent outline-none text-sm text-primary placeholder:text-primary/40 py-3.5"
        />
      </Field>

      <Field label="Support email" icon={Mail}>
        <input
          type="email"
          value={settings.supportEmail}
          onChange={(e) => update("supportEmail", e.target.value)}
          placeholder="support@example.com"
          className="w-full bg-transparent outline-none text-sm text-primary placeholder:text-primary/40 py-3.5"
        />
      </Field>

      <SelectField
        label="Default language"
        icon={Globe}
        value={settings.language}
        onChange={(v) => update("language", v)}
        options={[
          { value: "en", label: "English" },
          { value: "hi", label: "Hindi" },
        ]}
      />
    </Card>
  );
}

/*  Notifications                                                      */

function NotificationsSection({ settings, update }) {
  const items = [
    {
      key: "notifyNewUsers",
      icon: User,
      label: "New user registrations",
      desc: "Get notified when a reader signs up",
    },
    {
      key: "notifyNewBooks",
      icon: BookOpen,
      label: "New book uploads",
      desc: "Alert when books are added or published",
    },
    {
      key: "notifyReports",
      icon: AlertCircle,
      label: "Content reports",
      desc: "Notifications for reported content",
    },
    {
      key: "notifyWeeklyDigest",
      icon: Mail,
      label: "Weekly digest",
      desc: "Summary of library activity every Monday",
    },
  ];

  return (
    <Card
      icon={Bell}
      title="Notifications"
      description="Choose what updates you want to receive"
    >
      <div className="space-y-2">
        {items.map(({ key, icon: Icon, label, desc }) => (
          <ToggleRow
            key={key}
            icon={Icon}
            label={label}
            desc={desc}
            checked={Boolean(settings[key])}
            onChange={(v) => update(key, v)}
          />
        ))}
      </div>
    </Card>
  );
}

/*  Preferences                                                        */

function PreferencesSection({ settings, update }) {
  return (
    <Card
      icon={Sliders}
      title="Preferences"
      description="Customise how the admin panel behaves"
    >
      <div>
        <label className="block mb-2 text-xs font-medium text-primary/70">
          Default book view
        </label>
        <div className="grid max-w-xs grid-cols-2 gap-2">
          {[
            { key: "grid", label: "Grid", icon: LayoutGrid },
            { key: "list", label: "List", icon: List },
          ].map(({ key, label, icon: Icon }) => {
            const on = settings.defaultView === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => update("defaultView", key)}
                className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-3 rounded-xl text-sm font-medium transition border ${
                  on
                    ? "bg-primary text-cream border-primary shadow-soft"
                    : "bg-white/70 text-primary/70 border-primary/10 hover:bg-mint"
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <SelectField
        label="Books per page"
        icon={BookOpen}
        value={String(settings.booksPerPage)}
        onChange={(v) => update("booksPerPage", Number(v))}
        options={[
          { value: "10", label: "10 books" },
          { value: "20", label: "20 books" },
          { value: "50", label: "50 books" },
        ]}
      />

      <div className="pt-2 space-y-2">
        <ToggleRow
          icon={Save}
          label="Auto-save drafts"
          desc="Automatically save book drafts while typing"
          checked={settings.autoSaveDraft}
          onChange={(v) => update("autoSaveDraft", v)}
        />
        <ToggleRow
          icon={AlertCircle}
          label="Confirm before delete"
          desc="Ask for confirmation when deleting items"
          checked={settings.confirmDelete}
          onChange={(v) => update("confirmDelete", v)}
        />
      </div>
    </Card>
  );
}

/*  Security                                                           */

function SecuritySection({ settings, update }) {
  return (
    <>
      <Card
        icon={ShieldCheck}
        title="Security"
        description="Keep your admin account protected"
      >
        <SelectField
          label="Session timeout"
          icon={Clock}
          value={settings.sessionTimeout}
          onChange={(v) => update("sessionTimeout", v)}
          options={[
            { value: "1h", label: "1 hour" },
            { value: "24h", label: "24 hours" },
            { value: "7d", label: "7 days" },
            { value: "30d", label: "30 days" },
          ]}
        />

        <div className="pt-2">
          <ToggleRow
            icon={Lock}
            label="Two-factor authentication"
            desc="Add an extra layer of security (coming soon)"
            checked={settings.twoFactor}
            onChange={(v) => update("twoFactor", v)}
            disabled
          />
        </div>
      </Card>

      <Card
        icon={KeyRound}
        title="Password"
        description="Change your admin password"
      >
        <div className="flex flex-col gap-3 p-4 border rounded-2xl bg-mint/50 border-primary/10 sm:flex-row sm:items-center">
          <div className="flex items-start flex-1 min-w-0 gap-3">
            <span className="grid w-9 h-9 rounded-xl bg-white/70 place-items-center text-primary shrink-0">
              <Lock size={15} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-primary">
                Update your password
              </p>
              <p className="mt-1 text-xs text-primary/60">
                Change it from your profile page for security.
              </p>
            </div>
          </div>
          <a
            href="/admin/profile"
            className="shrink-0 inline-flex items-center justify-center gap-1.5 text-xs font-medium text-primary bg-white border border-primary/10 px-3.5 py-2.5 rounded-lg hover:bg-mint transition w-full sm:w-auto"
          >
            Go to Profile <ChevronRight size={12} />
          </a>
        </div>
      </Card>
    </>
  );
}

/*  Data                                                               */

function DataSection({ settings, reset }) {
  const [exported, setExported] = useState(false);

  const handleExport = () => {
    try {
      const blob = new Blob([JSON.stringify(settings, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vedbook-settings-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExported(true);
      setTimeout(() => setExported(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <Card
        icon={Database}
        title="Data management"
        description="Export or manage your library data"
      >
        {/* Export */}
        <div className="flex flex-col gap-3 p-4 border rounded-2xl border-primary/10 bg-white/60 sm:flex-row sm:items-center">
          <div className="flex items-start flex-1 min-w-0 gap-3">
            <span className="grid w-10 h-10 rounded-xl bg-mint place-items-center text-primary shrink-0">
              <Download size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-primary">
                Export settings
              </p>
              <p className="mt-1 text-xs text-primary/60">
                Download your settings as a JSON file
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleExport}
            className="shrink-0 inline-flex items-center justify-center gap-1.5 text-xs font-medium text-primary bg-cream border border-primary/10 px-3.5 py-2.5 rounded-xl hover:bg-mint transition w-full sm:w-auto"
          >
            {exported ? (
              <>
                <CheckCircle2 size={12} className="text-gold" /> Done
              </>
            ) : (
              <>
                <Download size={12} /> Export
              </>
            )}
          </button>
        </div>

        {/* Import */}
        <div className="flex flex-col gap-3 p-4 border rounded-2xl border-primary/10 bg-white/60 sm:flex-row sm:items-center">
          <div className="flex items-start flex-1 min-w-0 gap-3">
            <span className="grid w-10 h-10 rounded-xl bg-mint place-items-center text-primary shrink-0">
              <Upload size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-primary">
                Import settings
              </p>
              <p className="mt-1 text-xs text-primary/60">
                Restore settings from a JSON file
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled
            className="shrink-0 inline-flex items-center justify-center gap-1.5 text-xs font-medium text-primary/40 bg-cream border border-primary/10 px-3.5 py-2.5 rounded-xl cursor-not-allowed w-full sm:w-auto"
          >
            <Upload size={12} /> Coming soon
          </button>
        </div>
      </Card>

      {/* Danger zone */}
      <section className="p-4 border border-red-200 bg-cream rounded-3xl shadow-soft sm:p-6">
        <header className="flex items-center gap-2.5 mb-4">
          <span className="grid text-red-500 w-9 h-9 rounded-xl bg-red-50 place-items-center shrink-0">
            <AlertCircle size={16} />
          </span>
          <div>
            <h3 className="text-base font-display text-primary">Danger zone</h3>
            <p className="text-xs text-primary/50">
              Irreversible actions — be careful
            </p>
          </div>
        </header>

        <div className="flex flex-col gap-3 p-4 border border-red-100 rounded-2xl bg-red-50/60 sm:flex-row sm:items-center">
          <div className="flex items-start flex-1 min-w-0 gap-3">
            <span className="grid w-10 h-10 text-red-500 bg-white border border-red-100 rounded-xl place-items-center shrink-0">
              <Trash2 size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-primary">
                Reset all settings
              </p>
              <p className="mt-1 text-xs text-primary/60">
                Restore defaults. Books and users are not affected.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={reset}
            className="shrink-0 inline-flex items-center justify-center gap-1.5 text-xs font-medium text-white bg-red-600 border border-red-600 px-3.5 py-2.5 rounded-xl hover:bg-red-700 transition w-full sm:w-auto"
          >
            Reset
          </button>
        </div>
      </section>
    </>
  );
}

/*  Card wrapper                                                       */

function Card({ icon: Icon, title, description, children }) {
  return (
    <section className="p-4 space-y-4 border bg-cream border-primary/10 rounded-3xl shadow-soft sm:p-6">
      <header className="flex items-center gap-2.5">
        <span className="grid w-9 h-9 rounded-xl bg-mint place-items-center text-primary shrink-0">
          <Icon size={15} />
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-display text-primary">{title}</h3>
          {description && (
            <p className="text-xs text-primary/50 mt-0.5">{description}</p>
          )}
        </div>
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

/*  Field                                                              */

function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <label className="text-xs font-medium text-primary/70 mb-1.5 block">
        {label}
      </label>
      <div className="flex items-center gap-2.5 bg-white/70 border border-primary/10 rounded-2xl px-4 focus-within:ring-2 focus-within:ring-gold/40 focus-within:border-gold/40 transition">
        {Icon && <Icon size={16} className="text-primary/40 shrink-0" />}
        {children}
      </div>
    </div>
  );
}

/*  Select field                                                       */

function SelectField({ label, icon: Icon, value, onChange, options }) {
  return (
    <div>
      <label className="text-xs font-medium text-primary/70 mb-1.5 block">
        {label}
      </label>
      <div className="relative flex items-center gap-2.5 bg-white/70 border border-primary/10 rounded-2xl px-4 focus-within:ring-2 focus-within:ring-gold/40 focus-within:border-gold/40 transition">
        {Icon && <Icon size={16} className="text-primary/40 shrink-0" />}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent outline-none text-sm text-primary py-3.5 pr-6 appearance-none cursor-pointer"
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
          className="absolute -translate-y-1/2 pointer-events-none right-4 top-1/2 text-primary/40"
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
  );
}

/*  Toggle row                                                         */

function ToggleRow({ icon: Icon, label, desc, checked, onChange, disabled }) {
  return (
    <div className="flex items-center justify-between gap-3 sm:gap-4 bg-white/60 border border-primary/10 rounded-2xl px-3.5 sm:px-4 py-3 sm:py-3.5">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <span className="grid w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-mint place-items-center text-primary shrink-0">
          <Icon size={14} />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] sm:text-sm font-medium text-primary truncate">
            {label}
          </p>
          {desc && (
            <p className="text-[10.5px] sm:text-[11px] text-primary/50 mt-0.5 line-clamp-2">
              {desc}
            </p>
          )}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          checked ? "bg-emerald-500" : "bg-primary/20"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

/*  Reset confirmation dialog                                          */

function ResetDialog({ open, onClose, onConfirm }) {
  if (!open) return null;

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 z-[110] bg-primary/60 backdrop-blur-sm"
      />
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 pointer-events-none">
        <div
          role="alertdialog"
          aria-modal="true"
          className="relative w-full max-w-md overflow-hidden pointer-events-auto bg-cream rounded-3xl shadow-soft"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3.5 right-3.5 w-8 h-8 rounded-lg grid place-items-center text-primary/50 hover:bg-mint transition"
          >
            <X size={15} />
          </button>

          <div className="p-5 sm:p-7">
            <div className="grid mx-auto border border-red-200 w-14 h-14 rounded-2xl bg-red-50 place-items-center">
              <RotateCcw size={22} className="text-red-500" />
            </div>

            <h2 className="mt-4 text-lg text-center font-display sm:text-xl text-primary">
              Reset all settings?
            </h2>
            <p className="max-w-sm mx-auto mt-2 text-sm text-center text-primary/60">
              All settings will return to their defaults. This does not affect
              your books, users, or content.
            </p>

            <div className="flex flex-col-reverse gap-2 mt-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center w-full gap-2 px-5 py-3 text-sm font-medium transition border sm:w-auto bg-cream border-primary/15 text-primary rounded-xl hover:bg-mint"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="inline-flex items-center justify-center w-full gap-2 px-5 py-3 text-sm font-medium text-white transition bg-red-600 sm:w-auto rounded-xl hover:bg-red-700 shadow-soft"
              >
                <RotateCcw size={14} /> Reset settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
