import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import { booksAPI } from "../../api/adminApi";

export default function DeleteBookDialog({ book, onClose, onSuccess }) {
  const open = Boolean(book);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!open || loading) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, loading, onClose]);

  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  if (!open) return null;

  const title = book?.title || "this book";

  const handleDelete = async () => {
    setLoading(true);
    setError("");
    try {
      await booksAPI.remove(book.id || book._id);
      onSuccess?.();
    } catch (err) {
      setError(err?.message || "Failed to delete book");
      setLoading(false);
    }
  };

  return (
    <>
      <div
        aria-hidden="true"
        onClick={loading ? undefined : onClose}
        className="fixed inset-0 z-[110] bg-primary/60 backdrop-blur-sm"
      />

      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 pointer-events-none">
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-title"
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
            <div className="grid mx-auto border border-red-200 w-14 h-14 rounded-2xl bg-red-50 place-items-center">
              <AlertTriangle size={24} className="text-red-500" />
            </div>

            <h2
              id="delete-title"
              className="mt-4 text-xl text-center font-display text-primary"
            >
              Delete this book?
            </h2>
            <p className="max-w-sm mx-auto mt-2 text-sm text-center text-primary/60">
              "<span className="font-medium text-primary">{title}</span>" and
              its uploaded PDF will be permanently removed. This cannot be
              undone.
            </p>

            {error && (
              <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-3 py-2.5">
                <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 mt-6 sm:flex-row sm:justify-end">
              <button
                ref={cancelRef}
                type="button"
                onClick={onClose}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium transition border bg-cream border-primary/15 text-primary rounded-xl hover:bg-mint disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium text-white transition bg-red-600 rounded-xl hover:bg-red-700 shadow-soft disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 size={15} /> Delete book
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
