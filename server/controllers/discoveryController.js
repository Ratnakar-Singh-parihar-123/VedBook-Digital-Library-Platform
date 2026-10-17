import db from "../config/db.js";

const validId = (value) => /^\d+$/.test(String(value)) && Number(value) > 0;

const publicBookFields = `
  b.id,
  b.title,
  b.author,
  b.description,
  b.cover_image AS coverImage,
  b.category_id AS categoryId,
  c.name AS categoryName,
  c.slug AS categorySlug,
  b.published_year AS publishedYear,
  b.is_featured AS isFeatured
`;

// GET /api/discovery/featured
// Public: show only admin-selected, published books.
export const getFeaturedMasterpieces = async (req, res) => {
  try {
    const requestedLimit = Number(req.query.limit ?? 12);
    const limit = Number.isInteger(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 30)
      : 12;

    const [books] = await db.execute(
      `SELECT ${publicBookFields}
       FROM books b
       LEFT JOIN categories c ON c.id = b.category_id
       WHERE b.status = 'published'
         AND b.is_featured = TRUE
         AND (b.category_id IS NULL OR c.is_active = TRUE)
       ORDER BY b.featured_order ASC, b.created_at DESC, b.id DESC
       LIMIT ?`,
      [limit],
    );

    return res.status(200).json({
      success: true,
      count: books.length,
      data: books,
    });
  } catch (error) {
    console.error("Featured masterpieces error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load featured masterpieces",
    });
  }
};

