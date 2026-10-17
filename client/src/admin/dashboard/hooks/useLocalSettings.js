import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "ved_admin_settings";

const DEFAULTS = {
  // General
  siteName: "VedBook",
  tagline: "Digital Library",
  supportEmail: "support@vedbook.app",
  language: "en",

  // Notifications
  notifyNewUsers: true,
  notifyNewBooks: true,
  notifyReports: true,
  notifyWeeklyDigest: false,

  // Preferences
  defaultView: "grid", // grid | list
  booksPerPage: 10, // 10 | 20 | 50
  autoSaveDraft: true,
  confirmDelete: true,

  // Security
  sessionTimeout: "24h", // 1h | 24h | 7d | 30d
  twoFactor: false,
};

export default function useLocalSettings() {
  const [settings, setSettings] = useState(DEFAULTS);

  /* Load */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setSettings({ ...DEFAULTS, ...parsed });
      }
    } catch {
      /* ignore */
    }
  }, []);

  /* Update one key */
  const update = useCallback((key, value) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  /* Update multiple keys */
  const updateMany = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  /* Reset all */
  const reset = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setSettings(DEFAULTS);
  }, []);

  return { settings, update, updateMany, reset, DEFAULTS };
}
