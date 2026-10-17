import db from "../config/db.js";

// GET /api/my-library
// Returns counts for the logged-in user's library.
export const getMyLibrarySummary = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.execute(
      `SELECT
        (
          SELECT COUNT(*)
          FROM reading_progress rp
          INNER JOIN books b ON b.id = rp.book_id
          WHERE rp.user_id = ?
            AND rp.is_completed = FALSE
            AND b.status = 'published'
        ) AS inProgressCount,

        (
          SELECT COUNT(*)
          FROM bookmarks bm
          INNER JOIN books b ON b.id = bm.book_id
          WHERE bm.user_id = ?
            AND b.status = 'published'
        ) AS bookmarkedCount,

        (
          SELECT COUNT(*)
          FROM reading_progress rp
          INNER JOIN books b ON b.id = rp.book_id
          WHERE rp.user_id = ?
            AND b.status = 'published'
        ) AS recentlyReadCount,

        (
          SELECT COUNT(*)
          FROM reading_progress rp
          INNER JOIN books b ON b.id = rp.book_id
          WHERE rp.user_id = ?
            AND rp.is_completed = TRUE
            AND b.status = 'published'
        ) AS completedCount`,
      [userId, userId, userId, userId],
    );

    return res.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("Get library summary error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load your library",
    });
  }
};

// GET /api/my-library/continue-reading
export const getContinueReading = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT
        b.id,
        b.title,
        b.author,
        b.description,
        b.cover_image AS coverImage,
        b.category_id AS categoryId,
        rp.current_page AS currentPage,
        rp.total_pages AS totalPages,
        rp.progress_percent AS progressPercent,
        rp.last_read_at AS lastReadAt
      FROM reading_progress rp
      INNER JOIN books b ON b.id = rp.book_id
      WHERE rp.user_id = ?
        AND rp.is_completed = FALSE
        AND b.status = 'published'
      ORDER BY rp.last_read_at DESC
      LIMIT 10`,
      [req.user.id],
    );

    const formatted = rows.map((r) => ({
      ...r,
      progress: {
        currentPage: r.currentPage,
        totalPages: r.totalPages,
        progressPercent: Number(r.progressPercent),
        percentage: Number(r.progressPercent),
        lastReadAt: r.lastReadAt,
      },
    }));

    return res.json({ success: true, data: formatted });
  } catch (error) {
    console.error("Continue reading error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load continue reading books",
    });
  }
};

// GET /api/my-library/in-progress
export const getInProgressBooks = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT
        b.id,
        b.title,
        b.author,
        b.description,
        b.cover_image AS coverImage,
        b.category_id AS categoryId,
        rp.current_page AS currentPage,
        rp.total_pages AS totalPages,
        rp.progress_percent AS progressPercent,
        rp.last_read_at AS lastReadAt
      FROM reading_progress rp
      INNER JOIN books b ON b.id = rp.book_id
      WHERE rp.user_id = ?
        AND rp.is_completed = FALSE
        AND b.status = 'published'
      ORDER BY rp.last_read_at DESC`,
      [req.user.id],
    );

    const formatted = rows.map((r) => ({
      ...r,
      progress: {
        currentPage: r.currentPage,
        totalPages: r.totalPages,
        progressPercent: Number(r.progressPercent),
        percentage: Number(r.progressPercent),
        lastReadAt: r.lastReadAt,
      },
    }));

    return res.json({ success: true, data: formatted });
  } catch (error) {
    console.error("In-progress books error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load in-progress books",
    });
  }
};

// GET /api/my-library/bookmarked
export const getBookmarkedBooks = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT
        b.id,
        b.title,
        b.author,
        b.description,
        b.cover_image AS coverImage,
        b.category_id AS categoryId,
        bm.created_at AS bookmarkedAt
      FROM bookmarks bm
      INNER JOIN books b ON b.id = bm.book_id
      WHERE bm.user_id = ?
        AND b.status = 'published'
      ORDER BY bm.created_at DESC`,
      [req.user.id],
    );

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Bookmarked books error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load bookmarked books",
    });
  }
};

// GET /api/my-library/recently-read
export const getRecentlyReadBooks = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT
        b.id,
        b.title,
        b.author,
        b.description,
        b.cover_image AS coverImage,
        b.category_id AS categoryId,
        rp.current_page AS currentPage,
        rp.total_pages AS totalPages,
        rp.progress_percent AS progressPercent,
        rp.is_completed AS isCompleted,
        rp.last_read_at AS lastReadAt
      FROM reading_progress rp
      INNER JOIN books b ON b.id = rp.book_id
      WHERE rp.user_id = ?
        AND b.status = 'published'
      ORDER BY rp.last_read_at DESC
      LIMIT 50`,
      [req.user.id],
    );

    const formatted = rows.map((r) => ({
      ...r,
      progress: {
        currentPage: r.currentPage,
        totalPages: r.totalPages,
        progressPercent: Number(r.progressPercent),
        percentage: Number(r.progressPercent),
        lastReadAt: r.lastReadAt,
      },
    }));

    return res.json({ success: true, data: formatted });
  } catch (error) {
    console.error("Recently read books error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load recently read books",
    });
  }
};

