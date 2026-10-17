import db from "../config/db.js";

// Find admin by email
export const findAdminByEmail = async (email) => {
  const [rows] = await db.execute(
    `SELECT id, name, email, password_hash, profile_pic
     FROM admins
     WHERE email = ?
     LIMIT 1`,
    [email],
  );

  return rows[0] || null;
};

// Find admin by ID
export const findAdminById = async (id) => {
  const [rows] = await db.execute(
    `SELECT id, name, email, profile_pic, created_at
     FROM admins
     WHERE id = ?
     LIMIT 1`,
    [id],
  );

  return rows[0] || null;
};

// Create admin
export const createAdmin = async (
  name,
  email,
  passwordHash,
  profilePic = null,
) => {
  const [result] = await db.execute(
    `INSERT INTO admins
      (name, email, password_hash, profile_pic)
     VALUES (?, ?, ?, ?)`,
    [name, email, passwordHash, profilePic],
  );

  return findAdminById(result.insertId);
};

// Find password hash for authenticated admin
export const findAdminPasswordById = async (id) => {
  const [rows] = await db.execute(
    `SELECT id, password_hash
     FROM admins
     WHERE id = ?
     LIMIT 1`,
    [id],
  );

  return rows[0] || null;
};

// Update admin password
export const updateAdminPassword = async (id, passwordHash) => {
  const [result] = await db.execute(
    `UPDATE admins
     SET password_hash = ?
     WHERE id = ?`,
    [passwordHash, id],
  );

  return result.affectedRows > 0;
};

// Update admin profile picture
export const updateAdminProfilePic = async (id, profilePic) => {
  const [result] = await db.execute(
    `UPDATE admins
     SET profile_pic = ?
     WHERE id = ?`,
    [profilePic, id],
  );

  return result.affectedRows > 0;
};

// Update admin name and email
export const updateAdminProfile = async (id, name, email) => {
  const [result] = await db.execute(
    `UPDATE admins
     SET name = ?, email = ?
     WHERE id = ?`,
    [name, email, id],
  );

  return result.affectedRows > 0;
};
