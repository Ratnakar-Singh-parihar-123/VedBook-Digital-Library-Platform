import { useState } from "react";
import {
  Mail,
  MessageSquare,
  MapPin,
  Send,
  CheckCircle2,
  User,
  HelpCircle,
  ChevronDown,
  Clock,
  Headphones,
  AlertCircle,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */
const CONTACT_CARDS = [
  {
    icon: Mail,
    title: "Email us",
    value: "hello@vedbook.app",
    hint: "We reply within 24 hours",
    tone: "bg-primary",
    accent: "text-gold",
  },
  {
    icon: Headphones,
    title: "Support",
    value: "support@vedbook.app",
    hint: "Mon–Sat, 10am–7pm IST",
    tone: "bg-gold",
    accent: "text-primary",
  },
  {
    icon: MapPin,
    title: "Studio",
    value: "Bengaluru, India",
    hint: "Remote-first team",
    tone: "bg-mint",
    accent: "text-primary",
  },
];

const FAQS = [
  {
    q: "Is VedBook free to use?",
    a: "Yes — the core library is completely free. Premium courses and a few exclusive titles may be added later, but free access will always remain.",
  },
  {
    q: "Can I download books for offline reading?",
    a: "Yes. Titles marked as downloadable can be saved to your device from the book details page.",
  },
  {
    q: "How do I contribute my own notes?",
    a: "Sign in, go to the Contribute section, and submit your notes. Our team reviews every submission before it goes live.",
  },
  {
    q: "Do you support Hindi content?",
    a: "Absolutely. Our catalogue is bilingual by design — you can filter by Hindi or English anywhere.",
  },
  {
    q: "I found a copyright issue. What do I do?",
    a: "Please email support@vedbook.app with the details. We take licensing very seriously and act on valid reports within 48 hours.",
  },
];

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setSending(true);
    // 🔧 Wire to real API later
    setTimeout(() => {
      setSending(false);
      setSent(true);
      setForm({ name: "", email: "", subject: "", message: "" });
      setTimeout(() => setSent(false), 4000);
    }, 800);
  };

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="min-h-screen bg-cream">
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden border-b border-primary/10">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-gold/15 blur-3xl" />
        <div className="absolute top-20 -left-24 w-72 h-72 rounded-full bg-mint blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-5 py-14 md:py-20 text-center">
          {/* <nav aria-label="Breadcrumb" className="text-xs text-primary/50 mb-6">
            <ol className="flex items-center justify-center gap-1.5">
              <li>
                <Link to="/" className="hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li aria-hidden="true" className="text-primary/30">
                /
              </li>
              <li className="text-primary font-medium">Contact</li>
            </ol>
          </nav> */}

          <span className="inline-flex items-center gap-2 bg-mint text-primary text-xs font-medium px-3 py-1.5 rounded-full border border-primary/5">
            <MessageSquare size={12} className="text-gold" />
            We read every message
          </span>

          <h1 className="font-display text-3xl md:text-5xl text-primary mt-5 tracking-tight">
            Let's <span className="text-gold">talk.</span>
          </h1>

          <p className="text-primary/60 mt-4 max-w-xl mx-auto text-sm md:text-base">
            Questions, feedback, feature ideas, or just want to say hi? Drop us
            a line — we usually reply within a day.
          </p>
        </div>
      </section>

      {/* ================= CONTACT CARDS ================= */}
      <section className="max-w-7xl mx-auto px-5 -mt-6 md:-mt-8 relative z-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CONTACT_CARDS.map(
            ({ icon: Icon, title, value, hint, tone, accent }) => (
              <div
                key={title}
                className="bg-white border border-primary/10 rounded-3xl p-5 hover:shadow-soft transition-shadow flex items-start gap-4"
              >
                <div
                  className={`w-11 h-11 rounded-2xl ${tone} grid place-items-center shrink-0`}
                >
                  <Icon size={18} className={accent} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-primary/40 font-medium">
                    {title}
                  </p>
                  <p className="font-display text-base text-primary mt-1 truncate">
                    {value}
                  </p>
                  <p className="text-xs text-primary/50 mt-1">{hint}</p>
                </div>
              </div>
            ),
          )}
        </div>
      </section>

      {/* ================= FORM + INFO ================= */}
      <section className="max-w-7xl mx-auto px-5 py-12 md:py-16 grid lg:grid-cols-[1fr_400px] gap-8 lg:gap-12">
        {/* Form */}
        <div className="bg-white border border-primary/10 rounded-3xl p-6 md:p-8">
          <h2 className="font-display text-2xl text-primary">
            Send us a message
          </h2>
          <p className="text-sm text-primary/60 mt-2">
            Fill in the form below and we'll get back to you soon.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Your name" required>
                <User size={15} className="text-primary/40 shrink-0" />
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={update("name")}
                  placeholder="Aarav Sharma"
                  className="w-full bg-transparent outline-none text-sm text-primary placeholder:text-primary/40 py-3"
                />
              </Field>

              <Field label="Email address" required>
                <Mail size={15} className="text-primary/40 shrink-0" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={update("email")}
                  placeholder="you@example.com"
                  className="w-full bg-transparent outline-none text-sm text-primary placeholder:text-primary/40 py-3"
                />
              </Field>
            </div>

            <Field label="Subject">
              <MessageSquare size={15} className="text-primary/40 shrink-0" />
              <input
                type="text"
                value={form.subject}
                onChange={update("subject")}
                placeholder="What is this about?"
                className="w-full bg-transparent outline-none text-sm text-primary placeholder:text-primary/40 py-3"
              />
            </Field>

            <div>
              <label className="text-xs font-medium text-primary/70 mb-1.5 block">
                Message <span className="text-gold">*</span>
              </label>
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={update("message")}
                placeholder="Tell us how we can help…"
                className="w-full bg-white border border-primary/10 rounded-2xl px-4 py-3 text-sm text-primary placeholder:text-primary/40 outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/40 transition resize-none"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <p className="text-[11px] text-primary/40 flex items-center gap-1.5">
                <Clock size={12} />
                Typical reply within 24 hours
              </p>
              <button
                type="submit"
                disabled={sending}
                className="inline-flex items-center gap-2 bg-primary text-cream px-6 py-3 rounded-2xl text-sm font-medium hover:bg-primary/90 active:scale-[0.98] transition shadow-soft disabled:opacity-70"
              >
                {sending ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-cream/40 border-t-cream animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send size={14} /> Send message
                  </>
                )}
              </button>
            </div>

            {/* Success state */}
            {sent && (
              <div className="flex items-center gap-2 bg-mint text-primary text-sm rounded-2xl px-4 py-3 mt-2">
                <CheckCircle2 size={16} className="text-gold shrink-0" />
                Message sent! We'll get back to you shortly.
              </div>
            )}
          </form>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          {/* Response promise */}
          <div className="relative overflow-hidden rounded-3xl bg-primary p-6">
            <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-gold/25 blur-2xl" />
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gold text-primary grid place-items-center">
                <Headphones size={17} />
              </div>
              <h3 className="font-display text-lg text-cream mt-4">
                Real humans, quick replies.
              </h3>
              <p className="text-cream/70 text-sm mt-2 leading-relaxed">
                No bots, no ticket queues. Our small team reads every message
                personally and gets back to you within a day.
              </p>

              <div className="mt-5 pt-4 border-t border-cream/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-cream/60">Support hours</span>
                  <span className="text-cream font-medium">
                    Mon–Sat, 10am–7pm
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-cream/60">Avg. response</span>
                  <span className="text-cream font-medium">&lt; 24 hours</span>
                </div>
              </div>
            </div>
          </div>

          {/* Copyright / takedown note */}
          <div className="bg-white border border-primary/10 rounded-3xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-mint grid place-items-center shrink-0">
                <AlertCircle size={15} className="text-primary" />
              </div>
              <div>
                <h3 className="font-display text-sm text-primary">
                  Copyright & takedowns
                </h3>
                <p className="text-xs text-primary/60 mt-1 leading-relaxed">
                  If you believe content on VedBook infringes your rights, email
                  us and we'll act within 48 hours.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </section>

      {/* ================= FAQ ================= */}
      <section className="bg-white border-t border-primary/10">
        <div className="max-w-4xl mx-auto px-5 py-16 md:py-20">
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-gold font-medium">
              <HelpCircle size={12} /> FAQ
            </span>
            <h2 className="font-display text-3xl md:text-4xl text-primary mt-3">
              Answers to common questions.
            </h2>
            <p className="text-primary/60 mt-3 text-sm md:text-base">
              Still can't find what you're looking for? Drop us a message above.
            </p>
          </div>

          <div className="mt-10 space-y-3">
            {FAQS.map(({ q, a }, i) => {
              const open = openFaq === i;
              return (
                <div
                  key={q}
                  className="bg-cream border border-primary/10 rounded-2xl overflow-hidden transition-shadow hover:shadow-soft"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? -1 : i)}
                    aria-expanded={open}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="font-display text-base text-primary">
                      {q}
                    </span>
                    <ChevronDown
                      size={18}
                      className={`text-primary/50 shrink-0 transition-transform duration-300 ${
                        open ? "rotate-180 text-gold" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`grid transition-all duration-300 ease-out ${
                      open
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-5 pb-4 text-sm text-primary/70 leading-relaxed">
                        {a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Field helper                                                       */
/* ------------------------------------------------------------------ */
function Field({ label, required, children }) {
  return (
    <div>
      <label className="text-xs font-medium text-primary/70 mb-1.5 block">
        {label} {required && <span className="text-gold">*</span>}
      </label>
      <div className="flex items-center gap-2.5 bg-white border border-primary/10 rounded-2xl px-4 focus-within:ring-2 focus-within:ring-gold/40 focus-within:border-gold/40 transition">
        {children}
      </div>
    </div>
  );
}
