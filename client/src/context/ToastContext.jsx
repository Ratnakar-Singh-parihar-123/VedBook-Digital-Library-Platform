import { createContext, useContext, useState, useCallback } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
} from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ title, message, type = "info", duration = 4000 }) => {
      const id = Date.now().toString() + Math.random().toString(36).slice(2, 7);
      const newToast = { id, title, message, type, duration };

      setToasts((prev) => [...prev.slice(-4), newToast]); // keep max 5 toasts

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
      return id;
    },
    [removeToast],
  );

  const toast = {
    show: (msg, type = "info", title = "") =>
      addToast({ message: msg, type, title }),
    success: (msg, title = "Success") =>
      addToast({ message: msg, type: "success", title }),
    error: (msg, title = "Error") =>
      addToast({ message: msg, type: "error", title }),
    info: (msg, title = "Notice") =>
      addToast({ message: msg, type: "info", title }),
    warning: (msg, title = "Warning") =>
      addToast({ message: msg, type: "warning", title }),
    remove: removeToast,
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Graceful fallback if used outside provider
    return {
      show: () => {},
      success: () => {},
      error: () => {},
      info: () => {},
      warning: () => {},
      remove: () => {},
    };
  }
  return ctx;
}

function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Notifications"
      className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }) {
  const { title, message, type } = toast;

  const styles = {
    success: {
      bg: "bg-primary text-cream border-primary-light",
      icon: CheckCircle2,
      iconColor: "text-gold",
    },
    error: {
      bg: "bg-red-950 text-white border-red-800",
      icon: AlertCircle,
      iconColor: "text-red-400",
    },
    warning: {
      bg: "bg-amber-950 text-white border-amber-800",
      icon: AlertTriangle,
      iconColor: "text-amber-400",
    },
    info: {
      bg: "bg-primary-dark text-cream border-primary/40",
      icon: Info,
      iconColor: "text-gold",
    },
  }[type] || {
    bg: "bg-primary text-cream border-primary/20",
    icon: Info,
    iconColor: "text-gold",
  };

  const Icon = styles.icon;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl shadow-hover border backdrop-blur-md transition-all duration-300 animate-fade-in ${styles.bg}`}
    >
      <Icon size={18} className={`shrink-0 mt-0.5 ${styles.iconColor}`} />
      <div className="flex-1 min-w-0 pr-1">
        {title && (
          <p className="text-xs font-bold leading-tight font-display">
            {title}
          </p>
        )}
        <p
          className={`text-xs leading-relaxed ${title ? "mt-0.5 opacity-90" : "font-medium"}`}
        >
          {message}
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="p-1 transition rounded-lg shrink-0 text-cream/60 hover:text-cream hover:bg-white/10"
      >
        <X size={14} />
      </button>
    </div>
  );
}
