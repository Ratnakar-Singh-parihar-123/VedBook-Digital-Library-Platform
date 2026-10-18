import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  User,
  FolderTree,
  Calendar,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  File,
  CloudUpload,
  Info,
  Save,
  FileEdit,
  ExternalLink,
} from "lucide-react";

import useFetch from "../dashboard/hooks/useFetch";
import { formatDateTime } from "../dashboard/utils/format";
import { booksAPI, categoriesAPI } from "../../api/adminApi";

const MAX_PDF_MB = 50;
const CURRENT_YEAR = new Date().getFullYear();

export default function EditBook() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  /* ---------- Fetch book + categories ---------- */
  const {
    data: bookData,
    loading: loadingBook,
    error: fetchError,
  } = useFetch(
    () => (id ? booksAPI.getAdmin(id) : Promise.resolve({ data: null })),
    [id],
  );

  const book =
    bookData?.book ||
    bookData?.data ||
    (bookData && typeof bookData === "object" && !Array.isArray(bookData)
      ? bookData
      : null);

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await categoriesAPI.listPublic();
        const d = res?.data || {};
        const list =
          (Array.isArray(d.categories) && d.categories) ||
          (Array.isArray(d.data) && d.data) ||
          (Array.isArray(d) && d) ||
          [];
        if (!cancelled) setCategories(list);
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

  /* ---------- Form state ---------- */
  const [form, setForm] = useState({
    title: "",
    author: "",
    description: "",
    categoryId: "",
    publishedYear: "",
  });
  const [pdfFile, setPdfFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* Pre-fill form when book loads */
  useEffect(() => {
    if (!book) return;
    setForm({
      title: book.title || "",
      author: book.author || "",
      description: book.description || "",
      categoryId: String(book.category_id ?? book.categoryId ?? ""),
      publishedYear: String(book.published_year ?? book.publishedYear ?? ""),
    });
  }, [book]);

  const update = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (error) setError("");
  };

  /* ---------- PDF handling ---------- */
  const validatePdf = (file) => {
    if (!file) return "Please select a PDF file.";
    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) return "Only PDF files are allowed.";
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

  const clearNewFile = () => {
    setPdfFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ---------- Submit ---------- */
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
      if (pdfFile) fd.append("pdf", pdfFile);

      await booksAPI.update(id, fd);

      setSuccess("Book updated successfully!");
      setTimeout(() => navigate("/admin/books"), 1400);
    } catch (err) {
      setError(err?.message || "Could not update book. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Render states ---------- */
  if (loadingBook && !book) return <PageSkeleton />;

  if (fetchError || (!loadingBook && !book)) {
    return (
      <div className="max-w-3xl px-4 py-10 mx-auto sm:px-6">
        <div className="p-8 text-center border bg-cream border-primary/10 rounded-3xl shadow-soft">
          <div className="grid mx-auto mb-4 border border-red-200 w-14 h-14 rounded-2xl bg-red-50 place-items-center">
            <AlertCircle size={22} className="text-red-500" />
          </div>
          <h2 className="text-xl font-display text-primary">Book not found</h2>
          <p className="max-w-sm mx-auto mt-2 text-sm text-primary/60">
            {fetchError ||
              "This book may have been removed or the link is invalid."}
          </p>
          <Link
            to="/admin/books"
            className="mt-5 inline-flex items-center gap-2 bg-primary text-cream px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition shadow-soft"
          >
            <ArrowLeft size={14} /> Back to All Books
          </Link>
        </div>
      </div>
    );
  }

  const hasExistingPdf = Boolean(book?.pdf_path);

  return (
    <div className="max-w-4xl px-4 py-6 mx-auto sm:px-6 lg:px-8 sm:py-8">
      {/* ============ HEADER ============ */}
      <div className="mb-6">
        <Link
          to="/admin/books"
          className="inline-flex items-center gap-1.5 text-sm text-primary/60 hover:text-primary transition mb-4"
        >
          <ArrowLeft size={14} /> Back to All Books
        </Link>

        <div className="flex items-center gap-2.5">
          <span className="grid w-10 h-10 rounded-2xl bg-gold/25 place-items-center text-primary shrink-0">
            <FileEdit size={18} />
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl tracking-tight font-display sm:text-3xl text-primary">
              Edit Book
            </h1>
            <p className="text-sm truncate text-primary/60">
              Update details for{" "}
              <span className="font-medium text-primary">
                {book?.title || "this book"}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* ============ INFO ============ */}
      <div className="mb-5 flex items-start gap-2.5 bg-mint/60 border border-primary/10 rounded-2xl px-4 py-3">
        <Info size={15} className="shrink-0 mt-0.5 text-primary/60" />
        <p className="text-xs leading-relaxed text-primary/70">
          Editing keeps the book's current status. To publish or unpublish, use
          the toggle from the All Books page.
        </p>
      </div>

      {/* ============ EXISTING PDF INFO ============ */}
      {hasExistingPdf && (
        <div className="flex items-center gap-3 px-4 py-3 mb-5 border bg-white/60 border-primary/10 rounded-2xl">
          <span className="grid w-9 h-9 rounded-xl bg-primary place-items-center text-gold shrink-0">
            <File size={15} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate text-primary">
              Current PDF
            </p>
            <p className="text-[11px] text-primary/50 truncate mt-0.5">
              {book.pdf_path}
            </p>
          </div>
          {String(book.status).toLowerCase() === "published" && (
            <a
              href={booksAPI.readPdfUrl(book.id || book._id)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary px-2.5 py-2 bg-mint rounded-lg hover:bg-gold/30 transition shrink-0"
            >
              <ExternalLink size={12} /> View
            </a>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ============ BOOK DETAILS ============ */}
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
                  disabled={categoriesLoading}
                  className="w-full bg-transparent outline-none text-sm text-primary py-3.5 pr-6 appearance-none cursor-pointer disabled:cursor-not-allowed"
                >
                  <option value="">
                    {categoriesLoading
                      ? "Loading categories…"
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

        {/* ============ PDF UPLOAD ============ */}
        <section className="p-5 border bg-cream border-primary/10 rounded-3xl shadow-soft sm:p-6">
          <div className="flex items-baseline justify-between gap-3 mb-4">
            <h2 className="text-base font-display text-primary">Replace PDF</h2>
            <span className="text-[11px] text-primary/40">Optional</span>
          </div>

          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => !pdfFile && fileInputRef.current?.click()}
            className={`relative rounded-2xl border-2 border-dashed transition-all ${
              dragging
                ? "border-gold bg-gold/5"
                : pdfFile
                  ? "border-primary/20 bg-white/50"
                  : "border-primary/20 bg-white/30 hover:border-gold/50 hover:bg-mint/30 cursor-pointer"
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
                    {(pdfFile.size / 1024 / 1024).toFixed(2)} MB · new file
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearNewFile();
                  }}
                  aria-label="Remove new file"
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
                    ? "Drop new PDF here"
                    : "Upload new PDF or leave blank"}
                </p>
                <p className="mt-1 text-xs text-primary/50">
                  {hasExistingPdf
                    ? "Skip this to keep the current PDF"
                    : "PDF only · up to " + MAX_PDF_MB + " MB"}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ============ BOOK META ============ */}
        {book && (
          <div className="bg-white/50 border border-primary/10 rounded-2xl px-4 py-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-primary/50">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gold" />
              ID: {book.id || book._id}
            </span>
            {book.created_at && (
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                Created {formatDateTime(book.created_at || book.createdAt)}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 capitalize">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Status: {book.status || "draft"}
            </span>
          </div>
        )}

        {/* ============ MESSAGES ============ */}
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

        {/* ============ ACTIONS ============ */}
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
                <Loader2 size={15} className="animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save size={15} /> Save changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

/*  Field wrapper                                                      */

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

/*  Page skeleton                                                      */

function PageSkeleton() {
  return (
    <div className="max-w-4xl px-4 py-6 mx-auto space-y-6 sm:px-6 lg:px-8 sm:py-8">
      <div className="w-40 h-5 rounded bg-primary/10 animate-pulse" />
      <div className="w-64 h-10 rounded-xl bg-primary/10 animate-pulse" />
      <div className="p-6 space-y-4 border bg-cream border-primary/10 rounded-3xl">
        <div className="w-24 h-4 rounded bg-primary/10 animate-pulse" />
        <div className="h-12 rounded-2xl bg-primary/5 animate-pulse" />
        <div className="h-12 rounded-2xl bg-primary/5 animate-pulse" />
        <div className="h-24 rounded-2xl bg-primary/5 animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-12 rounded-2xl bg-primary/5 animate-pulse" />
          <div className="h-12 rounded-2xl bg-primary/5 animate-pulse" />
        </div>
      </div>
      <div className="p-6 border bg-cream border-primary/10 rounded-3xl">
        <div className="h-32 rounded-2xl bg-primary/5 animate-pulse" />
      </div>
    </div>
  );
}
