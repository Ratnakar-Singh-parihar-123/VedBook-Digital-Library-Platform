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
  { icon: BookOpen, text: "Content & metadata manager" },
  { icon: Users, text: "User & permissions control" },
  { icon: Sparkles, text: "Real-time mobile preview" },
  { icon: BarChart3, text: "Analytics & reports" },
];

export default function AdminLogin() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const update = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.email.trim() || !form.password) {
      setError("Please enter email and password.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await authAPI.login({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      // Expected response: { token, user } — adjust if backend differs
      const token = data.token || data.accessToken || data.data?.token;
      const user = data.user || data.admin || {};

      if (!token) throw { message: "Invalid response from server (no token)." };

      localStorage.setItem("ved_token", token);
      localStorage.setItem("ved_admin", JSON.stringify(user));

      setSuccess("Signed in! Redirecting…");
      setTimeout(() => navigate("/admin/dashboard"), 800);
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
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
              className="object-contain w-full h-full"
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
            <ShieldCheck size={12} className="text-gold" />
            Secure admin access
          </span>

          <h1 className="font-display text-4xl xl:text-5xl text-cream mt-5 leading-[1.1]">
            Welcome back,
            <br />
            <span className="text-gold">admin.</span>
          </h1>

          <p className="mt-5 leading-relaxed text-cream/60">
            Sign in to manage your library — content, users, and analytics, all
            from one dashboard.
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
              to="/admin/register"
              className="px-3 py-2 text-xs font-medium transition border text-primary rounded-xl border-primary/15 hover:bg-mint shrink-0"
            >
              Sign up
            </Link>
          </div>
        </div>

        {/* Form area */}
        <div className="flex items-center justify-center flex-1 px-4 py-8 sm:px-6 sm:py-12">
          <div className="w-full max-w-md">
            {/* Back link (desktop) */}
            <Link
              to="/"
              className="items-center hidden gap-2 mb-8 text-sm transition lg:inline-flex text-primary/60 hover:text-primary"
            >
              <ArrowLeft size={14} /> Back to home
            </Link>

            {/* Heading */}
            <div className="mb-8">
              <h2 className="text-2xl font-display sm:text-3xl text-primary">
                Welcome back
              </h2>
              <p className="mt-2 text-sm text-primary/60 sm:text-base">
                Sign in to access the admin dashboard.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  autoComplete="current-password"
                  value={form.password}
                  onChange={update("password")}
                  placeholder="••••••••"
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

              {/* Remember + forgot */}
              <div className="flex items-center justify-between gap-3 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-primary/60">
                  <input type="checkbox" className="accent-primary" /> Remember
                  me
                </label>
                <Link
                  to="/admin/forgot-password"
                  className="font-medium text-gold hover:underline shrink-0"
                >
                  Forgot password?
                </Link>
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
                    <Loader2 size={16} className="animate-spin" /> Signing in…
                  </>
                ) : (
                  "Sign in to dashboard"
                )}
              </button>

              <p className="pt-2 text-xs text-center text-primary/60">
                Don't have an account?{" "}
                <Link
                  to="/admin/register"
                  className="font-medium text-gold hover:underline"
                >
                  Create one
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
