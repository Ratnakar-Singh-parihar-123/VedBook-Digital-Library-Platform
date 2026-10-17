import db from "../config/db.js";

export const findUserByEmail = async (email) => {
  const [rows] = await db.execute(
    `SELECT id, name, email, phone, password_hash, profile_pic, created_at
     FROM users WHERE email = ? LIMIT 1`,
    [email],
  );

  return rows[0] || null;
};

export const findUserById = async (id) => {
  const [rows] = await db.execute(
    `SELECT id, name, email, phone, profile_pic, created_at, updated_at
     FROM users WHERE id = ? LIMIT 1`,
    [id],
  );

  return rows[0] || null;
};

export const createUser = async (name, email, phone, passwordHash) => {
  const [result] = await db.execute(
    `INSERT INTO users (name, email, phone, password_hash)
     VALUES (?, ?, ?, ?)`,
    [name, email, phone || null, passwordHash],
  );

  return findUserById(result.insertId);
};

export const updateUserProfile = async (id, name, phone) => {
  const [result] = await db.execute(
    `UPDATE users SET name = ?, phone = ? WHERE id = ?`,
    [name, phone || null, id],
  );

  return result.affectedRows > 0;
};

export const updateUserProfilePic = async (id, profilePic) => {
  const [result] = await db.execute(
    `UPDATE users SET profile_pic = ? WHERE id = ?`,
    [profilePic, id],
  );

  return result.affectedRows > 0;
};

export const findUserPasswordById = async (id) => {
  const [rows] = await db.execute(
    `SELECT id, password_hash FROM users WHERE id = ? LIMIT 1`,
    [id],
  );

  return rows[0] || null;
};

export const updateUserPassword = async (id, passwordHash) => {
  const [result] = await db.execute(
    `UPDATE users SET password_hash = ? WHERE id = ?`,
    [passwordHash, id],
  );

  return result.affectedRows > 0;
};

export const getUsersForAdmin = async ({ search, limit, offset }) => {
  const searchTerm = `%${search}%`;

  const [rows] = await db.execute(
    `SELECT id, name, email, phone, profile_pic, status, created_at, updated_at
     FROM users
     WHERE (
       name LIKE ? OR
       email LIKE ? OR
       COALESCE(phone, '') LIKE ?
     )
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [searchTerm, searchTerm, searchTerm, limit, offset],
  );

  return rows;
};

export const countUsersForAdmin = async (search) => {
  const searchTerm = `%${search}%`;

  const [rows] = await db.execute(
    `SELECT COUNT(*) AS total
     FROM users
     WHERE (
       name LIKE ? OR
       email LIKE ? OR
       COALESCE(phone, '') LIKE ?
     )`,
    [searchTerm, searchTerm, searchTerm],
  );

  return Number(rows[0].total);
};

export const getUserDetailsForAdmin = async (id) => {
  const [rows] = await db.execute(
    `SELECT id, name, email, phone, profile_pic, status, created_at, updated_at
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [id],
  );

  if (!rows[0]) return null;

  const user = rows[0];

  // Attach reading & library stats
  try {
    const [[readStats]] = await db.execute(
      `SELECT COUNT(DISTINCT book_id) AS booksRead, COUNT(*) AS totalReads
       FROM book_read_events
       WHERE user_id = ?`,
      [id],
    );
    const [[favStats]] = await db.execute(
      `SELECT COUNT(*) AS bookmarksCount FROM bookmarks WHERE user_id = ?`,
      [id],
    );
    const [[revStats]] = await db.execute(
      `SELECT COUNT(*) AS reviewsCount FROM reviews WHERE user_id = ?`,
      [id],
    );

    user.booksRead = Number(readStats?.booksRead || 0);
    user.totalReads = Number(readStats?.totalReads || 0);
    user.bookmarksCount = Number(favStats?.bookmarksCount || 0);
    user.reviewsCount = Number(revStats?.reviewsCount || 0);
  } catch (err) {
    console.error("Error fetching user stats:", err.message);
  }

  return user;
};

export const updateUserStatus = async (id, status) => {
  const [result] = await db.execute(
    `UPDATE users SET status = ? WHERE id = ?`,
    [status, id],
  );
  return result.affectedRows > 0;
};

export const deleteUserById = async (id) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    await connection.execute(`DELETE FROM bookmarks WHERE user_id = ?`, [id]);
    await connection.execute(`DELETE FROM reading_progress WHERE user_id = ?`, [id]);
    await connection.execute(`DELETE FROM reviews WHERE user_id = ?`, [id]);
    await connection.execute(`UPDATE book_read_events SET user_id = NULL WHERE user_id = ?`, [id]);
    const [result] = await connection.execute(`DELETE FROM users WHERE id = ?`, [id]);

    await connection.commit();
    return result.affectedRows > 0;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
