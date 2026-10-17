import axios from "axios";

/* ------------------------------------------------------------------ */
/*  Axios instance — used across the app                              */
/* ------------------------------------------------------------------ */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  timeout: 15000,
  // headers: { "Content-Type": "application/json" },
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
    console.log("API URL:", error.config?.baseURL + error.config?.url);
    console.log("Status:", error.response?.status);
    console.log("Backend error:", error.response?.data);

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
/*  Books API — admin side                                             */
/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/*  Books API — matches your Express routes                           */
/* ------------------------------------------------------------------ */
export const booksAPI = {
  searchPublic: (q) => api.get("/api/books/search", { params: { q } }),
  /** Public: only published books */
  listPublic: () => api.get("/api/books"),

  /** Admin: all books (drafts + published) — no pagination params */
  listAdmin: () => api.get("/api/books/admin"),

  /** Admin: one book with full details */
  getAdmin: (id) => api.get(`api/books/admin/${id}`),

  /** Admin: upload new book (multipart, field = "pdf") */
  create: (formData) =>
    api.post("/api/books", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  /** Admin: edit book (multipart, pdf optional) */
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
    const base = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
    return `${base}/api/books/${id}/read`;
  },
};

/* Helper — object ko FormData me convert karo (file uploads ke liye) */
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
  // Get current admin profile
  get: () => api.get("/api/admin/profile"),

  // Update name, email, avatar — all fields are optional
  update: (payload) => {
    const fd = payload instanceof FormData ? payload : toFormData(payload);

    return api.patch("/api/admin/profile", fd, {
      headers: {
        "Content-Type": null,
      },
    });
  },

  // Change password
  changePassword: (payload) => api.patch("/api/admin/change-password", payload),
};

export const categoriesAPI = {
  // Public: active categories only
  list: () => api.get("/categories"),
  listPublic: () => api.get("/categories"),

  // Admin: active + inactive categories
  listAdmin: () => api.get("/categories/admin"),

  // Admin: create category
  create: (payload) => api.post("/categories", payload),

  // Admin: update name, description, etc.
  update: (id, payload) => api.patch(`/categories/${id}`, payload),

  // Admin: activate/deactivate category
  updateStatus: (id, is_active) =>
    api.patch(`/categories/${id}/status`, { is_active }),

  // Soft-deactivate category
  remove: (id) => api.delete(`/categories/${id}`),
};

/* ------------------------------------------------------------------ */
/*  Notifications API                                                  */
/* ------------------------------------------------------------------ */

export const notificationsAPI = {
  // Admin inbox
  list: () => api.get("/api/admin/notifications"),
  get: (id) => api.get(`/api/admin/notifications/${id}`),

  // Create, edit, delete
  create: (payload) => api.post("/api/admin/notifications", payload),
  update: (id, payload) => api.patch(`/api/admin/notifications/${id}`, payload),
  remove: (id) => api.delete(`/api/admin/notifications/${id}`),

  // Read status
  markRead: (id) => api.patch(`/api/admin/notifications/${id}/read`),
  markAllRead: () => api.patch("/api/admin/notifications/read-all"),

  // Sent notifications
  listSent: () => api.get("/api/admin/notifications/sent"),
  getSent: (id) => api.get(`/api/admin/notifications/sent/${id}`),
};

export default api;
