import api from "./adminApi";

// Discovery / Featured API                                          */

export const featuredAPI = {
  /** Currently featured books (ordered) */
  getFeatured: () => api.get("/api/discovery/featured"),

  /** All admin books (drafts + published) */
  listAdminBooks: () => api.get("/api/books/admin"),

  /** Toggle featured status + set order */
  updateFeatured: (bookId, payload) =>
    api.patch(`/api/discovery/admin/books/${bookId}/featured`, payload),
};

export default featuredAPI;
