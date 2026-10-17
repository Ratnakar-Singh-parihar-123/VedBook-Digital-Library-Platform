import api from "./adminApi";

export const analyticsAPI = {
  getOverview: () => api.get("/api/admin/dashboard/overview"),

  getReadingTrend: (days = 30) =>
    api.get("/api/admin/dashboard/reading-trend", { params: { days } }),

  getTrendingBooks: (days = 30, limit = 10) =>
    api.get("/api/admin/dashboard/trending-books", { params: { days, limit } }),

  getUserGrowth: (days = 30) =>
    api.get("/api/admin/dashboard/user-growth", { params: { days } }),

  getRecentActivity: (limit = 10) =>
    api.get("/api/admin/dashboard/recent-activity", {
      params: { limit: Math.min(Number(limit) || 10, 50) },
    }),

  getActivityLog: (params = {}) =>
    api.get("/api/admin/dashboard/recent-activity", {
      params: {
        ...params,
        limit: Math.min(Number(params.limit) || 50, 50),
      },
    }),
};

export default analyticsAPI;
