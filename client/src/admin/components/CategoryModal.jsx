import { useEffect, useRef, useState } from "react";
import {
  X,
  FolderTree,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { categoriesAPI } from "../../api/adminApi";

export default function CategoryModal({ open, category, onClose, onSuccess }) {
  const isEdit = Boolean(category);
  const inputRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /* Fill form when modal opens */
  useEffect(() => {
    if (!open) return;
    if (isEdit) {
      setForm({
        name: category.name || "",
        description: category.description || "",
      });
    } else {
      setForm({ name: "", description: "" });
    }
    setError("");
    setTimeout(() => inputRef.current?.focus(), 60);
  }, [open, category, isEdit]);

  /* Escape closes */
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && !saving && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, saving, onClose]);

  /* Body scroll lock */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Category name is required.");
      return;
    }
    if (form.name.trim().length > 100) {
      setError("Name must be under 100 characters.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
      };

      if (isEdit) {
        await categoriesAPI.update(category.id || category._id, payload);
      } else {
        await categoriesAPI.create(payload);
      }

      onSuccess?.();
    } catch (err) {
      setError(err?.message || "Could not save category.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={saving ? undefined : onClose}
        className="fixed inset-0 z-[90] bg-primary/50 backdrop-blur-sm"
      />

      {/* Modal wrapper */}
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="category-modal-title"
          className="relative w-full sm:max-w-lg max-h-[92vh] pointer-events-auto
            bg-cream sm:rounded-3xl rounded-t-3xl shadow-soft overflow-hidden
            flex flex-col"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          {/* ============ HEADER ============ */}
          <div className="relative px-5 pt-5 pb-5 shrink-0 bg-primary sm:px-6">
            <div className="absolute w-40 h-40 rounded-full pointer-events-none -top-12 -right-12 bg-gold/25 blur-3xl" />

            <div className="flex justify-center mb-3 sm:hidden">
              <span className="w-10 h-1 rounded-full bg-cream/25" />
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              aria-label="Close"
              className="absolute z-10 grid transition border top-4 right-4 w-9 h-9 rounded-xl bg-cream/10 border-cream/15 place-items-center text-cream hover:bg-cream/20 disabled:opacity-50"
            >
              <X size={16} />
            </button>

            <div className="relative flex items-center gap-3">
              <span className="grid border w-11 h-11 rounded-2xl bg-cream/10 border-cream/15 place-items-center text-gold shrink-0">
                <FolderTree size={18} />
              </span>
              <div className="min-w-0">
                <h2
                  id="category-modal-title"
                  className="text-xl leading-tight font-display text-cream"
                >
                  {isEdit ? "Edit category" : "New category"}
                </h2>
                <p className="text-cream/60 text-xs mt-0.5">
                  {isEdit
                    ? "Update name or description"
                    : "Add a new subject to organise books"}
                </p>
              </div>
            </div>
          </div>

          {/* ============ FORM ============ */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="p-5 space-y-4 sm:p-6">
              {/* Name */}
              <div>
                <label className="text-xs font-medium text-primary/70 mb-1.5 block">
                  Name <span className="text-gold">*</span>
                </label>
                <div className="flex items-center gap-2.5 bg-white/70 border border-primary/10 rounded-2xl px-4 focus-within:ring-2 focus-within:ring-gold/40 focus-within:border-gold/40 transition">
                  <FolderTree size={16} className="text-primary/40 shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="e.g. Programming"
                    maxLength={100}
                    className="w-full bg-transparent outline-none text-sm text-primary placeholder:text-primary/40 py-3.5"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-medium text-primary/70 mb-1.5 block">
                  Description
                </label>
                <div className="flex items-start gap-2.5 bg-white/70 border border-primary/10 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-gold/40 focus-within:border-gold/40 transition">
                  <FileText
                    size={16}
                    className="mt-1 text-primary/40 shrink-0"
                  />
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    placeholder="Optional short description"
                    rows={3}
                    className="w-full text-sm bg-transparent outline-none resize-none text-primary placeholder:text-primary/40"
                  />
                </div>
              </div>

              {/* Info hint */}
              <div className="flex items-start gap-2 bg-mint/60 border border-primary/10 text-primary text-xs rounded-xl px-3 py-2.5">
                <AlertCircle
                  size={14}
                  className="shrink-0 mt-0.5 text-primary/60"
                />
                <span className="text-primary/70">
                  Active/Inactive status is controlled from the categories list
                  — separate toggle per row.
                </span>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-3 py-2.5">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* ============ FOOTER ============ */}
            <div className="px-5 py-4 border-t sm:px-6 border-primary/10 bg-cream/95 backdrop-blur-sm">
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="inline-flex items-center justify-center w-full gap-2 px-5 py-3 text-sm font-medium transition border sm:w-auto bg-cream border-primary/15 text-primary rounded-2xl hover:bg-mint disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary text-cream px-5 py-3 rounded-2xl text-sm font-medium hover:bg-primary/90 active:scale-[0.98] transition shadow-soft disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      {isEdit ? "Saving…" : "Creating…"}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      {isEdit ? "Save changes" : "Create category"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
