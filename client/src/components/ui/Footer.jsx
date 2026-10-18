import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Send, ArrowUpRight, Sparkles } from "lucide-react";
import {
  FaFacebookF,
  FaGithub,
  FaInstagram,
  FaYoutube,
  FaLinkedin,
  FaTwitter,
} from "react-icons/fa";

/*  Brand logo — same file as Navbar                                   */

const LOGO_SRC = "/mainLogo.png";

/* Social icon map */
const SOCIAL_ICONS = {
  twitter: FaTwitter,
  instagram: FaInstagram,
  youtube: FaYoutube,
  linkedin: FaLinkedin,
  github: FaGithub,
  facebook: FaFacebookF,
  email: Mail,
};

const quickLinks = [
  { label: "Home", to: "/" },
  { label: "Explore Books", to: "/explore" },
  { label: "Categories", to: "/categories" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

const usefulLinks = [
  { label: "Privacy Policy", to: "/privacy" },
  { label: "Terms and Conditions", to: "/terms" },
  { label: "Help Center", to: "/help" },
  { label: "Report Issue", to: "/report" },
];

/*  Brand — logo + wordmark                                            */

function Brand() {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-3 group"
      aria-label="VedBook — Home"
    >
      <div className="relative grid overflow-hidden w-11 h-11 rounded-2xl bg-primary place-items-center ring-1 ring-primary/10 shrink-0">
        <img
          src={LOGO_SRC}
          alt="VedBook logo"
          className="object-contain w-full h-full"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            e.currentTarget.nextSibling.style.display = "grid";
          }}
        />
        <span className="absolute inset-0 hidden text-lg font-bold place-items-center font-display text-gold">
          V
        </span>
        <span className="absolute w-6 h-6 transition-opacity rounded-full opacity-0 pointer-events-none -top-2 -right-2 bg-gold/40 blur-md group-hover:opacity-100" />
      </div>
      <div className="leading-none">
        <p className="text-lg font-bold font-display text-primary">VedBook</p>
        <p className="text-[11px] text-secondary uppercase tracking-[0.2em] mt-1 font-medium">
          Digital Library
        </p>
      </div>
    </Link>
  );
}

/*  Footer                                                             */

export default function Footer({ socials = [] }) {
  const year = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    // 🔧 Wire to real newsletter API later
    setSent(true);
    setEmail("");
    setTimeout(() => setSent(false), 2500);
  };

  return (
    <footer className="relative mt-16 overflow-hidden border-t border-border bg-cream">
      {/* Decorative blurs */}
      <div className="absolute rounded-full pointer-events-none -top-24 -left-24 w-72 h-72 bg-gold/15 blur-3xl" />
      <div className="absolute rounded-full pointer-events-none -bottom-24 -right-24 w-72 h-72 bg-mint blur-3xl" />

      <div className="relative grid gap-10 px-5 py-12 mx-auto max-w-7xl md:py-16 md:gap-8 md:grid-cols-2 lg:grid-cols-12">
        {/* ============ Brand + description + socials ============ */}
        <div className="max-w-md lg:col-span-5">
          <Brand />

          <p className="mt-5 text-sm font-normal leading-relaxed text-secondary">
            Books, e-books, PDFs, study notes, and courses — all in one
            beautifully simple platform. Read in{" "}
            <span className="font-semibold text-primary">Hindi</span> or{" "}
            <span className="font-semibold text-primary">English</span>,
            anytime, anywhere.
          </p>

          {socials.length > 0 && (
            <ul
              className="flex items-center gap-2 mt-6"
              aria-label="Social media"
            >
              {socials.map(({ type, href, label }) => {
                const Icon = SOCIAL_ICONS[type];
                if (!Icon || !href) return null;
                return (
                  <li key={type}>
                    <a
                      href={href}
                      aria-label={label || type}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="grid w-10 h-10 transition bg-white border rounded-xl border-border place-items-center text-secondary hover:bg-primary hover:text-gold hover:border-primary"
                    >
                      <Icon size={15} />
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ============ Quick links ============ */}
        <nav aria-labelledby="footer-quick" className="lg:col-span-2">
          <h2
            id="footer-quick"
            className="text-base font-bold font-display text-primary"
          >
            Quick Links
          </h2>
          <ul className="mt-4 space-y-3">
            {quickLinks.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="group inline-flex items-center gap-1.5 text-sm text-secondary hover:text-primary transition-colors font-medium"
                >
                  <span className="w-0 h-px transition-all duration-200 group-hover:w-2 bg-gold" />
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* ============ Useful links ============ */}
        <nav aria-labelledby="footer-useful" className="lg:col-span-2">
          <h2
            id="footer-useful"
            className="text-base font-bold font-display text-primary"
          >
            Useful Links
          </h2>
          <ul className="mt-4 space-y-3">
            {usefulLinks.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="group inline-flex items-center gap-1.5 text-sm text-secondary hover:text-primary transition-colors font-medium"
                >
                  <span className="w-0 h-px transition-all duration-200 group-hover:w-2 bg-gold" />
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* ============ Newsletter ============ */}
        <div className="lg:col-span-3">
          <h2 className="text-base font-bold font-display text-primary">
            Stay in the loop
          </h2>
          <p className="mt-3 text-sm text-secondary">
            New books, notes, and course drops — straight to your inbox.
          </p>

          <form onSubmit={handleSubscribe} className="mt-4">
            <div className="flex items-center gap-2 px-3 transition bg-white border border-border rounded-2xl focus-within:ring-2 focus-within:ring-gold focus-within:border-gold">
              <Mail size={16} className="text-muted shrink-0" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-label="Email for newsletter"
                className="w-full py-3 text-sm bg-transparent outline-none text-charcoal placeholder:text-muted"
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className="w-9 h-9 rounded-xl bg-primary text-cream grid place-items-center hover:bg-primary-light active:scale-[0.96] transition shrink-0"
              >
                <Send size={14} />
              </button>
            </div>

            <p
              className={`text-xs mt-2 transition-colors ${
                sent ? "text-primary font-semibold" : "text-muted"
              }`}
            >
              {sent
                ? "✓ Subscribed — welcome aboard!"
                : "No spam. Unsubscribe anytime."}
            </p>
          </form>

          {/* Small highlight card */}
          <div className="relative p-4 mt-5 overflow-hidden border rounded-2xl bg-primary border-primary-light/40 shadow-soft">
            <div className="absolute w-20 h-20 rounded-full -top-6 -right-6 bg-gold/20 blur-2xl" />
            <div className="relative flex items-center gap-3">
              <div className="grid text-white w-9 h-9 rounded-xl bg-gold place-items-center shrink-0">
                <Sparkles size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold leading-tight text-white">
                  10,000+ titles
                </p>
                <p className="text-white/80 text-[11px] mt-0.5">
                  Hindi & English
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============ Bottom bar ============ */}
      <div className="relative border-t border-border">
        <div className="flex flex-col gap-3 px-5 py-5 mx-auto text-xs max-w-7xl sm:flex-row sm:items-center sm:justify-between text-secondary">
          <p>© {year} VedBook. All rights reserved.</p>

          <div className="flex items-center gap-4">
            <Link
              to="/privacy"
              className="font-medium transition-colors text-secondary hover:text-primary"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="font-medium transition-colors text-secondary hover:text-primary"
            >
              Terms
            </Link>
            <span className="inline-flex items-center gap-1 text-muted">
              Made with <span className="text-gold">❤</span> for ratnakar
            </span>
            <Link
              to="/"
              className="inline-flex items-center gap-1 font-medium transition-colors text-secondary hover:text-primary"
              aria-label="Back to top"
            >
              Top <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
