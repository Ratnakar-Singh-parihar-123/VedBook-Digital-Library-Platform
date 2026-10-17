import PropTypes from "prop-types";
import { AlertCircle, RefreshCw } from "lucide-react";

/**
 * Reusable Error State with retry functionality
 */
export default function ErrorState({
  title = "Something went wrong",
  message = "Unable to load data. Please check your connection and try again.",
  onRetry,
  retryLabel = "Try again",
  retrying = false,
  compact = false,
  className = "",
}) {
  if (compact) {
    return (
      <div
        role="alert"
        className={`flex items-start gap-3 px-4 py-3 text-sm text-red-700 border border-red-200/80 bg-red-50/90 rounded-2xl ${className}`}
      >
        <AlertCircle size={17} className="shrink-0 mt-0.5 text-red-600" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-red-900">{title}</p>
          {message && <p className="text-xs text-red-700/90 mt-0.5">{message}</p>}
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            disabled={retrying}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-800 bg-white border border-red-200 rounded-lg hover:bg-red-100/50 transition disabled:opacity-50 shrink-0"
          >
            <RefreshCw size={12} className={retrying ? "animate-spin" : ""} />
            {retryLabel}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      role="alert"
      className={`text-center py-12 px-6 bg-white/70 border border-red-200/70 rounded-3xl backdrop-blur-sm max-w-lg mx-auto ${className}`}
    >
      <div className="grid mx-auto mb-4 w-14 h-14 rounded-2xl bg-red-100/70 text-red-600 place-items-center ring-1 ring-red-200">
        <AlertCircle size={26} />
      </div>

      <h3 className="font-display text-lg sm:text-xl text-primary font-semibold">
        {title}
      </h3>

      <p className="mt-2 text-sm text-primary/70 leading-relaxed max-w-sm mx-auto">
        {message}
      </p>

      {onRetry && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={onRetry}
            disabled={retrying}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-primary text-cream hover:bg-primary/90 transition shadow-soft active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCw size={14} className={retrying ? "animate-spin" : ""} />
            {retrying ? "Retrying..." : retryLabel}
          </button>
        </div>
      )}
    </div>
  );
}

ErrorState.propTypes = {
  title: PropTypes.node,
  message: PropTypes.node,
  onRetry: PropTypes.func,
  retryLabel: PropTypes.node,
  retrying: PropTypes.bool,
  compact: PropTypes.bool,
  className: PropTypes.string,
};
