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
    <div className="flex min-h-screen bg-cream">
      {/* Left: branding */}
      <div className="relative flex-col justify-between hidden w-1/2 p-12 overflow-hidden lg:flex bg-primary">
        <div className="absolute rounded-full -top-24 -right-24 w-80 h-80 bg-gold/20 blur-3xl" />
        <div className="absolute rounded-full -bottom-24 -left-24 w-80 h-80 bg-mint/20 blur-3xl" />

        <Link to="/" className="relative flex items-center gap-3 w-fit">
          <div className="grid text-xl font-bold w-11 h-11 rounded-2xl bg-gold text-primary place-items-center font-display">
            V
          </div>
          <div>
            <p className="text-xl leading-none font-display text-cream">
              Ved Library
            </p>
            <p className="text-[10px] text-cream/50 uppercase tracking-widest">
              Admin Console
            </p>
          </div>
        </Link>

        <div className="relative max-w-md">
          <ShieldCheck size={36} className="text-gold" />
          <h1 className="mt-5 text-4xl leading-tight font-display text-cream">
            Manage your entire digital library.
          </h1>
          <p className="mt-4 text-cream/60">
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
      <div className="flex items-center justify-center flex-1 p-6">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="inline-flex items-center gap-2 mb-8 text-sm transition text-primary/60 hover:text-primary"
          >
            <ArrowLeft size={14} /> Back to home
          </Link>

          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="grid text-xl font-bold w-11 h-11 rounded-2xl bg-primary text-gold place-items-center font-display">
              V
            </div>
            <div>
              <p className="text-lg leading-none font-display text-primary">
                Ved Library
              </p>
              <p className="text-[10px] text-primary/50 uppercase tracking-widest">
                Admin Console
              </p>
            </div>
          </div>

          <h2 className="text-3xl font-display text-primary">Welcome back</h2>
          <p className="mt-2 text-primary/60">
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
                className="p-1 transition text-primary/40 hover:text-primary"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </Field>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-primary/60">
                <input type="checkbox" className="accent-primary" /> Remember me
              </label>
              <a href="#" className="font-medium text-gold hover:underline">
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

            <p className="mt-4 text-xs text-center text-primary/50">
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
      <div className="flex items-center gap-2 px-4 transition bg-white border border-primary/10 rounded-2xl focus-within:ring-2 focus-within:ring-gold/40 focus-within:border-gold/40">
        <Icon size={16} className="text-primary/40" />
        {children}
      </div>
    </div>
  );
}
