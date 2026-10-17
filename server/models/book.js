import db from "../config/db.js";

export const createBook = async ({
  title,
  author,
  description,
  pdfPath,
  coverImage,
  categoryId,
  publishedYear,
}) => {
  const [result] = await db.execute(
    `INSERT INTO books
      (title, author, description, cover_image, pdf_path, category_id, published_year)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      title,
      author || null,
      description || null,
      coverImage || null,
      pdfPath,
      categoryId || null,
      publishedYear ?? null,
    ],
  );

  return findBookById(result.insertId);
};

export const findBookById = async (id) => {
  const [rows] = await db.execute(
    `SELECT
       b.id,
       b.title,
       b.author,
       b.description,
       b.cover_image,
       b.pdf_path,
       b.category_id,
       b.published_year,
       b.status,
       b.is_featured,
       b.featured_order,
       b.created_at,
       b.updated_at,
       c.name AS category_name
     FROM books b
     LEFT JOIN categories c ON c.id = b.category_id
     WHERE b.id = ?
     LIMIT 1`,
    [id],
  );

  return rows[0] || null;
};

export const getPublishedBooks = async () => {
  const [rows] = await db.execute(
    `SELECT
       b.id,
       b.title,
       b.author,
       b.description,
       b.cover_image,
       b.pdf_path,
       b.category_id,
       b.published_year,
       b.is_featured,
       b.featured_order,
       b.created_at,
       c.name AS category_name
     FROM books b
     LEFT JOIN categories c ON c.id = b.category_id
     WHERE b.status = 'published'
     ORDER BY b.is_featured DESC, b.featured_order ASC, b.created_at DESC`,
  );

  return rows;
};

export const updateBookStatus = async (id, status) => {
  const [result] = await db.execute(
    `UPDATE books SET status = ? WHERE id = ?`,
    [status, id],
  );

  return result.affectedRows > 0;
};

export const getAllBooksForAdmin = async () => {
  const [rows] = await db.execute(
    `SELECT
       b.id,
       b.title,
       b.author,
       b.description,
       b.cover_image,
       b.pdf_path,
       b.category_id,
       b.published_year,
       b.status,
       b.is_featured,
       b.featured_order,
       b.created_at,
       b.updated_at,
       c.name AS category_name
     FROM books b
     LEFT JOIN categories c ON c.id = b.category_id
     ORDER BY b.created_at DESC`,
  );

  return rows;
};

export const updateBookDetails = async (
  id,
  {
    title,
    author,
    description,
    categoryId,
    publishedYear,
    pdfPath,
    coverImage,
  },
) => {
  const hasPdf = Boolean(pdfPath);
  const hasCover = coverImage !== undefined && coverImage !== null;

  const [result] = await db.execute(
    `UPDATE books
     SET title = ?,
         author = ?,
         description = ?,
         category_id = ?,
         published_year = ?,
         pdf_path = CASE WHEN ? = 1 THEN ? ELSE pdf_path END,
         cover_image = CASE WHEN ? = 1 THEN ? ELSE cover_image END
     WHERE id = ?`,
    [
      title,
      author || null,
      description || null,
      categoryId || null,
      publishedYear ?? null,
      hasPdf ? 1 : 0,
      pdfPath || null,
      hasCover ? 1 : 0,
      coverImage || null,
      id,
    ],
  );

  return result.affectedRows > 0;
};

export const deleteBookById = async (id) => {
  const [result] = await db.execute(`DELETE FROM books WHERE id = ?`, [id]);
  return result.affectedRows > 0;
};

// Check if a file is shared with another book
export const isFileReferencedByOtherBook = async (filePath, excludeBookId) => {
  if (!filePath || typeof filePath !== "string") return false;
  const [rows] = await db.execute(
    `SELECT id FROM books
     WHERE (pdf_path = ? OR cover_image = ?)
       AND id != ?
     LIMIT 1`,
    [filePath, filePath, excludeBookId],
  );

  return rows.length > 0;
};

export const searchPublishedBooks = async (query) => {
  const words = query.trim().split(/\s+/).filter(Boolean).slice(0, 8);

  if (!words.length) return [];

  const conditions = words.map(
    () => `
      (
        b.title LIKE ?
        OR b.author LIKE ?
        OR b.description LIKE ?
        OR c.name LIKE ?
      )
    `,
  );

  const params = [];

  for (const word of words) {
    const term = `%${word}%`;
    params.push(term, term, term, term);
  }

  const sql = `
    SELECT
      b.id,
      b.title,
      b.author,
      b.description,
      b.cover_image,
      b.pdf_path,
      b.published_year,
      b.category_id,
      b.is_featured,
      b.created_at,
      c.name AS category_name
    FROM books b
    LEFT JOIN categories c
      ON b.category_id = c.id
    WHERE b.status = 'published'
      AND (${conditions.join(" AND ")})
    ORDER BY
      CASE
        WHEN LOWER(b.title) = LOWER(?) THEN 1
        WHEN LOWER(b.title) LIKE LOWER(?) THEN 2
        WHEN LOWER(b.author) LIKE LOWER(?) THEN 3
        ELSE 4
      END,
      b.title ASC
    LIMIT 50
  `;

  params.push(query.trim(), `${query.trim()}%`, `%${query.trim()}%`);

  const [rows] = await db.execute(sql, params);
  return rows;
};
