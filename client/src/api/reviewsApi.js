import api from "./adminApi";

// Reviews + Popular Books API                                       */

export const reviewsAPI = {
  /** Weekly popular books (auto-ranked) */
  getPopularBooks: (params) =>
    api.get("/api/admin/analytics/popular-books", { params }),

  /** Review stats (total / pending / approved / hidden) */
  getStats: () => api.get("/api/admin/reviews/stats"),

  /** Paginated reviews list with optional filters */
  list: ({ page = 1, limit = 10, status, search } = {}) =>
    api.get("/api/admin/reviews", {
      params: {
        page,
        limit,
        ...(status && status !== "all" ? { status } : {}),
        ...(search ? { search } : {}),
      },
    }),

  /** Update review status — "approved" | "hidden" */
  setStatus: (id, status) =>
    api.patch(`/api/admin/reviews/${id}/status`, { status }),
};

export default reviewsAPI;
