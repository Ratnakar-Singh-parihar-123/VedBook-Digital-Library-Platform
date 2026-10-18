import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  FileText,
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

export default function PolicyAndHelp({ section = "privacy" }) {
  const [activeTab, setActiveTab] = useState(section);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [reportData, setReportData] = useState({
    name: "",
    email: "",
    subject: "",
    details: "",
  });

  const handleReportSubmit = (e) => {
    e.preventDefault();
    setReportSubmitted(true);
    setTimeout(() => {
      setReportSubmitted(false);
      setReportData({ name: "", email: "", subject: "", details: "" });
    }, 4000);
  };

  return (
    <div className="min-h-screen py-12 bg-cream md:py-16">
      <div className="max-w-5xl px-5 mx-auto">
        {/* Breadcrumb Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3 text-xs text-primary/50">
            <Link to="/" className="transition hover:text-primary">
              Home
            </Link>
            <ChevronRight size={12} />
            <span className="font-medium capitalize text-primary">
              {activeTab}
            </span>
          </div>

          <h1 className="text-3xl font-bold sm:text-4xl font-display text-primary">
            {activeTab === "privacy" && "Privacy Policy"}
            {activeTab === "terms" && "Terms and Conditions"}
            {activeTab === "help" && "Help & Support Center"}
            {activeTab === "report" && "Report an Issue or Book"}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-primary/60">
            Last updated: October 2026 • VedBook Digital Library
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap items-center gap-2 pb-4 mb-8 border-b border-primary/10">
          {[
            { id: "privacy", label: "Privacy Policy", icon: Shield },
            { id: "terms", label: "Terms of Service", icon: FileText },
            { id: "help", label: "Help Center", icon: HelpCircle },
            { id: "report", label: "Report Issue", icon: AlertTriangle },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                activeTab === id
                  ? "bg-primary text-cream shadow-sm"
                  : "bg-white/60 text-primary/70 hover:bg-white hover:text-primary border border-primary/5"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* Content Box */}
        <div className="p-6 border bg-white/70 border-primary/10 rounded-3xl sm:p-10 shadow-soft backdrop-blur-sm">
          {/* ================= PRIVACY POLICY ================= */}
          {activeTab === "privacy" && (
            <div className="space-y-6 text-sm leading-relaxed text-primary/80">
              <section>
                <h2 className="mb-2 text-lg font-bold font-display text-primary">
                  1. Information We Collect
                </h2>
                <p>
                  VedBook is committed to protecting your personal privacy. We
                  do not require account registration to read our publicly
                  available classical texts and documents. When you browse the
                  website, we collect minimal technical telemetry (such as
                  browser type and anonymized reading events) exclusively to
                  improve reading performance and maintain platform stability.
                </p>
              </section>

              <section>
                <h2 className="mb-2 text-lg font-bold font-display text-primary">
                  2. Cookies and Local Storage
                </h2>
                <p>
                  We use browser local storage solely to remember your reading
                  preferences (e.g. current page numbers, theme settings, and
                  reader zoom level). We do not store third-party advertising
                  cookies or cross-site tracking beacons.
                </p>
              </section>

              <section>
                <h2 className="mb-2 text-lg font-bold font-display text-primary">
                  3. Contact & Support Communications
                </h2>
                <p>
                  When you submit messages via our contact form or feedback
                  system, your name and email address are used strictly to reply
                  to your inquiry. We never sell, rent, or distribute your email
                  address to external entities.
                </p>
              </section>
            </div>
          )}

          {/* ================= TERMS OF SERVICE ================= */}
          {activeTab === "terms" && (
            <div className="space-y-6 text-sm leading-relaxed text-primary/80">
              <section>
                <h2 className="mb-2 text-lg font-bold font-display text-primary">
                  1. Acceptance of Terms
                </h2>
                <p>
                  By accessing or utilizing the VedBook Digital Library web and
                  mobile applications, you agree to abide by these terms of use.
                  The platform is dedicated to educational, cultural, and
                  spiritual research purposes.
                </p>
              </section>

              <section>
                <h2 className="mb-2 text-lg font-bold font-display text-primary">
                  2. Intellectual Property & Fair Use
                </h2>
                <p>
                  The ancient and classical texts hosted in our archive are
                  believed to reside in the public domain or are distributed
                  under educational open-access licenses. If you believe any
                  material infringes upon valid copyright, please use our Report
                  tab to submit a notice with relevant ownership documentation.
                </p>
              </section>

              <section>
                <h2 className="mb-2 text-lg font-bold font-display text-primary">
                  3. Prohibited Conduct
                </h2>
                <p>
                  Users may not attempt automated denial-of-service attacks,
                  scrape the platform aggressively without authorization, or
                  inject malicious scripts into review or contact submission
                  endpoints.
                </p>
              </section>
            </div>
          )}

          {/* ================= HELP CENTER ================= */}
          {activeTab === "help" && (
            <div className="space-y-6 text-sm leading-relaxed text-primary/80">
              <section>
                <h2 className="mb-2 text-lg font-bold font-display text-primary">
                  Frequently Asked Questions
                </h2>

                <div className="mt-4 space-y-4">
                  <div className="p-4 border rounded-2xl bg-cream/70 border-primary/5">
                    <h3 className="font-semibold text-primary">
                      How do I read a book in the browser?
                    </h3>
                    <p className="mt-1 text-xs text-primary/70">
                      Navigate to the Explore Books or Categories page, click on
                      any book card, and click the "Read Book" or reader button.
                      You can navigate pages using your arrow keys or the
                      on-screen toolbar.
                    </p>
                  </div>

                  <div className="p-4 border rounded-2xl bg-cream/70 border-primary/5">
                    <h3 className="font-semibold text-primary">
                      Can I download books for offline study?
                    </h3>
                    <p className="mt-1 text-xs text-primary/70">
                      Yes! You can download books using our official mobile
                      application, or click the download option on supported
                      titles in the web reader.
                    </p>
                  </div>

                  <div className="p-4 border rounded-2xl bg-cream/70 border-primary/5">
                    <h3 className="font-semibold text-primary">
                      Where can I suggest a new manuscript or title?
                    </h3>
                    <p className="mt-1 text-xs text-primary/70">
                      Please send your suggestions directly to us through our{" "}
                      <Link
                        to="/contact"
                        className="font-semibold text-gold hover:underline"
                      >
                        Contact Page
                      </Link>
                      . We review all literature contributions regularly.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ================= REPORT ISSUE ================= */}
          {activeTab === "report" && (
            <div>
              <p className="mb-6 text-sm text-primary/70">
                Encountered a broken PDF, inaccurate book metadata, or a
                technical glitch? Let our curation team know and we will resolve
                it promptly.
              </p>

              {reportSubmitted ? (
                <div className="flex items-center gap-3 p-5 border rounded-2xl bg-emerald-50 border-emerald-200 text-emerald-800">
                  <CheckCircle2
                    size={20}
                    className="text-emerald-600 shrink-0"
                  />
                  <div>
                    <h4 className="text-sm font-semibold">Report received</h4>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Thank you for helping keep the library clean and accurate.
                      Our admins have logged this issue.
                    </p>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleReportSubmit}
                  className="max-w-lg space-y-4"
                >
                  <div>
                    <label className="block mb-1 text-xs font-semibold text-primary/80">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      value={reportData.name}
                      onChange={(e) =>
                        setReportData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-primary/15 bg-cream/50 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
                      placeholder="e.g. Rahul Sharma"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-xs font-semibold text-primary/80">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={reportData.email}
                      onChange={(e) =>
                        setReportData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-primary/15 bg-cream/50 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
                      placeholder="you@example.com"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-xs font-semibold text-primary/80">
                      Issue Subject / Book Title
                    </label>
                    <input
                      type="text"
                      required
                      value={reportData.subject}
                      onChange={(e) =>
                        setReportData((prev) => ({
                          ...prev,
                          subject: e.target.value,
                        }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-primary/15 bg-cream/50 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
                      placeholder="e.g. Page 14 is corrupted in Rigveda Vol 1"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-xs font-semibold text-primary/80">
                      Detailed Description
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={reportData.details}
                      onChange={(e) =>
                        setReportData((prev) => ({
                          ...prev,
                          details: e.target.value,
                        }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-primary/15 bg-cream/50 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
                      placeholder="Describe what happened or what needs correction..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold transition bg-primary text-cream rounded-2xl hover:bg-primary/90 shadow-soft"
                  >
                    Submit Report
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