// GET /api/my-library/completed
export const getCompletedBooks = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT
        b.id,
        b.title,
        b.author,
        b.description,
        b.cover_image AS coverImage,
        b.category_id AS categoryId,
        rp.current_page AS currentPage,
        rp.total_pages AS totalPages,
        rp.progress_percent AS progressPercent,
        rp.last_read_at AS lastReadAt
      FROM reading_progress rp
      INNER JOIN books b ON b.id = rp.book_id
      WHERE rp.user_id = ?
        AND rp.is_completed = TRUE
        AND b.status = 'published'
      ORDER BY rp.last_read_at DESC`,
      [req.user.id],
    );

    const formatted = rows.map((r) => ({
      ...r,
      progress: {
        currentPage: r.currentPage,
        totalPages: r.totalPages,
        progressPercent: Number(r.progressPercent),
        percentage: Number(r.progressPercent),
        lastReadAt: r.lastReadAt,
      },
    }));

    return res.json({ success: true, data: formatted });
  } catch (error) {
    console.error("Completed books error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load completed books",
    });
  }
};

// GET /api/my-library/reading-progress/:bookId
export const getReadingProgress = async (req, res) => {
  try {
    const bookId = Number(req.params.bookId);

    if (!Number.isSafeInteger(bookId) || bookId < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    const [rows] = await db.execute(
      `SELECT
        rp.book_id AS bookId,
        rp.current_page AS currentPage,
        rp.total_pages AS totalPages,
        rp.progress_percent AS progressPercent,
        rp.is_completed AS isCompleted,
        rp.last_read_at AS lastReadAt
      FROM reading_progress rp
      INNER JOIN books b ON b.id = rp.book_id
      WHERE rp.user_id = ?
        AND rp.book_id = ?
        AND b.status = 'published'
      LIMIT 1`,
      [req.user.id, bookId],
    );

    return res.json({
      success: true,
      data: rows[0] || {
        bookId,
        currentPage: 1,
        totalPages: 0,
        progressPercent: 0,
        isCompleted: false,
        lastReadAt: null,
      },
    });
  } catch (error) {
    console.error("Get reading progress error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to get reading progress",
    });
  }
};

// PUT /api/my-library/reading-progress/:bookId
// Body: { "currentPage": 5, "totalPages": 120 }
export const saveReadingProgress = async (req, res) => {
  try {
    const bookId = Number(req.params.bookId);
    const currentPage = Number(req.body.currentPage);
    const totalPages = Number(req.body.totalPages);

    if (!Number.isSafeInteger(bookId) || bookId < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    if (
      !Number.isSafeInteger(currentPage) ||
      currentPage < 1 ||
      !Number.isSafeInteger(totalPages) ||
      totalPages < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "currentPage and totalPages must be valid positive integers",
      });
    }

    if (currentPage > totalPages) {
      return res.status(400).json({
        success: false,
        message: "Current page cannot exceed total pages",
      });
    }

    const [books] = await db.execute(
      `SELECT id FROM books
       WHERE id = ? AND status = 'published'
       LIMIT 1`,
      [bookId],
    );

    if (books.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Published book not found",
      });
    }

    const progressPercent = Number(
      ((currentPage / totalPages) * 100).toFixed(2),
    );
    const isCompleted = currentPage >= totalPages;

    await db.execute(
      `INSERT INTO reading_progress
        (user_id, book_id, current_page, total_pages, progress_percent, is_completed)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        current_page = VALUES(current_page),
        total_pages = VALUES(total_pages),
        progress_percent = VALUES(progress_percent),
        is_completed = VALUES(is_completed),
        last_read_at = CURRENT_TIMESTAMP`,
      [
        req.user.id,
        bookId,
        currentPage,
        totalPages,
        progressPercent,
        isCompleted,
      ],
    );

    return res.json({
      success: true,
      message: isCompleted
        ? "Book marked as completed"
        : "Reading progress saved",
      data: {
        bookId,
        currentPage,
        totalPages,
        progressPercent,
        isCompleted,
      },
    });
  } catch (error) {
    console.error("Save reading progress error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to save reading progress",
    });
  }
};

// POST /api/my-library/:bookId/bookmark
export const addBookmark = async (req, res) => {
  try {
    const bookId = Number(req.params.bookId);

    if (!Number.isSafeInteger(bookId) || bookId < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    const [books] = await db.execute(
      `SELECT id FROM books
       WHERE id = ? AND status = 'published'
       LIMIT 1`,
      [bookId],
    );

    if (books.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Published book not found",
      });
    }

    await db.execute(
      `INSERT INTO bookmarks (user_id, book_id)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE book_id = VALUES(book_id)`,
      [req.user.id, bookId],
    );

    return res.json({
      success: true,
      message: "Book bookmarked successfully",
    });
  } catch (error) {
    console.error("Add bookmark error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to bookmark this book",
    });
  }
};

// DELETE /api/my-library/:bookId/bookmark
export const removeBookmark = async (req, res) => {
  try {
    const bookId = Number(req.params.bookId);

    if (!Number.isSafeInteger(bookId) || bookId < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    const [result] = await db.execute(
      `DELETE FROM bookmarks
       WHERE user_id = ? AND book_id = ?`,
      [req.user.id, bookId],
    );

    return res.json({
      success: true,
      message: result.affectedRows
        ? "Bookmark removed successfully"
        : "Book was not bookmarked",
    });
  } catch (error) {
    console.error("Remove bookmark error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to remove bookmark",
    });
  }
};
export const getReadingHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const requestedLimit = Number(req.query.limit ?? 20);

    const limit = Number.isInteger(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 50)
      : 20;

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
        history.lastOpenedAt

      FROM (
        SELECT
          book_id,
          MAX(created_at) AS lastOpenedAt
        FROM book_read_events
        WHERE user_id = ?
        GROUP BY book_id
      ) history

      INNER JOIN books b
        ON b.id = history.book_id

      LEFT JOIN categories c
        ON c.id = b.category_id

      WHERE b.status = 'published'
        AND (b.category_id IS NULL OR c.is_active = TRUE)

      ORDER BY history.lastOpenedAt DESC, b.id DESC
      LIMIT ?`,
      [userId, limit],
    );

    return res.status(200).json({
      success: true,
      count: books.length,
      data: books,
    });
  } catch (error) {
    console.error("Reading history error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load reading history",
    });
  }
};

