import axios from "axios";
import {
  getApiBaseUrl,
  getServerBaseUrl,
  resolveCoverUrl,
  resolveAvatarUrl,
} from "../utils/urlUtils";

export { getApiBaseUrl, getServerBaseUrl, resolveCoverUrl, resolveAvatarUrl };

/* ------------------------------------------------------------------ */
/*  Axios instance — used across the app                              */
/* ------------------------------------------------------------------ */
const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 25000,
  headers: {
    Accept: "application/json",
  },
});

/* ------------------------------------------------------------------ */
/*  Request interceptor — attach token if present                     */
/* ------------------------------------------------------------------ */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("ved_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/* ------------------------------------------------------------------ */
/*  Response interceptor — normalise errors + handle 401              */
/* ------------------------------------------------------------------ */
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (import.meta.env.DEV) {
      console.log("API URL:", (error.config?.baseURL || "") + (error.config?.url || ""));
      console.log("Status:", error.response?.status);
      console.log("Backend error:", error.response?.data);
    }

    if (error.response?.status === 401) {
      localStorage.removeItem("ved_token");
      localStorage.removeItem("ved_admin");
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    return Promise.reject({ ...error, message });
  },
);

/* ------------------------------------------------------------------ */
/*  Auth helpers                                                      */
/* ------------------------------------------------------------------ */
export const authAPI = {
  register: (payload) => api.post("/api/admin/register", payload),
  login: (payload) => api.post("/api/admin/login", payload),
  me: () => api.get("/api/admin/me"),
};

export const usersAPI = {
  /** Paginated user list with filters */
  list: (params) => api.get("/api/admin/users", { params }),

  /** Single user details */
  get: (id) => api.get(`/api/admin/users/${id}`),

  /** Update user (role, status, etc.) */
  update: (id, payload) => api.patch(`/api/admin/users/${id}`, payload),

  /** Delete user */
  remove: (id) => api.delete(`/api/admin/users/${id}`),
};

/* ------------------------------------------------------------------ */
/*  Books API — matches Express routes                                */
/* ------------------------------------------------------------------ */
export const booksAPI = {
  searchPublic: (q) => api.get("/api/books/search", { params: { q } }),
  /** Public: only published books */
  listPublic: () => api.get("/api/books"),

  /** Admin: all books (drafts + published) */
  listAdmin: () => api.get("/api/books/admin"),

  /** Admin: one book with full details */
  getAdmin: (id) => api.get(`/api/books/admin/${id}`),

  /** Public: one book details */
  getPublic: (id) => api.get(`/api/books/${id}`),

  /** Admin: upload new book (multipart, field = "pdf", optional "cover") */
  create: (formData) =>
    api.post("/api/books", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  /** Admin: edit book (multipart, pdf and cover optional) */
  update: (id, formData) =>
    api.patch(`/api/books/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  /** Admin: delete */
  remove: (id) => api.delete(`/api/books/${id}`),

  /** Admin: publish / unpublish */
  publish: (id) => api.patch(`/api/books/${id}/publish`),
  unpublish: (id) => api.patch(`/api/books/${id}/unpublish`),

  /** Public PDF URL for reading */
  readPdfUrl: (id) => {
    return `${getServerBaseUrl()}/api/books/${id}/read`;
  },
};

/* Helper — convert object to FormData for file uploads */
function toFormData(obj) {
  const fd = new FormData();
  Object.entries(obj).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (Array.isArray(v)) {
      v.forEach((item) => fd.append(k, item));
    } else if (v instanceof File || v instanceof Blob) {
      fd.append(k, v);
    } else {
      fd.append(k, String(v));
    }
  });
  return fd;
}

/* ------------------------------------------------------------------ */
/*  Profile API — admin's own account                                  */
/* ------------------------------------------------------------------ */
export const profileAPI = {
  get: () => api.get("/api/admin/profile"),

  update: (payload) => {
    const fd = payload instanceof FormData ? payload : toFormData(payload);
    return api.patch("/api/admin/profile", fd, {
      headers: { "Content-Type": null },
    });
  },

  changePassword: (payload) => api.patch("/api/admin/change-password", payload),
};

export const categoriesAPI = {
  list: () => api.get("/api/categories"),
  listPublic: () => api.get("/api/categories"),
  listAdmin: () => api.get("/api/categories/admin"),
  create: (payload) => api.post("/api/categories", payload),
  update: (id, payload) => api.patch(`/api/categories/${id}`, payload),
  updateStatus: (id, is_active) =>
    api.patch(`/api/categories/${id}/status`, { is_active }),
  remove: (id) => api.delete(`/api/categories/${id}`),
};

/* ------------------------------------------------------------------ */
/*  Notifications API                                                  */
/* ------------------------------------------------------------------ */
export const notificationsAPI = {
  list: () => api.get("/api/admin/notifications"),
  get: (id) => api.get(`/api/admin/notifications/${id}`),
  create: (payload) => api.post("/api/admin/notifications", payload),
  update: (id, payload) => api.patch(`/api/admin/notifications/${id}`, payload),
  remove: (id) => api.delete(`/api/admin/notifications/${id}`),
  markRead: (id) => api.patch(`/api/admin/notifications/${id}/read`),
  markAllRead: () => api.patch("/api/admin/notifications/read-all"),
  listSent: () => api.get("/api/admin/notifications/sent"),
  getSent: (id) => api.get(`/api/admin/notifications/sent/${id}`),
};

export default api;
