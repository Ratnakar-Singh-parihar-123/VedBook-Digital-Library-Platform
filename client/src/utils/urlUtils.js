// Centralized URL resolution for VedBook client

export const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/api\/?$/i, "");
  }

  // If in browser production environment (e.g. Vercel) and no env var set
  if (
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    return "https://vedbook-digital-library-platform.onrender.com";
  }

  return "http://localhost:8000";
};

export const getServerBaseUrl = () => getApiBaseUrl();

export const resolveFileUrl = (rawPath) => {
  if (!rawPath || typeof rawPath !== "string") return "";
  const s = rawPath.trim();
  if (!s) return "";
  if (/^(https?:\/\/|data:|blob:)/i.test(s)) return s;

  const serverBase = getServerBaseUrl();
  let clean = s.replace(/^\/+/, "");
  if (clean.startsWith("api/uploads/")) {
    clean = clean.replace(/^api\//, "");
  }
  return `${serverBase}/${clean}`;
};

export const resolveCoverUrl = (raw) => {
  if (!raw || typeof raw !== "string") return "";
  const s = raw.trim();
  if (!s) return "";
  if (/^(https?:\/\/|data:|blob:)/i.test(s)) return s;

  const serverBase = getServerBaseUrl();
  let clean = s.replace(/^\/+/, "");
  if (clean.startsWith("uploads/")) {
    return `${serverBase}/${clean}`;
  }
  if (clean.endsWith(".png") || clean.endsWith(".jpg") || clean.endsWith(".jpeg") || clean.endsWith(".webp")) {
    return `${serverBase}/uploads/covers/${clean}`;
  }
  if (clean.endsWith(".pdf")) {
    return `${serverBase}/uploads/books/${clean}`;
  }
  return `${serverBase}/uploads/covers/${clean}`;
};

export const resolveAvatarUrl = (raw) => {
  if (!raw || typeof raw !== "string") return "";
  const s = raw.trim();
  if (!s) return "";
  if (/^(https?:\/\/|data:|blob:)/i.test(s)) return s;

  const serverBase = getServerBaseUrl();
  let clean = s.replace(/^\/+/, "");
  if (clean.startsWith("uploads/")) {
    return `${serverBase}/${clean}`;
  }
  return `${serverBase}/uploads/admin-profiles/${clean}`;
};