// POST /api/my-library/:bookId/bookmark/toggle or /api/my-library/bookmarks/:bookId/toggle
export const toggleBookmark = async (req, res) => {
  try {
    const bookId = Number(req.params.bookId || req.body.bookId || req.body.book_id);

    if (!Number.isSafeInteger(bookId) || bookId < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    const [existing] = await db.execute(
      `SELECT id FROM bookmarks WHERE user_id = ? AND book_id = ? LIMIT 1`,
      [req.user.id, bookId],
    );

    if (existing.length > 0) {
      await db.execute(
        `DELETE FROM bookmarks WHERE user_id = ? AND book_id = ?`,
        [req.user.id, bookId],
      );
      return res.json({
        success: true,
        isBookmarked: false,
        message: "Bookmark removed successfully",
      });
    } else {
      const [books] = await db.execute(
        `SELECT id FROM books WHERE id = ? AND status = 'published' LIMIT 1`,
        [bookId],
      );

      if (books.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Published book not found",
        });
      }

      await db.execute(
        `INSERT INTO bookmarks (user_id, book_id) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE book_id = VALUES(book_id)`,
        [req.user.id, bookId],
      );
      return res.json({
        success: true,
        isBookmarked: true,
        message: "Book bookmarked successfully",
      });
    }
  } catch (error) {
    console.error("Toggle bookmark error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to toggle bookmark",
    });
  }
};

// POST /api/my-library/recently-opened
export const recordRecentlyOpened = async (req, res) => {
  try {
    const bookId = Number(req.body.bookId || req.body.book_id || req.params.bookId);

    if (!Number.isSafeInteger(bookId) || bookId < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    const [books] = await db.execute(
      `SELECT id FROM books WHERE id = ? AND status = 'published' LIMIT 1`,
      [bookId],
    );

    if (books.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Published book not found",
      });
    }

    await db.execute(
      `INSERT INTO book_read_events (book_id, user_id) VALUES (?, ?)`,
      [bookId, req.user.id],
    );

    return res.status(200).json({
      success: true,
      message: "Recorded book open",
    });
  } catch (error) {
    console.error("Record opened error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to record book open",
    });
  }
};

