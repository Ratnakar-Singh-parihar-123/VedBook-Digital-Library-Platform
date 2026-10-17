import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ShieldCheck,
  Loader2,
  User,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BookOpen,
  Users,
  BarChart3,
} from "lucide-react";
import { authAPI } from "../../api/adminApi";
import logo from "../../assets/logo/mainLogo.png";

/* ------------------------------------------------------------------ */
/*  Feature list (left branding panel)                                 */
/* ------------------------------------------------------------------ */
const FEATURES = [
  { icon: BookOpen, text: "Full content management" },
  { icon: Users, text: "User & permissions control" },
  { icon: BarChart3, text: "Real-time analytics" },
  { icon: ShieldCheck, text: "Secure JWT sessions" },
];

export default function AdminRegister() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const update = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (error) setError("");
  };

  /* ---------- Password strength ---------- */
  const pwStrength = (() => {
    const p = form.password;
    if (!p) return { level: 0, label: "" };
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 2) return { level: 1, label: "Weak", color: "bg-red-400" };
    if (score <= 3) return { level: 2, label: "Fair", color: "bg-gold" };
    if (score <= 4) return { level: 3, label: "Good", color: "bg-gold" };
    return { level: 4, label: "Strong", color: "bg-primary" };
  })();

  /* ---------- Submit ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await authAPI.register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      setSuccess("Account created! Redirecting to login…");
      setTimeout(() => navigate("/admin/login"), 1400);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-cream lg:grid lg:grid-cols-2">
      {/* ================= LEFT — branding (lg+) ================= */}
      <aside className="relative flex-col justify-between hidden p-10 overflow-hidden lg:flex bg-primary xl:p-14">
        {/* Decorative blurs */}
        <div className="absolute rounded-full pointer-events-none -top-32 -right-32 w-96 h-96 bg-gold/20 blur-3xl" />
        <div className="absolute rounded-full pointer-events-none -bottom-32 -left-32 w-96 h-96 bg-mint/20 blur-3xl" />
        {/* faint grid */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse at center, black 40%, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, black 40%, transparent 75%)",
          }}
        />

        {/* Brand */}
        <Link
          to="/"
          className="relative z-10 flex items-center gap-3 w-fit group"
        >
          <div className="relative grid w-12 h-12 overflow-hidden place-items-center rounded-2xl bg-cream ring-1 ring-gold/40 shrink-0">
            <img
              src={logo}
              alt="VedBook"
              className="object-contain w-full h-full "
              onError={(e) => {
                e.currentTarget.style.display = "none";
                e.currentTarget.nextSibling.style.display = "grid";
              }}
            />
            <span className="absolute inset-0 hidden text-lg font-bold place-items-center font-display text-gold">
              V
            </span>
          </div>
          <div>
            <p className="text-xl leading-none font-display text-cream">
              VedBook
            </p>
            <p className="text-[10px] text-cream/50 uppercase tracking-widest mt-1">
              Admin Console
            </p>
          </div>
        </Link>

        {/* Middle */}
        <div className="relative z-10 max-w-md my-10">
          <span className="inline-flex items-center gap-2 bg-cream/5 border border-cream/10 text-cream/70 text-xs font-medium px-3 py-1.5 rounded-full">
            <Sparkles size={12} className="text-gold" />
            One-time setup
          </span>

          <h1 className="font-display text-4xl xl:text-5xl text-cream mt-5 leading-[1.1]">
            Create your
            <br />
            <span className="text-gold">admin account.</span>
          </h1>

          <p className="mt-5 leading-relaxed text-cream/60">
            Full access to manage books, users, and content. Register once — the
            console remembers you.
          </p>

          <ul className="mt-10 space-y-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="grid w-8 h-8 border rounded-xl bg-cream/10 border-cream/10 place-items-center shrink-0">
                  <Icon size={14} className="text-gold" />
                </span>
                <span className="text-sm text-cream/80">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-cream/40">
          © {new Date().getFullYear()} VedBook — All rights reserved
        </p>
      </aside>

      {/* ================= RIGHT — form ================= */}
      <main className="flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-20 border-b lg:hidden bg-cream/90 backdrop-blur-md border-primary/10">
          <div className="flex items-center justify-between h-16 px-4 sm:px-5">
            <Link
              to="/"
              className="flex items-center gap-2.5 group min-w-0"
              aria-label="VedBook — Home"
            >
              <div className="relative grid w-10 h-10 overflow-hidden rounded-2xl bg-primary place-items-center ring-1 ring-primary/10 shrink-0">
                <img
                  src={logo}
                  alt="VedBook"
                  className="object-contain w-full h-full p-1"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.nextSibling.style.display = "grid";
                  }}
                />
                <span className="absolute inset-0 hidden text-base font-bold place-items-center font-display text-gold">
                  V
                </span>
              </div>
              <div className="min-w-0 leading-none">
                <p className="text-base truncate font-display text-primary">
                  VedBook
                </p>
                <p className="text-[9px] text-primary/50 uppercase tracking-widest mt-1">
                  Admin Console
                </p>
              </div>
            </Link>

            <Link
              to="/admin/login"
              className="px-3 py-2 text-xs font-medium transition border text-primary rounded-xl border-primary/15 hover:bg-mint shrink-0"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Form scroll area */}
        <div className="flex items-center justify-center flex-1 px-4 py-8 sm:px-6 sm:py-12">
          <div className="w-full max-w-md">
            {/* Back link (desktop only — mobile has top bar) */}
            <Link
              to="/"
              className="items-center hidden gap-2 mb-8 text-sm transition lg:inline-flex text-primary/60 hover:text-primary"
            >
              <ArrowLeft size={14} /> Back to home
            </Link>

            {/* Heading */}
            <div className="mb-8">
              <h2 className="text-2xl font-display sm:text-3xl text-primary">
                Create account
              </h2>
              <p className="mt-2 text-sm text-primary/60 sm:text-base">
                Enter your details to set up an admin account.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Full name" icon={User}>
                <input
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={update("name")}
                  placeholder="Aarav Sharma"
                  className="w-full bg-transparent outline-none text-sm text-primary placeholder:text-primary/40 py-3.5"
                />
              </Field>

              <Field label="Email address" icon={Mail}>
                <input
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={update("email")}
                  placeholder="admin@vedbook.app"
                  className="w-full bg-transparent outline-none text-sm text-primary placeholder:text-primary/40 py-3.5"
                />
              </Field>

              <Field label="Password" icon={Lock}>
                <input
                  type={showPw ? "text" : "password"}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={update("password")}
                  placeholder="At least 6 characters"
                  className="w-full bg-transparent outline-none text-sm text-primary placeholder:text-primary/40 py-3.5"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  className="p-1 transition text-primary/40 hover:text-primary shrink-0"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </Field>

              {/* Password strength */}
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  form.password ? "max-h-12 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-1 gap-1">
                    {[1, 2, 3, 4].map((n) => (
                      <span
                        key={n}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          n <= pwStrength.level ? pwStrength.color : "bg-mint"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-medium text-primary/60 w-14 text-right">
                    {pwStrength.label}
                  </span>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-3 py-2.5">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Success */}
              {success && (
                <div className="flex items-start gap-2 bg-mint border border-primary/10 text-primary text-xs rounded-xl px-3 py-2.5">
                  <CheckCircle2
                    size={14}
                    className="shrink-0 mt-0.5 text-gold"
                  />
                  <span>{success}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-cream py-3.5 rounded-2xl font-medium hover:bg-primary/90 active:scale-[0.99] transition shadow-soft disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating account…
                  </>
                ) : (
                  "Create admin account"
                )}
              </button>

              <p className="pt-2 text-xs text-center text-primary/60">
                Already have an account?{" "}
                <Link
                  to="/admin/login"
                  className="font-medium text-gold hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Field wrapper                                                      */
/* ------------------------------------------------------------------ */
function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <label className="text-xs font-medium text-primary/70 mb-1.5 block">
        {label}
      </label>
      <div className="flex items-center gap-2.5 bg-white border border-primary/10 rounded-2xl px-4 focus-within:ring-2 focus-within:ring-gold/40 focus-within:border-gold/40 transition">
        <Icon size={16} className="text-primary/40 shrink-0" />
        {children}
      </div>
    </div>
  );
}