// GET /api/discovery/explore?q=&category=&page=1&limit=12
// Public: searchable, filterable, paginated book catalogue.
export const exploreBooks = async (req, res) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const category =
      typeof req.query.category === "string" ? req.query.category.trim() : "";

    const rawPage = req.query.page ?? "1";
    const rawLimit = req.query.limit ?? "12";
    const page = Number(rawPage);
    const requestedLimit = Number(rawLimit);

    if (q.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Search query cannot exceed 100 characters",
      });
    }

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(requestedLimit) ||
      requestedLimit < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Page and limit must be positive integers",
      });
    }

    if (category.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Invalid category filter",
      });
    }

    const limit = Math.min(requestedLimit, 50);
    const offset = (page - 1) * limit;

    if (!Number.isSafeInteger(offset)) {
      return res.status(400).json({
        success: false,
        message: "Requested page is too large",
      });
    }

    const conditions = [
      "b.status = 'published'",
      "(b.category_id IS NULL OR c.is_active = TRUE)",
    ];
    const params = [];

    if (q) {
      conditions.push(
        "(b.title LIKE ? OR b.author LIKE ? OR b.description LIKE ?)",
      );

      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (category && category.toLowerCase() !== "all") {
      conditions.push("(c.slug = ? OR c.name = ?)");
      params.push(category, category);
    }

    const whereClause = conditions.join(" AND ");

    const [countRows] = await db.execute(
      `SELECT COUNT(*) AS total
       FROM books b
       LEFT JOIN categories c ON c.id = b.category_id
       WHERE ${whereClause}`,
      params,
    );

    const total = Number(countRows[0].total);

    const [books] = await db.execute(
      `SELECT ${publicBookFields}
       FROM books b
       LEFT JOIN categories c ON c.id = b.category_id
       WHERE ${whereClause}
       ORDER BY b.created_at DESC, b.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    return res.status(200).json({
      success: true,
      data: books,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: offset + books.length < total,
        hasPreviousPage: page > 1,
      },
      filters: {
        q,
        category: category || "all",
      },
    });
  } catch (error) {
    console.error("Explore books error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load books",
    });
  }
};

// PATCH /api/discovery/admin/books/:id/featured
// Admin: set featured status and optional display order.
// Body: { "isFeatured": true, "featuredOrder": 1 }
export const setBookFeaturedStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isFeatured, featuredOrder = 0 } = req.body;

    if (!validId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    if (typeof isFeatured !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isFeatured must be true or false",
      });
    }

    if (
      !Number.isSafeInteger(featuredOrder) ||
      featuredOrder < 0 ||
      featuredOrder > 2147483647
    ) {
      return res.status(400).json({
        success: false,
        message: "featuredOrder must be a non-negative integer",
      });
    }

    const [existing] = await db.execute(
      "SELECT id, title, status FROM books WHERE id = ? LIMIT 1",
      [Number(id)],
    );

    if (!existing.length) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    await db.execute(
      `UPDATE books
       SET is_featured = ?, featured_order = ?
       WHERE id = ?`,
      [isFeatured, featuredOrder, Number(id)],
    );

    return res.status(200).json({
      success: true,
      message: isFeatured
        ? "Book selected for Featured Masterpieces"
        : "Book removed from Featured Masterpieces",
      data: {
        id: Number(id),
        title: existing[0].title,
        status: existing[0].status,
        isFeatured,
        featuredOrder,
      },
    });
  } catch (error) {
    console.error("Set featured status error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to update featured status",
    });
  }
};

export const getRecommendedBooks = async (req, res) => {
  try {
    const userId = req.user.id;
    const requestedLimit = Number(req.query.limit ?? 12);

    const limit = Number.isInteger(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 30)
      : 12;

    const [books] = await db.execute(
      `SELECT
        b.id,
        b.title,
        b.author,
        b.description,
        b.cover_image AS coverImage,
        b.category_id AS categoryId,
        c.name AS categoryName,
        c.slug AS categorySlug,
        b.published_year AS publishedYear,
        b.created_at AS createdAt,

        COALESCE(ci.interest_score, 0) AS interestScore,

        (
          SELECT COUNT(*)
          FROM book_read_events popular
          WHERE popular.book_id = b.id
            AND popular.created_at >=
                DATE_SUB(NOW(), INTERVAL 30 DAY)
        ) AS recentReads

      FROM books b

      LEFT JOIN categories c
        ON c.id = b.category_id

      LEFT JOIN (
        SELECT
          activity.category_id,
          SUM(activity.weight) AS interest_score
        FROM (
          SELECT
            books.category_id,
            COUNT(*) * 3 AS weight
          FROM reading_progress rp
          INNER JOIN books
            ON books.id = rp.book_id
          WHERE rp.user_id = ?
            AND books.category_id IS NOT NULL
          GROUP BY books.category_id

          UNION ALL

          SELECT
            books.category_id,
            COUNT(*) * 2 AS weight
          FROM bookmarks bm
          INNER JOIN books
            ON books.id = bm.book_id
          WHERE bm.user_id = ?
            AND books.category_id IS NOT NULL
          GROUP BY books.category_id

          UNION ALL

          SELECT
            books.category_id,
            COUNT(*) AS weight
          FROM book_read_events events
          INNER JOIN books
            ON books.id = events.book_id
          WHERE events.user_id = ?
            AND books.category_id IS NOT NULL
          GROUP BY books.category_id
        ) activity
        GROUP BY activity.category_id
      ) ci
        ON ci.category_id = b.category_id

      WHERE b.status = 'published'
        AND (b.category_id IS NULL OR c.is_active = TRUE)

        AND NOT EXISTS (
          SELECT 1
          FROM reading_progress rp2
          WHERE rp2.user_id = ?
            AND rp2.book_id = b.id
        )

        AND NOT EXISTS (
          SELECT 1
          FROM bookmarks bm2
          WHERE bm2.user_id = ?
            AND bm2.book_id = b.id
        )

        AND NOT EXISTS (
          SELECT 1
          FROM book_read_events events2
          WHERE events2.user_id = ?
            AND events2.book_id = b.id
        )

      ORDER BY
        interestScore DESC,
        recentReads DESC,
        b.created_at DESC,
        b.id DESC

      LIMIT ?`,
      [userId, userId, userId, userId, userId, userId, limit],
    );

    return res.status(200).json({
      success: true,
      count: books.length,
      data: books,
    });
  } catch (error) {
    console.error("Recommended books error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load recommended books",
    });
  }
};

// GET /api/discovery/recently-catalogued?limit=8
// Public: latest published books for the Recently Catalogued section.
export const getRecentlyCataloguedBooks = async (req, res) => {
  try {
    const requestedLimit = Number(req.query.limit ?? 8);

    const limit = Number.isInteger(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 30)
      : 8;

    const [books] = await db.execute(
      `SELECT
         ${publicBookFields},
         b.created_at AS createdAt
       FROM books b
       LEFT JOIN categories c ON c.id = b.category_id
       WHERE b.status = 'published'
         AND (b.category_id IS NULL OR c.is_active = TRUE)
       ORDER BY b.created_at DESC, b.id DESC
       LIMIT ?`,
      [limit],
    );

    return res.status(200).json({
      success: true,
      count: books.length,
      data: books,
    });
  } catch (error) {
    console.error("Recently catalogued books error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load recently catalogued books",
    });
  }
};
