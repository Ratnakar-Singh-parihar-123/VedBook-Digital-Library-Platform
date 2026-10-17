import db from "../config/db.js";

const isValidId = (id) => Number.isInteger(Number(id)) && Number(id) > 0;

// Submit or update a review
export const submitReview = async (req, res) => {
  try {
    const bookId = Number(req.params.bookId);
    const userId = req.user.id;
    const { rating, reviewText = "" } = req.body;

    if (!isValidId(bookId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    if (typeof reviewText !== "string" || reviewText.length > 5000) {
      return res.status(400).json({
        success: false,
        message: "Review must be a string of up to 5000 characters",
      });
    }

    const [books] = await db.execute(
      "SELECT id FROM books WHERE id = ? AND status = 'published' LIMIT 1",
      [bookId],
    );

    if (!books.length) {
      return res.status(404).json({
        success: false,
        message: "Published book not found",
      });
    }

    await db.execute(
      `INSERT INTO reviews (user_id, book_id, rating, review_text)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         rating = VALUES(rating),
         review_text = VALUES(review_text),
         status = 'approved',
         updated_at = CURRENT_TIMESTAMP`,
      [userId, bookId, rating, reviewText.trim() || null],
    );

    const [rows] = await db.execute(
      `SELECT id, book_id AS bookId, rating,
              review_text AS reviewText, status, created_at AS createdAt,
              updated_at AS updatedAt
       FROM reviews
       WHERE user_id = ? AND book_id = ?
       LIMIT 1`,
      [userId, bookId],
    );

    return res.status(200).json({
      success: true,
      message: "Review saved successfully",
      data: rows[0],
    });
  } catch (error) {
    console.error("Submit review error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to save review",
    });
  }
};

// Get approved reviews for a book
export const getBookReviews = async (req, res) => {
  try {
    const bookId = Number(req.params.bookId);
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10),
    );
    const offset = (page - 1) * limit;

    if (!isValidId(bookId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    const [books] = await db.execute(
      "SELECT id FROM books WHERE id = ? AND status = 'published' LIMIT 1",
      [bookId],
    );

    if (!books.length) {
      return res.status(404).json({
        success: false,
        message: "Published book not found",
      });
    }

    const [countRows] = await db.execute(
      `SELECT COUNT(*) AS total
       FROM reviews
       WHERE book_id = ? AND status = 'approved'`,
      [bookId],
    );

    const [reviews] = await db.execute(
      `SELECT id, user_id AS userId, rating,
              review_text AS reviewText, created_at AS createdAt
       FROM reviews
       WHERE book_id = ? AND status = 'approved'
       ORDER BY created_at DESC, id DESC
       LIMIT ? OFFSET ?`,
      [bookId, limit, offset],
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
    console.error("Get book reviews error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch reviews",
    });
  }
};

// Get the logged-in user's review for a book
export const getMyReview = async (req, res) => {
  try {
    const bookId = Number(req.params.bookId);

    if (!isValidId(bookId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    const [rows] = await db.execute(
      `SELECT id, book_id AS bookId, rating,
              review_text AS reviewText, status, created_at AS createdAt,
              updated_at AS updatedAt
       FROM reviews
       WHERE user_id = ? AND book_id = ?
       LIMIT 1`,
      [req.user.id, bookId],
    );

    return res.json({
      success: true,
      data: rows[0] || null,
    });
  } catch (error) {
    console.error("Get my review error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch your review",
    });
  }
};

// Automatic weekly popularity ranking
export const getPopularThisWeek = async (req, res) => {
  try {
    const requestedLimit = Number.parseInt(req.query.limit, 10) || 10;
    const limit = Math.min(20, Math.max(1, requestedLimit));

    const [books] = await db.execute(
      `SELECT
         b.id,
         b.title,
         b.author,
         b.description,
         b.cover_image AS coverImage,
         b.category_id AS categoryId,
         c.name AS categoryName,
         COUNT(r.id) AS reviewCount,
         ROUND(AVG(r.rating), 1) AS averageRating
       FROM books b
       INNER JOIN reviews r ON r.book_id = b.id
       LEFT JOIN categories c ON c.id = b.category_id
       WHERE b.status = 'published'
         AND r.status = 'approved'
         AND r.created_at >= NOW() - INTERVAL 7 DAY
         AND (b.category_id IS NULL OR c.is_active = TRUE)
       GROUP BY
         b.id, b.title, b.author, b.description,
         b.cover_image, b.category_id, c.name
       ORDER BY reviewCount DESC, averageRating DESC, b.id DESC
       LIMIT ?`,
      [limit],
    );

    return res.json({
      success: true,
      message: "Popular books for the last 7 days",
      data: books,
    });
  } catch (error) {
    console.error("Popular books error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch popular books",
    });
  }
};
