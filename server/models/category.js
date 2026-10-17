import db from "../config/db.js";

export const createCategory = async (name, slug, description) => {
  const [result] = await db.execute(
    `INSERT INTO categories (name, slug, description)
     VALUES (?, ?, ?)`,
    [name, slug, description || null],
  );

  return findCategoryById(result.insertId);
};

export const findCategoryById = async (id) => {
  const [rows] = await db.execute(
    `SELECT * FROM categories WHERE id = ? LIMIT 1`,
    [id],
  );

  return rows[0] || null;
};

export const getAllCategories = async (includeInactive = false) => {
  const query = includeInactive
    ? `SELECT * FROM categories ORDER BY name ASC`
    : `SELECT * FROM categories
       WHERE is_active = TRUE ORDER BY name ASC`;

  const [rows] = await db.execute(query);
  return rows;
};

export const updateCategory = async (id, name, slug, description) => {
  const [result] = await db.execute(
    `UPDATE categories
     SET name = ?, slug = ?, description = ?
     WHERE id = ?`,
    [name, slug, description || null, id],
  );

  return result.affectedRows > 0;
};

export const deactivateCategory = async (id) => {
  const [result] = await db.execute(
    `UPDATE categories SET is_active = FALSE WHERE id = ?`,
    [id],
  );

  return result.affectedRows > 0;
};

export const setCategoryStatus = async (id, isActive) => {
  const [result] = await db.execute(
    "UPDATE categories SET is_active = ? WHERE id = ?",
    [isActive, id],
  );

  return result;
};
