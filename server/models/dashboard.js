import db from "../config/db.js";

export const getDashboardOverview = async () => {
  const [[bookCounts]] = await db.execute(`
    SELECT
      COUNT(*) AS totalBooks,
      COALESCE(SUM(status = 'published'), 0) AS publishedBooks,
      COALESCE(SUM(status = 'draft'), 0) AS draftBooks,
      COALESCE(SUM(status = 'archived'), 0) AS archivedBooks
    FROM books
  `);

  const [[categoryCounts]] = await db.execute(`
    SELECT
      COUNT(*) AS totalCategories,
      COALESCE(SUM(is_active = TRUE), 0) AS activeCategories
    FROM categories
  `);

  const [[eventCounts]] = await db.execute(`
    SELECT
      COUNT(*) AS totalReadingSessions,
      COUNT(DISTINCT user_id) AS uniqueRegisteredReaders
    FROM book_read_events
  `);

  const [[userTable]] = await db.execute(`
    SELECT COUNT(*) AS tableExists
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = 'users'
  `);

  let totalUsers = 0;
  let newUsersLast30Days = 0;

  if (Number(userTable.tableExists) > 0) {
    const [[createdAtColumn]] = await db.execute(`
      SELECT COUNT(*) AS columnExists
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'users'
        AND column_name = 'created_at'
    `);

    const [[users]] = await db.execute(
      Number(createdAtColumn.columnExists) > 0
        ? `SELECT
             COUNT(*) AS totalUsers,
             COALESCE(SUM(
               created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
             ), 0) AS newUsersLast30Days
           FROM users`
        : `SELECT COUNT(*) AS totalUsers FROM users`,
    );

    totalUsers = Number(users.totalUsers);
    newUsersLast30Days = Number(users.newUsersLast30Days || 0);
  }

  return {
    books: {
      total: Number(bookCounts.totalBooks),
      published: Number(bookCounts.publishedBooks),
      drafts: Number(bookCounts.draftBooks),
      archived: Number(bookCounts.archivedBooks),
    },
    categories: {
      total: Number(categoryCounts.totalCategories),
      active: Number(categoryCounts.activeCategories),
    },
    users: {
      total: totalUsers,
      newLast30Days: newUsersLast30Days,
    },
    reading: {
      totalSessions: Number(eventCounts.totalReadingSessions),
      uniqueRegisteredReaders: Number(eventCounts.uniqueRegisteredReaders),
    },
  };
};

export const getReadingTrend = async (days = 7) => {
  const [rows] = await db.execute(
    `SELECT
       DATE(created_at) AS date,
       COUNT(*) AS sessions
     FROM book_read_events
     WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     GROUP BY DATE(created_at)
     ORDER BY date ASC`,
    [days],
  );

  return rows.map((row) => ({
    date: row.date,
    sessions: Number(row.sessions),
  }));
};

export const getTrendingBooks = async (days = 30, limit = 10) => {
  const [rows] = await db.execute(
    `SELECT
       b.id,
       b.title,
       b.author,
       b.cover_image,
       COUNT(e.id) AS readingSessions
     FROM book_read_events e
     INNER JOIN books b ON b.id = e.book_id
     WHERE e.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       AND b.status = 'published'
     GROUP BY b.id, b.title, b.author, b.cover_image
     ORDER BY readingSessions DESC, b.title ASC
     LIMIT ?`,
    [days, limit],
  );

  return rows.map((row) => ({
    ...row,
    id: Number(row.id),
    readingSessions: Number(row.readingSessions),
  }));
};

export const getRecentAdminActivity = async (limit = 10) => {
  const [rows] = await db.execute(
    `SELECT
       id,
       admin_id AS adminId,
       action,
       entity_type AS entityType,
       entity_id AS entityId,
       details,
       created_at AS createdAt
     FROM admin_activity_logs
     ORDER BY created_at DESC
     LIMIT ?`,
    [limit],
  );

  return rows;
};

export const recordBookRead = async (bookId, userId = null) => {
  await db.execute(
    `INSERT INTO book_read_events (book_id, user_id)
     VALUES (?, ?)`,
    [bookId, userId],
  );
};

export const logAdminActivity = async ({
  adminId,
  action,
  entityType,
  entityId = null,
  details = null,
}) => {
  await db.execute(
    `INSERT INTO admin_activity_logs
      (admin_id, action, entity_type, entity_id, details)
     VALUES (?, ?, ?, ?, ?)`,
    [
      adminId || null,
      action,
      entityType,
      entityId,
      details ? JSON.stringify(details) : null,
    ],
  );
};

export const getUserGrowth = async (days = 30) => {
  const [[table]] = await db.execute(`
    SELECT COUNT(*) AS tableExists
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = 'users'
  `);

  if (Number(table.tableExists) === 0) {
    return [];
  }

  const [[column]] = await db.execute(`
    SELECT COUNT(*) AS columnExists
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'users'
      AND column_name = 'created_at'
  `);

  if (Number(column.columnExists) === 0) {
    return [];
  }

  const [rows] = await db.execute(
    `SELECT
       DATE(created_at) AS date,
       COUNT(*) AS newUsers
     FROM users
     WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     GROUP BY DATE(created_at)
     ORDER BY date ASC`,
    [days],
  );

  return rows.map((row) => ({
    date: row.date,
    newUsers: Number(row.newUsers),
  }));
};
