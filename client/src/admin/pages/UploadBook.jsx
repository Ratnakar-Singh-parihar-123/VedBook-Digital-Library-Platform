import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  User,
  FolderTree,
  Calendar,
  Upload,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  File,
  CloudUpload,
  Info,
} from "lucide-react";

import { booksAPI, categoriesAPI } from "../../api/adminApi";

const MAX_PDF_MB = 50;
const CURRENT_YEAR = new Date().getFullYear();

export default function UploadBook() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title: "",
    author: "",
    description: "",
    categoryId: "",
    publishedYear: "",
  });
  const [pdfFile, setPdfFile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch categories (graceful failure)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await categoriesAPI.list();
        const list =
          res?.data?.categories || res?.data?.data || res?.data || [];
        if (!cancelled) setCategories(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setCategories([]);
      } finally {
        if (!cancelled) setCategoriesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const update = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (error) setError("");
  };

  const validatePdf = (file) => {
    if (!file) return "Please select a PDF file.";
    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      return "Only PDF files are allowed.";
    }
    if (file.size > MAX_PDF_MB * 1024 * 1024) {
      return `PDF must be under ${MAX_PDF_MB} MB.`;
    }
    return "";
  };

  const handleFile = (file) => {
    const err = validatePdf(file);
    if (err) {
      setError(err);
      return;
    }
    setPdfFile(file);
    setError("");
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    setDragging(false);
  };

  const clearFile = () => {
    setPdfFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.title.trim()) {
      setError("Book title is required.");
      return;
    }
    if (form.title.trim().length > 255) {
      setError("Title must be under 255 characters.");
      return;
    }

    const pdfErr = validatePdf(pdfFile);
    if (pdfErr) {
      setError(pdfErr);
      return;
    }

    if (form.publishedYear !== "") {
      const y = Number(form.publishedYear);
      if (!Number.isInteger(y) || y < 1000 || y > CURRENT_YEAR) {
        setError(`Year must be between 1000 and ${CURRENT_YEAR}.`);
        return;
      }
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title.trim());
      fd.append("author", form.author.trim());
      fd.append("description", form.description.trim());
      if (form.categoryId) fd.append("categoryId", form.categoryId);
      if (form.publishedYear) fd.append("publishedYear", form.publishedYear);
      fd.append("pdf", pdfFile);

      await booksAPI.create(fd);

      setSuccess("Book uploaded as draft successfully!");
      setTimeout(() => navigate("/admin/books"), 1400);
    } catch (err) {
      setError(err?.message || "Could not upload book. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl px-4 py-6 mx-auto sm:px-6 lg:px-8 sm:py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/admin/books"
          className="inline-flex items-center gap-1.5 text-sm text-primary/60 hover:text-primary transition mb-4"
        >
          <ArrowLeft size={14} /> Back to All Books
        </Link>

        <div className="flex items-center gap-2.5">
          <span className="grid w-10 h-10 rounded-2xl bg-mint place-items-center text-primary shrink-0">
            <Upload size={18} />
          </span>
          <div>
            <h1 className="text-2xl tracking-tight font-display sm:text-3xl text-primary">
              Upload Book
            </h1>
            <p className="text-sm text-primary/60">
              Add a new book as draft — publish when ready
            </p>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="mb-5 flex items-start gap-2.5 bg-mint/60 border border-primary/10 rounded-2xl px-4 py-3">
        <Info size={15} className="shrink-0 mt-0.5 text-primary/60" />
        <p className="text-xs leading-relaxed text-primary/70">
          Uploaded books are saved as{" "}
          <span className="font-semibold text-primary">drafts</span>. You can
          publish them from the All Books page once reviewed.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Book details card */}
        <section className="p-5 space-y-4 border bg-cream border-primary/10 rounded-3xl shadow-soft sm:p-6">
          <h2 className="mb-1 text-base font-display text-primary">
            Book details
          </h2>

          <Field label="Title" required>
            <BookOpen size={16} className="text-primary/40 shrink-0" />
            <input
              type="text"
              value={form.title}
              onChange={update("title")}
              placeholder="e.g. Clean Code"
              maxLength={255}
              className="w-full bg-transparent outline-none text-sm text-primary placeholder:text-primary/40 py-3.5"
            />
          </Field>

          <Field label="Author">
            <User size={16} className="text-primary/40 shrink-0" />
            <input
              type="text"
              value={form.author}
              onChange={update("author")}
              placeholder="e.g. Robert C. Martin"
              className="w-full bg-transparent outline-none text-sm text-primary placeholder:text-primary/40 py-3.5"
            />
          </Field>

          <div>
            <label className="text-xs font-medium text-primary/70 mb-1.5 block">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={update("description")}
              placeholder="Short description of the book…"
              rows={4}
              className="w-full px-4 py-3 text-sm transition border outline-none resize-none bg-white/70 border-primary/10 rounded-2xl text-primary placeholder:text-primary/40 focus:ring-2 focus:ring-gold/40 focus:border-gold/40"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Category */}
            <div>
              <label className="text-xs font-medium text-primary/70 mb-1.5 block">
                Category
              </label>
              <div className="relative flex items-center gap-2.5 bg-white/70 border border-primary/10 rounded-2xl px-4 focus-within:ring-2 focus-within:ring-gold/40 focus-within:border-gold/40 transition">
                <FolderTree size={16} className="text-primary/40 shrink-0" />
                <select
                  value={form.categoryId}
                  onChange={update("categoryId")}
                  disabled={categoriesLoading || categories.length === 0}
                  className="w-full bg-transparent outline-none text-sm text-primary py-3.5 pr-6 appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">
                    {categoriesLoading
                      ? "Loading categories…"
                      : categories.length === 0
                        ? "No categories available"
                        : "Select a category (optional)"}
                  </option>
                  {categories.map((c) => (
                    <option key={c.id || c._id} value={c.id || c._id}>
                      {c.name}
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

            {/* Published year */}
            <Field label="Published year">
              <Calendar size={16} className="text-primary/40 shrink-0" />
              <input
                type="number"
                value={form.publishedYear}
                onChange={update("publishedYear")}
                placeholder={`e.g. ${CURRENT_YEAR - 5}`}
                min={1000}
                max={CURRENT_YEAR}
                className="w-full bg-transparent outline-none text-sm text-primary placeholder:text-primary/40 py-3.5"
              />
            </Field>
          </div>
        </section>

        {/* File upload card */}
        <section className="p-5 border bg-cream border-primary/10 rounded-3xl shadow-soft sm:p-6">
          <h2 className="mb-4 text-base font-display text-primary">
            PDF file <span className="text-gold">*</span>
          </h2>

          {/* Dropzone */}
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => !pdfFile && fileInputRef.current?.click()}
            className={`relative rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
              dragging
                ? "border-gold bg-gold/5"
                : pdfFile
                  ? "border-primary/20 bg-white/50 cursor-default"
                  : "border-primary/20 bg-white/30 hover:border-gold/50 hover:bg-mint/30"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
              className="hidden"
            />

            {pdfFile ? (
              <div className="flex items-center gap-4 p-5">
                <div className="grid w-12 h-12 rounded-xl bg-primary place-items-center text-gold shrink-0">
                  <File size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-primary">
                    {pdfFile.name}
                  </p>
                  <p className="text-xs text-primary/50 mt-0.5">
                    {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFile();
                  }}
                  aria-label="Remove file"
                  className="grid w-8 h-8 text-red-600 transition rounded-lg place-items-center bg-red-50 hover:bg-red-100 shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="p-8 text-center sm:p-10">
                <div className="grid mx-auto mb-3 w-14 h-14 rounded-2xl bg-mint place-items-center">
                  <CloudUpload size={22} className="text-primary/70" />
                </div>
                <p className="text-sm font-medium text-primary">
                  {dragging
                    ? "Drop your PDF here"
                    : "Click to upload or drag & drop"}
                </p>
                <p className="mt-1 text-xs text-primary/50">
                  PDF only · up to {MAX_PDF_MB} MB
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Messages */}
        {error && (
          <div className="flex items-start gap-2 px-4 py-3 text-sm text-red-600 border border-red-200 bg-red-50 rounded-2xl">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-start gap-2 px-4 py-3 text-sm border bg-mint border-primary/10 text-primary rounded-2xl">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-gold" />
            <span>{success}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
          <Link
            to="/admin/books"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium transition border bg-cream border-primary/15 text-primary rounded-2xl hover:bg-mint"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 bg-primary text-cream px-6 py-3 rounded-2xl text-sm font-medium hover:bg-primary/90 active:scale-[0.98] transition shadow-soft disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Uploading…
              </>
            ) : (
              <>
                <Upload size={15} /> Upload Book
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="text-xs font-medium text-primary/70 mb-1.5 block">
        {label} {required && <span className="text-gold">*</span>}
      </label>
      <div className="flex items-center gap-2.5 bg-white/70 border border-primary/10 rounded-2xl px-4 focus-within:ring-2 focus-within:ring-gold/40 focus-within:border-gold/40 transition">
        {children}
      </div>
    </div>
  );
}
