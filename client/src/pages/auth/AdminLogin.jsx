import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ShieldCheck,
  Loader2,
} from "lucide-react";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("Please enter email and password.");
      return;
    }

    setLoading(true);
    // 🔧 Placeholder auth — replace with real API call to /api/admin/login
    setTimeout(() => {
      if (
        form.email === "admin@vedlibrary.app" &&
        form.password === "admin123"
      ) {
        localStorage.setItem("ved_admin_token", "demo-token");
        navigate("/admin/dashboard");
      } else {
        setError("Invalid credentials. Try admin@vedlibrary.app / admin123");
        setLoading(false);
      }
    }, 700);
  };

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Left: branding */}
      <div className="hidden lg:flex w-1/2 bg-primary relative overflow-hidden p-12 flex-col justify-between">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-gold/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-mint/20 blur-3xl" />

        <Link to="/" className="relative flex items-center gap-3 w-fit">
          <div className="w-11 h-11 rounded-2xl bg-gold text-primary grid place-items-center font-display text-xl font-bold">
            V
          </div>
          <div>
            <p className="font-display text-cream text-xl leading-none">
              Ved Library
            </p>
            <p className="text-[10px] text-cream/50 uppercase tracking-widest">
              Admin Console
            </p>
          </div>
        </Link>

        <div className="relative max-w-md">
          <ShieldCheck size={36} className="text-gold" />
          <h1 className="font-display text-4xl text-cream mt-5 leading-tight">
            Manage your entire digital library.
          </h1>
          <p className="text-cream/60 mt-4">
            Upload books, approve notes, view analytics, and preview every
            mobile screen — all from one dashboard.
          </p>

          <div className="mt-10 space-y-3">
            {[
              "Content & metadata manager",
              "User & permissions control",
              "Real-time mobile preview",
              "Analytics & reports",
            ].map((f) => (
              <div
                key={f}
                className="flex items-center gap-3 text-sm text-cream/70"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-gold" /> {f}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-cream/40">
          © {new Date().getFullYear()} Ved Library
        </p>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-primary/60 hover:text-primary transition mb-8"
          >
            <ArrowLeft size={14} /> Back to home
          </Link>

          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-2xl bg-primary text-gold grid place-items-center font-display text-xl font-bold">
              V
            </div>
            <div>
              <p className="font-display text-primary text-lg leading-none">
                Ved Library
              </p>
              <p className="text-[10px] text-primary/50 uppercase tracking-widest">
                Admin Console
              </p>
            </div>
          </div>

          <h2 className="font-display text-3xl text-primary">Welcome back</h2>
          <p className="text-primary/60 mt-2">
            Sign in to access the admin dashboard.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <Field label="Email address" icon={Mail}>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="admin@vedlibrary.app"
                className="w-full bg-transparent outline-none text-sm text-primary placeholder:text-primary/40 py-3.5"
              />
            </Field>

            <Field label="Password" icon={Lock}>
              <input
                type={showPw ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-transparent outline-none text-sm text-primary placeholder:text-primary/40 py-3.5"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="text-primary/40 hover:text-primary transition p-1"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </Field>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-primary/60 cursor-pointer">
                <input type="checkbox" className="accent-primary" /> Remember me
              </label>
              <a href="#" className="text-gold font-medium hover:underline">
                Forgot password?
              </a>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-3 py-2.5">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-cream py-3.5 rounded-2xl font-medium hover:bg-primary/90 transition shadow-soft disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Signing in…
                </>
              ) : (
                "Sign in to dashboard"
              )}
            </button>

            <p className="text-center text-xs text-primary/50 mt-4">
              Demo:{" "}
              <span className="font-medium text-primary/70">
                admin@vedlibrary.app
              </span>{" "}
              / <span className="font-medium text-primary/70">admin123</span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <label className="text-xs font-medium text-primary/70 mb-1.5 block">
        {label}
      </label>
      <div className="flex items-center gap-2 bg-white border border-primary/10 rounded-2xl px-4 focus-within:ring-2 focus-within:ring-gold/40 focus-within:border-gold/40 transition">
        <Icon size={16} className="text-primary/40" />
        {children}
      </div>
    </div>
  );
}
