import db from "../config/db.js";

const validStatuses = ["pending", "approved", "hidden"];

const isValidId = (value) => /^\d+$/.test(String(value)) && Number(value) > 0;

// GET /api/admin/reviews
export const getAdminReviews = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10),
    );
    const offset = (page - 1) * limit;

    const status = String(req.query.status || "").trim();
    const search = String(req.query.search || "")
      .trim()
      .slice(0, 150);

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review status",
      });
    }

    let where = "WHERE 1 = 1";
    const params = [];

    if (status) {
      where += " AND r.status = ?";
      params.push(status);
    }

    if (search) {
      where += ` AND (
        b.title LIKE ?
        OR r.review_text LIKE ?
        OR CAST(r.user_id AS CHAR) LIKE ?
        OR CAST(r.book_id AS CHAR) LIKE ?
      )`;

      const searchValue = `%${search}%`;
      params.push(searchValue, searchValue, searchValue, searchValue);
    }

    const [countRows] = await db.execute(
      `SELECT COUNT(*) AS total
       FROM reviews r
       INNER JOIN books b ON b.id = r.book_id
       ${where}`,
      params,
    );

    const [reviews] = await db.execute(
      `SELECT
         r.id,
         r.user_id AS userId,
         r.book_id AS bookId,
         b.title AS bookTitle,
         b.cover_image AS coverImage,
         r.rating,
         r.review_text AS reviewText,
         r.status,
         r.created_at AS createdAt,
         r.updated_at AS updatedAt
       FROM reviews r
       INNER JOIN books b ON b.id = r.book_id
       ${where}
       ORDER BY r.created_at DESC, r.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    const total = Number(countRows[0].total);

    return res.json({
      success: true,
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin reviews error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
    });
  }
};

// GET /api/admin/reviews/stats
export const getAdminReviewStats = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        COUNT(*) AS total,
        COALESCE(SUM(status = 'pending'), 0) AS pending,
        COALESCE(SUM(status = 'approved'), 0) AS approved,
        COALESCE(SUM(status = 'hidden'), 0) AS hidden,
        COALESCE(SUM(
          status = 'approved'
          AND created_at >= NOW() - INTERVAL 7 DAY
        ), 0) AS approvedThisWeek
      FROM reviews
    `);

    const stats = rows[0];

    return res.json({
      success: true,
      data: {
        total: Number(stats.total),
        pending: Number(stats.pending),
        approved: Number(stats.approved),
        hidden: Number(stats.hidden),
        approvedThisWeek: Number(stats.approvedThisWeek),
      },
    });
  } catch (error) {
    console.error("Review stats error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch review statistics",
    });
  }
};

// PATCH /api/admin/reviews/:id/status
export const updateReviewStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID",
      });
    }

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be pending, approved, or hidden",
      });
    }

    const [result] = await db.execute(
      `UPDATE reviews SET status = ? WHERE id = ?`,
      [status, Number(id)],
    );

    if (result.affectedRows === 0) {
      const [existing] = await db.execute(
        "SELECT id FROM reviews WHERE id = ?",
        [Number(id)],
      );

      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Review not found",
        });
      }
    }

    return res.json({
      success: true,
      message: `Review status updated to ${status}`,
      data: { id: Number(id), status },
    });
  } catch (error) {
    console.error("Update review status error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update review status",
    });
  }
};

// GET /api/admin/analytics/popular-books
export const getAdminPopularBooks = async (req, res) => {
  try {
    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10),
    );

    const [books] = await db.execute(
      `SELECT
         b.id,
         b.title,
         b.author,
         b.cover_image AS coverImage,
         COUNT(r.id) AS reviewCount,
         ROUND(AVG(r.rating), 1) AS averageRating,
         MAX(r.created_at) AS lastReviewAt
       FROM books b
       INNER JOIN reviews r ON r.book_id = b.id
       LEFT JOIN categories c ON c.id = b.category_id
       WHERE b.status = 'published'
         AND r.status = 'approved'
         AND r.created_at >= NOW() - INTERVAL 7 DAY
         AND (b.category_id IS NULL OR c.is_active = TRUE)
       GROUP BY
         b.id, b.title, b.author, b.cover_image
       ORDER BY reviewCount DESC, averageRating DESC, b.id DESC
       LIMIT ?`,
      [limit],
    );

    return res.json({
      success: true,
      period: "last_7_days",
      data: books,
    });
  } catch (error) {
    console.error("Popular books analytics error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch popular books analytics",
    });
  }
};
