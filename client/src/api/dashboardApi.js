import api from "./adminApi";

/* ------------------------------------------------------------------ */
/*  Dashboard API — all endpoints under /admin/dashboard              */
/*  Base URL + JWT are handled by adminApi's interceptors.            */
/* ------------------------------------------------------------------ */
export const dashboardAPI = {
  getOverview: () => api.get("/api/admin/dashboard/overview"),

  getReadingTrend: (days = 7) =>
    api.get("/api/admin/dashboard/reading-trend", { params: { days } }),

  getTrendingBooks: (days = 30, limit = 10) =>
    api.get("/api/admin/dashboard/trending-books", { params: { days, limit } }),

  getUserGrowth: (days = 30) =>
    api.get("/api/admin/dashboard/user-growth", { params: { days } }),

  getRecentActivity: (limit = 10) =>
    api.get("/api/admin/dashboard/recent-activity", { params: { limit } }),
};

export default dashboardAPI;
