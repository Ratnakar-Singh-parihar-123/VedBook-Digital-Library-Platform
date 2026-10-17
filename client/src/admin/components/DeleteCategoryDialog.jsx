import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Loader2,
  Trash2,
  X,
  BookOpen,
  Lock,
} from "lucide-react";
import { categoriesAPI } from "../../api/adminApi";

export default function DeleteCategoryDialog({ category, onClose, onSuccess }) {
  const open = Boolean(category);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const cancelRef = useRef(null);

  /* Escape closes (but not while deleting) */
  useEffect(() => {
    if (!open || loading) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, loading, onClose]);

  /* Auto-focus cancel button */
  useEffect(() => {
    if (open) {
      setError("");
      setLoading(false);
      setTimeout(() => cancelRef.current?.focus(), 60);
    }
  }, [open, category]);

  if (!open) return null;

  const name = category?.name || "this category";
  const booksCount =
    category?.bookCount ??
    category?.booksCount ??
    category?.books ??
    category?.totalBooks ??
    0;

  /* ---------------- Delete ---------------- */
  const handleDelete = async () => {
    setLoading(true);
    setError("");

    try {
      await categoriesAPI.remove(category.id || category._id);
      /* Success — parent handles optimistic removal + toast */
      onSuccess?.(category);
    } catch (err) {
      /* Show backend error to the user */
      const message =
        err?.message ||
        err?.response?.data?.message ||
        "Could not delete category. Please try again.";

      setError(message);
      setLoading(false);
      console.error("Delete category error:", err);
    }
  };

  /* Block delete when books are attached — pre-flight warning */
  const hasBooks = Number(booksCount) > 0;

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={loading ? undefined : onClose}
        className="fixed inset-0 z-[110] bg-primary/60 backdrop-blur-sm"
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 pointer-events-none">
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-category-title"
          className="relative w-full max-w-md overflow-hidden pointer-events-auto bg-cream rounded-3xl shadow-soft"
        >
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
            className="absolute top-3.5 right-3.5 w-8 h-8 rounded-lg grid place-items-center text-primary/50 hover:bg-mint transition disabled:opacity-50"
          >
            <X size={15} />
          </button>

          <div className="p-6 sm:p-7">
            {/* Icon */}
            <div className="grid mx-auto border border-red-200 w-14 h-14 rounded-2xl bg-red-50 place-items-center">
              <AlertTriangle size={24} className="text-red-500" />
            </div>

            <h2
              id="delete-category-title"
              className="mt-4 text-xl text-center font-display text-primary"
            >
              Delete "{name}"?
            </h2>

            <p className="max-w-sm mx-auto mt-2 text-sm text-center text-primary/60">
              This action cannot be undone.
            </p>

            {/* Books count warning */}
            {hasBooks ? (
              <div className="mt-4 flex items-start gap-2.5 bg-gold/15 border border-gold/40 rounded-2xl px-3.5 py-3">
                <BookOpen
                  size={15}
                  className="text-primary/70 shrink-0 mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs leading-relaxed text-primary/80">
                    <span className="font-semibold">
                      {booksCount} book{booksCount === 1 ? "" : "s"}
                    </span>{" "}
                    currently use this category. They will become{" "}
                    <span className="font-semibold">uncategorised</span> after
                    deletion.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex items-start gap-2.5 bg-mint/60 border border-primary/10 rounded-2xl px-3.5 py-3">
                <Lock size={15} className="text-primary/60 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed text-primary/70">
                  No books are attached to this category.
                </p>
              </div>
            )}

            {/* Error from backend */}
            {error && (
              <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-3 py-2.5">
                <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">Delete failed</p>
                  <p className="mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col-reverse gap-2 mt-6 sm:flex-row sm:justify-end">
              <button
                ref={cancelRef}
                type="button"
                onClick={onClose}
                disabled={loading}
                className="inline-flex items-center justify-center w-full gap-2 px-5 py-3 text-sm font-medium transition border sm:w-auto bg-cream border-primary/15 text-primary rounded-xl hover:bg-mint disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-red-600 text-white px-5 py-3 rounded-xl text-sm font-medium hover:bg-red-700 active:scale-[0.98] transition shadow-soft disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 size={15} />
                    {hasBooks ? "Delete anyway" : "Delete"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
