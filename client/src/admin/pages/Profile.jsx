import { useEffect, useRef, useState } from "react";
import {
  User,
  Mail,
  Camera,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Save,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  Upload,
  Trash2,
  ShieldCheck,
} from "lucide-react";

import useFetch from "../dashboard/hooks/useFetch";
import { profileAPI } from "../../api/adminApi";
import { resolveAvatarUrl } from "../../utils/urlUtils";

/*  Avatar URL resolver — handles relative paths & filename-only      */

function resolveAvatar(admin) {
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

/*  Page                                                               */

export default function Profile() {
  const fileRef = useRef(null);

  const [refreshKey, setRefreshKey] = useState(0);
  const { data, loading, error } = useFetch(
    () => profileAPI.get(),
    [refreshKey],
  );

  const serverAdmin =
    data?.admin ||
    data?.user ||
    data?.data ||
    (data && typeof data === "object" && !Array.isArray(data) ? data : null);

  /* ---------- Profile state ---------- */
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    if (!serverAdmin) return;
    setName(serverAdmin.name || "");
    setEmail(serverAdmin.email || "");
    setAvatarPreview(resolveAvatar(serverAdmin));
  }, [serverAdmin]);

  /* ---------- Password state ---------- */
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPw, setShowPw] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState({ type: "", text: "" });

  /* Auto-dismiss messages */
  useEffect(() => {
    if (!profileMsg.text) return;
    const t = setTimeout(() => setProfileMsg({ type: "", text: "" }), 3500);
    return () => clearTimeout(t);
  }, [profileMsg.text]);

  useEffect(() => {
    if (!pwMsg.text) return;
    const t = setTimeout(() => setPwMsg({ type: "", text: "" }), 3500);
    return () => clearTimeout(t);
  }, [pwMsg.text]);

  /* ---------- Handlers ---------- */
  const handleFilePick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setProfileMsg({ type: "error", text: "Please select an image file." });
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setProfileMsg({ type: "error", text: "Image must be under 5 MB." });
      return;
    }
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
    setProfileMsg({ type: "", text: "" });
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileMsg({ type: "", text: "" });

    if (!name.trim() || !email.trim()) {
      setProfileMsg({ type: "error", text: "Name and email are required." });
      return;
    }

    setSavingProfile(true);
    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("email", email.trim().toLowerCase());
      if (avatarFile instanceof File) fd.append("avatar", avatarFile);

      const res = await profileAPI.update(fd);
      const updated =
        res?.data?.admin || res?.data?.user || res?.data?.data || res?.data;

      const nextName = updated?.name || name.trim();
      const nextEmail = updated?.email || email.trim().toLowerCase();
      const nextAvatar = resolveAvatar(updated) || avatarPreview;

      setName(nextName);
      setEmail(nextEmail);
      setAvatarPreview(nextAvatar);
      setAvatarFile(null);

      /* Sync cache for sidebar */
      try {
        const prev = JSON.parse(localStorage.getItem("ved_admin") || "{}");
        localStorage.setItem(
          "ved_admin",
          JSON.stringify({
            ...prev,
            ...(updated || {}),
            name: nextName,
            email: nextEmail,
            avatar: nextAvatar,
          }),
        );
      } catch (e) {
        console.warn("Could not sync local admin cache:", e);
      }

      setProfileMsg({ type: "success", text: "Profile updated." });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setProfileMsg({
        type: "error",
        text: err?.message || "Could not update profile.",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPwMsg({ type: "", text: "" });

    if (
      !pwForm.currentPassword ||
      !pwForm.newPassword ||
      !pwForm.confirmPassword
    ) {
      setPwMsg({ type: "error", text: "All fields are required." });
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwMsg({
        type: "error",
        text: "New password must be at least 6 characters.",
      });
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg({ type: "error", text: "Passwords do not match." });
      return;
    }
    if (pwForm.currentPassword === pwForm.newPassword) {
      setPwMsg({
        type: "error",
        text: "New password must differ from current.",
      });
      return;
    }

    setSavingPw(true);
    try {
      await profileAPI.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwMsg({ type: "success", text: "Password changed." });
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPwMsg({
        type: "error",
        text: err?.message || "Could not change password.",
      });
    } finally {
      setSavingPw(false);
    }
  };

  const displayName = name || serverAdmin?.name || "Admin";
  const initial = (displayName.charAt(0) || "A").toUpperCase();

  return (
    <div className="max-w-3xl px-4 py-6 mx-auto sm:px-6 sm:py-8">
      {/* ============ HEADER ============ */}
      <header className="mb-6">
        <h1 className="text-2xl tracking-tight font-display sm:text-3xl text-primary">
          My Profile
        </h1>
        <p className="mt-1 text-sm text-primary/60">
          Manage your account details and password
        </p>
      </header>

      {/* ============ LOAD ERROR ============ */}
      {error && (
        <div className="flex items-start gap-2 px-4 py-3 mb-6 text-sm text-red-600 border border-red-200 bg-red-50 rounded-2xl">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium">Couldn't load your profile</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            className="text-xs font-medium underline underline-offset-2 shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* ============ PROFILE CARD ============ */}
      <section className="mb-6 overflow-hidden border bg-cream border-primary/10 rounded-3xl shadow-soft">
        {/* Header strip with avatar */}
        <div className="relative px-6 py-8 bg-primary sm:px-8">
          <div className="absolute w-48 h-48 rounded-full pointer-events-none -top-16 -right-16 bg-gold/20 blur-3xl" />
          <div className="absolute w-48 h-48 rounded-full pointer-events-none -bottom-16 -left-16 bg-mint/10 blur-3xl" />

          <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:items-end">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 overflow-hidden sm:w-28 sm:h-28 rounded-3xl bg-cream/10 ring-4 ring-gold/40">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Admin avatar"
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.nextSibling.style.display = "grid";
                    }}
                  />
                ) : null}
                <div
                  className={`w-full h-full place-items-center font-display text-4xl font-bold text-gold ${
                    avatarPreview ? "hidden" : "grid"
                  }`}
                >
                  {initial}
                </div>
              </div>

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                aria-label="Change avatar"
                className="absolute grid w-10 h-10 transition border-4 -bottom-1 -right-1 rounded-xl bg-gold text-primary place-items-center hover:bg-gold/90 active:scale-95 shadow-soft border-primary"
              >
                <Camera size={15} />
              </button>
            </div>

            {/* Name + email */}
            <div className="flex-1 min-w-0 pb-1 text-center sm:text-left">
              {loading && !serverAdmin ? (
                <div className="space-y-2">
                  <div className="w-40 h-6 mx-auto rounded bg-cream/15 animate-pulse sm:mx-0" />
                  <div className="w-56 h-4 mx-auto rounded bg-cream/10 animate-pulse sm:mx-0" />
                </div>
              ) : (
                <>
                  <h2 className="text-2xl leading-tight truncate font-display sm:text-3xl text-cream">
                    {displayName}
                  </h2>
                  <p className="mt-1 text-sm truncate text-cream/60">
                    {email || serverAdmin?.email || "—"}
                  </p>
                  <span className="inline-flex items-center gap-1 mt-2 bg-gold/20 border border-gold/40 text-gold text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full">
                    <ShieldCheck size={10} />
                    Admin
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ---------- Editable form ---------- */}
        <form onSubmit={handleProfileSave} className="p-6 space-y-5 sm:p-8">
          <Field label="Full name" icon={User}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
              className="w-full bg-transparent outline-none text-sm text-primary placeholder:text-primary/40 py-3.5"
            />
          </Field>

          <Field label="Email address" icon={Mail}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@vedbook.app"
              autoComplete="email"
              className="w-full bg-transparent outline-none text-sm text-primary placeholder:text-primary/40 py-3.5"
            />
          </Field>

          {/* Avatar file row */}
          <div>
            <label className="text-xs font-medium text-primary/70 mb-1.5 block">
              Profile photo
            </label>
            <div className="flex items-center gap-3 px-4 py-3 border bg-white/70 border-primary/10 rounded-2xl">
              <div className="grid w-12 h-12 overflow-hidden rounded-xl bg-mint place-items-center shrink-0">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt=""
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="text-lg font-bold font-display text-primary/60">
                    {initial}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs truncate text-primary/60">
                  {avatarFile ? avatarFile.name : "JPG, PNG · max 5 MB"}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary px-3 py-2 bg-mint rounded-lg hover:bg-gold/30 transition"
                >
                  <Upload size={12} />
                  Choose
                </button>
                {avatarFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarFile(null);
                      setAvatarPreview(resolveAvatar(serverAdmin));
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    aria-label="Cancel avatar change"
                    className="grid w-8 h-8 text-red-600 transition rounded-lg place-items-center bg-red-50 hover:bg-red-100"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFilePick}
                className="hidden"
              />
            </div>
          </div>

          {profileMsg.text && <Message {...profileMsg} />}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center gap-2 bg-primary text-cream px-5 py-3 rounded-2xl text-sm font-medium hover:bg-primary/90 active:scale-[0.98] transition shadow-soft disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {savingProfile ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save size={15} />
                  Save changes
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* ============ PASSWORD CARD ============ */}
      <section className="p-6 border bg-cream border-primary/10 rounded-3xl shadow-soft sm:p-8">
        <header className="flex items-center gap-2.5 mb-5">
          <span className="grid w-9 h-9 rounded-xl bg-gold/25 place-items-center text-primary shrink-0">
            <KeyRound size={16} />
          </span>
          <div>
            <h2 className="text-lg font-display text-primary">
              Change password
            </h2>
            <p className="text-xs text-primary/50">Keep your account secure</p>
          </div>
        </header>

        <form onSubmit={handlePasswordSave} className="max-w-lg space-y-4">
          <PwField
            label="Current password"
            value={pwForm.currentPassword}
            onChange={(v) => setPwForm({ ...pwForm, currentPassword: v })}
            show={showPw.current}
            onToggle={() => setShowPw({ ...showPw, current: !showPw.current })}
            autoComplete="current-password"
          />

          <PwField
            label="New password"
            value={pwForm.newPassword}
            onChange={(v) => setPwForm({ ...pwForm, newPassword: v })}
            show={showPw.next}
            onToggle={() => setShowPw({ ...showPw, next: !showPw.next })}
            autoComplete="new-password"
            hint="At least 6 characters"
          />

          <PwField
            label="Confirm new password"
            value={pwForm.confirmPassword}
            onChange={(v) => setPwForm({ ...pwForm, confirmPassword: v })}
            show={showPw.confirm}
            onToggle={() => setShowPw({ ...showPw, confirm: !showPw.confirm })}
            autoComplete="new-password"
          />

          {pwMsg.text && <Message {...pwMsg} />}

          <div className="pt-1">
            <button
              type="submit"
              disabled={savingPw}
              className="inline-flex items-center gap-2 bg-primary text-cream px-5 py-3 rounded-2xl text-sm font-medium hover:bg-primary/90 active:scale-[0.98] transition shadow-soft disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {savingPw ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Updating…
                </>
              ) : (
                <>
                  <Lock size={14} />
                  Update password
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

/*  Field wrappers                                                     */

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

function PwField({
  label,
  value,
  onChange,
  show,
  onToggle,
  autoComplete,
  hint,
}) {
  return (
    <div>
      <label className="text-xs font-medium text-primary/70 mb-1.5 block">
        {label}
      </label>
      <div className="flex items-center gap-2.5 bg-white/70 border border-primary/10 rounded-2xl px-4 focus-within:ring-2 focus-within:ring-gold/40 focus-within:border-gold/40 transition">
        <Lock size={15} className="text-primary/40 shrink-0" />
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          placeholder="••••••••"
          className="w-full bg-transparent outline-none text-sm text-primary placeholder:text-primary/40 py-3.5"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? "Hide password" : "Show password"}
          className="p-1 transition text-primary/40 hover:text-primary shrink-0"
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      {hint && <p className="text-[11px] text-primary/40 mt-1.5">{hint}</p>}
    </div>
  );
}

function Message({ type, text }) {
  const ok = type === "success";
  return (
    <div
      className={`flex items-start gap-2 text-xs rounded-xl px-3 py-2.5 ${
        ok
          ? "bg-mint border border-primary/10 text-primary"
          : "bg-red-50 border border-red-200 text-red-600"
      }`}
    >
      {ok ? (
        <CheckCircle2 size={14} className="shrink-0 mt-0.5 text-gold" />
      ) : (
        <AlertCircle size={14} className="shrink-0 mt-0.5" />
      )}
      <span>{text}</span>
    </div>
  );
}
