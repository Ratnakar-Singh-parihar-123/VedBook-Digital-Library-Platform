import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Download,
  QrCode,
  ShieldCheck,
  Zap,
  BookOpen,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function DownloadApp() {
  const [downloadStarted, setDownloadStarted] = useState(false);

  const handleDownload = () => {
    setDownloadStarted(true);
    setTimeout(() => setDownloadStarted(false), 4000);
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden border-b border-primary/10 py-16 md:py-24">
        <div className="absolute rounded-full -top-32 -right-32 w-96 h-96 bg-gold/15 blur-3xl pointer-events-none" />
        <div className="absolute rounded-full top-20 -left-24 w-72 h-72 bg-mint blur-3xl pointer-events-none" />

        <div className="relative px-5 mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 bg-mint text-primary text-xs font-semibold px-3 py-1.5 rounded-full border border-primary/10">
                <Sparkles size={12} className="text-gold" />
                Mobile Experience
              </span>

              <h1 className="mt-4 text-4xl sm:text-5xl font-display text-primary tracking-tight leading-tight">
                Read ancient wisdom <br />
                <span className="text-gold">anywhere, anytime.</span>
              </h1>

              <p className="mt-4 text-base sm:text-lg text-primary/70 leading-relaxed max-w-lg">
                Download the official VedBook mobile application. Access your entire library, enjoy offline reading, personalized bookmarks, and high-performance PDF rendering on your smartphone.
              </p>

              <div className="mt-8 flex flex-wrap gap-4 items-center">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2.5 bg-primary text-cream px-6 py-3.5 rounded-2xl text-sm font-semibold hover:bg-primary/90 transition shadow-soft hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Download size={16} />
                  Download APK (v1.0.4)
                </button>

                <a
                  href="#qr-code"
                  className="inline-flex items-center gap-2 bg-white border border-primary/15 text-primary px-5 py-3.5 rounded-2xl text-sm font-medium hover:bg-mint transition"
                >
                  <QrCode size={16} />
                  Scan to Install
                </a>
              </div>

              {downloadStarted && (
                <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span>Download started! The official Android package will be saved to your device.</span>
                </div>
              )}

              <div className="mt-8 grid grid-cols-3 gap-4 border-t border-primary/10 pt-6">
                <div>
                  <p className="font-display text-xl text-primary font-bold">100% Free</p>
                  <p className="text-xs text-primary/60 mt-0.5">No subscription required</p>
                </div>
                <div>
                  <p className="font-display text-xl text-primary font-bold">12 MB</p>
                  <p className="text-xs text-primary/60 mt-0.5">Ultra lightweight build</p>
                </div>
                <div>
                  <p className="font-display text-xl text-primary font-bold">Android 8.0+</p>
                  <p className="text-xs text-primary/60 mt-0.5">Broad compatibility</p>
                </div>
              </div>
            </div>

            {/* Mockup Preview Card */}
            <div id="qr-code" className="flex justify-center">
              <div className="relative w-full max-w-sm rounded-3xl bg-white/70 border border-primary/10 p-6 sm:p-8 shadow-soft backdrop-blur-sm">
                <div className="absolute -top-3 -right-3 bg-gold text-primary text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                  Official App
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary grid place-items-center text-gold font-display text-2xl font-bold shadow-soft">
                    V
                  </div>
                  <div>
                    <h3 className="font-display text-lg text-primary font-bold">VedBook Mobile</h3>
                    <p className="text-xs text-primary/60">Digital Vedic & Classical Library</p>
                  </div>
                </div>

                <div className="mt-6 p-6 rounded-2xl bg-cream border border-primary/10 text-center flex flex-col items-center">
                  <div className="w-36 h-36 bg-white rounded-xl p-2 border border-primary/10 grid place-items-center shadow-inner">
                    <QrCode size={120} className="text-primary" />
                  </div>
                  <p className="text-xs font-medium text-primary mt-3">Scan with phone camera</p>
                  <p className="text-[11px] text-primary/50 mt-0.5">Instant direct installation link</p>
                </div>

                <ul className="mt-6 space-y-2.5 text-xs text-primary/80">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-gold shrink-0" />
                    <span>Download books for full offline reading</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-gold shrink-0" />
                    <span>Eye-friendly sepia and dark night reading modes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-gold shrink-0" />
                    <span>Instant page bookmarking & progress tracking</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="py-16 md:py-20 px-5 mx-auto max-w-6xl">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-primary/50">Why Mobile</span>
          <h2 className="mt-2 text-3xl font-display text-primary">Engineered for distraction-free reading</h2>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Zap,
              title: "Lightning Fast Engine",
              desc: "Instant startup and rapid PDF vector rendering with zero lag even on large manuscripts.",
            },
            {
              icon: BookOpen,
              title: "Offline Bookshelf",
              desc: "Save your favorite texts directly to local storage to read comfortably on trains or flights.",
            },
            {
              icon: ShieldCheck,
              title: "Privacy First",
              desc: "No third-party trackers, no intrusive advertisements, and complete privacy for all your reading.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="p-6 rounded-2xl bg-white/60 border border-primary/10 hover:border-gold/40 hover:bg-white transition"
            >
              <div className="w-10 h-10 rounded-xl bg-mint grid place-items-center text-primary">
                <item.icon size={18} />
              </div>
              <h3 className="mt-4 font-display text-lg text-primary font-semibold">{item.title}</h3>
              <p className="mt-2 text-xs sm:text-sm text-primary/70 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-gold transition"
          >
            Or continue reading on the web library <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </div>
  );
}
