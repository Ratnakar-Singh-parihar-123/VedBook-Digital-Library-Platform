import PropTypes from "prop-types";
import { BookOpen, Sparkles } from "lucide-react";

/**
 * Reusable Empty State for VedBook
 */
export default function EmptyState({
  icon: Icon = BookOpen,
  title = "No items found",
  description = "There are no records to display at this moment.",
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = "",
  compact = false,
}) {
  return (
    <div
      role="region"
      aria-label={title}
      className={`text-center flex flex-col items-center justify-center ${
        compact
          ? "py-8 px-4"
          : "py-12 sm:py-16 px-6 bg-white/60 border border-primary/10 rounded-3xl backdrop-blur-sm"
      } ${className}`}
    >
      {/* Icon Emblem */}
      <div className="relative mb-4">
        <div className="grid w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-mint text-primary place-items-center shadow-soft ring-1 ring-primary/10">
          <Icon size={26} className="text-primary/70" />
        </div>
        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center">
          <Sparkles size={11} className="text-gold" />
        </span>
      </div>

      {/* Heading */}
      <h3 className="font-display text-lg sm:text-xl text-primary leading-tight">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="mt-2 text-sm text-primary/60 max-w-sm sm:max-w-md leading-relaxed">
          {description}
        </p>
      )}

      {/* Actions */}
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-6">
          {actionLabel && (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-primary text-cream hover:bg-primary/90 transition shadow-soft active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-gold/60"
            >
              {actionLabel}
            </button>
          )}

          {secondaryActionLabel && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-cream border border-primary/15 text-primary hover:bg-mint transition active:scale-[0.98]"
            >
              {secondaryActionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

EmptyState.propTypes = {
  icon: PropTypes.elementType,
  title: PropTypes.node,
  description: PropTypes.node,
  actionLabel: PropTypes.node,
  onAction: PropTypes.func,
  secondaryActionLabel: PropTypes.node,
  onSecondaryAction: PropTypes.func,
  className: PropTypes.string,
  compact: PropTypes.bool,
};
