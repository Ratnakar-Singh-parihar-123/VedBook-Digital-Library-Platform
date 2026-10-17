import PropTypes from "prop-types";
import { RefreshCw } from "lucide-react";

/**
 * Subtle indicator for background refresh so existing content is never hidden
 */
export default function RefreshBanner({
  message = "Refreshing data in background...",
  className = "",
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-mint/90 text-primary border border-primary/10 shadow-soft animate-fade-in ${className}`}
    >
      <RefreshCw size={12} className="text-gold animate-spin shrink-0" />
      <span>{message}</span>
    </div>
  );
}

RefreshBanner.propTypes = {
  message: PropTypes.node,
  className: PropTypes.string,
};
