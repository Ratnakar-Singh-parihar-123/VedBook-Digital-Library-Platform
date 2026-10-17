import db from "../config/db.js";
import path from "node:path";
import { createReadStream } from "node:fs";
import { stat, unlink } from "node:fs/promises";

import { generateBookCover } from "../utils/generateBookCover.js";

import {
  createBook,
  findBookById,
  getPublishedBooks,
  getAllBooksForAdmin,
  updateBookStatus,
  updateBookDetails,
  deleteBookById,
  searchPublishedBooks,
} from "../models/book.js";

import { recordBookRead, logAdminActivity } from "../models/dashboard.js";

// Helpers

const validId = (id) => /^\d+$/.test(String(id)) && Number(id) > 0;

const handleError = (res, error, message) => {
  console.error(message, error.message);

  if (
    error.code === "ER_NO_SUCH_TABLE" ||
    error.code === "ER_BAD_FIELD_ERROR"
  ) {
    return res.status(500).json({
      success: false,
      message:
        "Database schema mismatch. Check the database tables and columns.",
    });
  }

  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.statusCode ? error.message : "Something went wrong",
  });
};

// Analytics must not break the main operation.
const safeLogAdminActivity = async (activity) => {
  try {
    await logAdminActivity(activity);
  } catch (error) {
    console.error("Could not log admin action:", error.message);
  }
};

// Safely remove a stored PDF.
const removeStoredBookPdf = async (storedPath) => {
  if (!storedPath) return;

  const uploadDirectory = path.resolve(process.cwd(), "uploads/books");

  const absolutePath = path.resolve(process.cwd(), storedPath);

  const relativePath = path.relative(uploadDirectory, absolutePath);

  if (
    !relativePath ||
    relativePath.startsWith("..") ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error("Invalid stored PDF path");
  }

  try {
    await unlink(absolutePath);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
};

// Safely remove a stored cover.
const removeStoredBookCover = async (storedPath) => {
  if (!storedPath) return;

  const coverDirectory = path.resolve(process.cwd(), "uploads/covers");

  const absolutePath = path.resolve(process.cwd(), storedPath);

  const relativePath = path.relative(coverDirectory, absolutePath);

  if (
    !relativePath ||
    relativePath.startsWith("..") ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error("Invalid stored cover path");
  }

  try {
    await unlink(absolutePath);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
};

// Clean up a newly uploaded PDF.
const cleanupUploadedPdf = async (req) => {
  if (!req.file) return;

  try {
    await removeStoredBookPdf(`uploads/books/${req.file.filename}`);
  } catch (error) {
    console.error("Uploaded PDF cleanup error:", error.message);
  }
};

// Validation response that also cleans up Multer's uploaded PDF.
const rejectRequest = async (res, req, message, status = 400) => {
  await cleanupUploadedPdf(req);

  return res.status(status).json({
    success: false,
    message,
  });
};

// Public: List published books

export const listPublishedBooks = async (req, res) => {
  try {
    const books = await getPublishedBooks();

    return res.status(200).json({
      success: true,
      count: books.length,
      books,
    });
  } catch (error) {
    return handleError(res, error, "List books error:");
  }
};

// Admin: List all books

export const listAdminBooks = async (req, res) => {
  try {
    const books = await getAllBooksForAdmin();

    return res.status(200).json({
      success: true,
      count: books.length,
      books,
    });
  } catch (error) {
    return handleError(res, error, "Admin books error:");
  }
};

// Admin: Add a new book as draft

export const addBook = async (req, res) => {
  let uploadedPdfPath = req.file ? `uploads/books/${req.file.filename}` : null;

  let coverImage = null;

  try {
    const {
      title,
      author = "",
      description = "",
      categoryId = "",
      publishedYear = "",
    } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      title.trim().length > 255 ||
      typeof author !== "string" ||
      typeof description !== "string"
    ) {
      return await rejectRequest(
        res,
        req,
        "A valid title, author and description are required",
      );
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a PDF file using the 'pdf' field",
      });
    }

    let parsedCategoryId = null;

    if (categoryId !== "") {
      if (!validId(categoryId)) {
        return await rejectRequest(res, req, "Invalid category ID");
      }

      parsedCategoryId = Number(categoryId);

      const [categories] = await db.execute(
        `SELECT id
         FROM categories
         WHERE id = ? AND is_active = TRUE
         LIMIT 1`,
        [parsedCategoryId],
      );

      if (!categories.length) {
        return await rejectRequest(
          res,
          req,
          "Selected category does not exist or is inactive",
        );
      }
    }

    let parsedYear = null;

    if (publishedYear !== "") {
      const year = Number(publishedYear);
      const currentYear = new Date().getFullYear();

      if (!Number.isInteger(year) || year < 1000 || year > currentYear) {
        return await rejectRequest(res, req, "Invalid publication year");
      }

      parsedYear = year;
    }

    // Generate a cover from the PDF's first page.
    // If cover generation fails, the book can still be saved.
    try {
      coverImage = await generateBookCover(req.file.path, req.file.filename);
    } catch (coverError) {
      console.error("Cover generation failed:", coverError.message);

      coverImage = null;
    }

    const book = await createBook({
      title: title.trim(),
      author: author.trim(),
      description: description.trim(),
      pdfPath: uploadedPdfPath,
      coverImage,
      categoryId: parsedCategoryId,
      publishedYear: parsedYear,
    });

    await safeLogAdminActivity({
      adminId: req.user.id,
      action: "upload",
      entityType: "book",
      entityId: book.id,
      details: {
        title: title.trim(),
      },
    });

    return res.status(201).json({
      success: true,
      message: "Book uploaded as draft successfully",
      book,
    });
  } catch (error) {
    // The database operation failed; remove newly created files.
    if (uploadedPdfPath) {
      try {
        await removeStoredBookPdf(uploadedPdfPath);
      } catch (cleanupError) {
        console.error("PDF cleanup error:", cleanupError.message);
      }
    }

    if (coverImage) {
      try {
        await removeStoredBookCover(coverImage);
      } catch (cleanupError) {
        console.error("Cover cleanup error:", cleanupError.message);
      }
    }

    return handleError(res, error, "Create book error:");
  }
};

// Admin: Publish a book

export const publishBook = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    const book = await findBookById(Number(id));

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    if (book.status === "published") {
      return res.status(200).json({
        success: true,
        message: "Book is already published",
      });
    }

    await updateBookStatus(Number(id), "published");

    await safeLogAdminActivity({
      adminId: req.user.id,
      action: "publish",
      entityType: "book",
      entityId: Number(id),
      details: {
        title: book.title,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Book published successfully",
    });
  } catch (error) {
    return handleError(res, error, "Publish book error:");
  }
};

// Admin: Unpublish a book

export const unpublishBook = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    const book = await findBookById(Number(id));

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    if (book.status === "draft") {
      return res.status(200).json({
        success: true,
        message: "Book is already a draft",
      });
    }

    await updateBookStatus(Number(id), "draft");

    await safeLogAdminActivity({
      adminId: req.user.id,
      action: "unpublish",
      entityType: "book",
      entityId: Number(id),
      details: {
        title: book.title,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Book moved to draft successfully",
    });
  } catch (error) {
    return handleError(res, error, "Unpublish book error:");
  }
};

// Public: Read a published book's PDF

export const readPublishedBookPdf = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    const book = await findBookById(Number(id));

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    if (book.status !== "published") {
      return res.status(403).json({
        success: false,
        message: "This book is not available for reading",
      });
    }

    const uploadDirectory = path.resolve(process.cwd(), "uploads/books");

    const pdfPath = path.resolve(process.cwd(), book.pdf_path);

    const relativePath = path.relative(uploadDirectory, pdfPath);

    if (
      !relativePath ||
      relativePath.startsWith("..") ||
      path.isAbsolute(relativePath)
    ) {
      return res.status(403).json({
        success: false,
        message: "Invalid PDF file path",
      });
    }

    const fileInfo = await stat(pdfPath);

    if (!fileInfo.isFile()) {
      return res.status(404).json({
        success: false,
        message: "PDF file not found",
      });
    }

    // Reading analytics should not block PDF delivery.
    try {
      await recordBookRead(book.id, req.user?.id ?? null);
    } catch (error) {
      console.error("Could not record reading event:", error.message);
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="book-${book.id}.pdf"`,
    );
    res.setHeader("Content-Length", fileInfo.size);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, no-store");

    const pdfStream = createReadStream(pdfPath);

    pdfStream.on("error", (error) => {
      console.error("PDF stream error:", error.message);

      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Unable to read PDF",
        });
      } else {
        res.destroy(error);
      }
    });

    pdfStream.pipe(res);
  } catch (error) {
    if (error.code === "ENOENT") {
      return res.status(404).json({
        success: false,
        message: "PDF file not found on server",
      });
    }

    return handleError(res, error, "Read PDF error:");
  }
};

// Admin: Get one book, including drafts

export const getAdminBookDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    const book = await findBookById(Number(id));

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    return res.status(200).json({
      success: true,
      book,
    });
  } catch (error) {
    return handleError(res, error, "Get admin book details error:");
  }
};

// Admin: Edit book details; PDF is optional

export const editBook = async (req, res) => {
  let uploadedPdfPath = req.file ? `uploads/books/${req.file.filename}` : null;

  let uploadedCoverPath = null;

  try {
    const { id } = req.params;

    if (!validId(id)) {
      return await rejectRequest(res, req, "Invalid book ID");
    }

    const bookId = Number(id);
    const existingBook = await findBookById(bookId);

    if (!existingBook) {
      return await rejectRequest(res, req, "Book not found", 404);
    }

    const {
      title,
      author = "",
      description = "",
      categoryId = "",
      publishedYear = "",
    } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      title.trim().length > 255 ||
      typeof author !== "string" ||
      typeof description !== "string"
    ) {
      return await rejectRequest(
        res,
        req,
        "Valid title, author and description are required",
      );
    }

    let parsedCategoryId = null;

    if (categoryId !== "") {
      if (!validId(categoryId)) {
        return await rejectRequest(res, req, "Invalid category ID");
      }

      parsedCategoryId = Number(categoryId);

      const [categories] = await db.execute(
        `SELECT id
         FROM categories
         WHERE id = ? AND is_active = TRUE
         LIMIT 1`,
        [parsedCategoryId],
      );

      if (!categories.length) {
        return await rejectRequest(
          res,
          req,
          "Selected category does not exist or is inactive",
        );
      }
    }

    let parsedYear = null;

    if (publishedYear !== "") {
      const year = Number(publishedYear);
      const currentYear = new Date().getFullYear();

      if (!Number.isInteger(year) || year < 1000 || year > currentYear) {
        return await rejectRequest(res, req, "Invalid publication year");
      }

      parsedYear = year;
    }

    // Generate a cover only when a replacement PDF is uploaded.
    if (req.file) {
      try {
        uploadedCoverPath = await generateBookCover(
          req.file.path,
          req.file.filename,
        );
      } catch (coverError) {
        console.error(
          "Replacement cover generation failed:",
          coverError.message,
        );

        const error = new Error(
          "Could not generate a cover for the replacement PDF.",
        );

        error.statusCode = 500;
        throw error;
      }
    }

    const updated = await updateBookDetails(bookId, {
      title: title.trim(),
      author: author.trim(),
      description: description.trim(),
      categoryId: parsedCategoryId,
      publishedYear: parsedYear,
      pdfPath: uploadedPdfPath,
      coverImage: uploadedCoverPath,
    });

    if (!updated) {
      const error = new Error("Book update could not be completed");
      error.statusCode = 500;
      throw error;
    }

    // Remove old files only after the database update succeeds.
    if (uploadedPdfPath) {
      try {
        await removeStoredBookPdf(existingBook.pdf_path);
      } catch (error) {
        console.error("Old PDF cleanup error:", error.message);
      }

      try {
        await removeStoredBookCover(existingBook.cover_image);
      } catch (error) {
        console.error("Old cover cleanup error:", error.message);
      }
    }

    const updatedBook = await findBookById(bookId);

    await safeLogAdminActivity({
      adminId: req.user.id,
      action: "update",
      entityType: "book",
      entityId: bookId,
      details: {
        title: updatedBook.title,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Book updated successfully",
      book: updatedBook,
    });
  } catch (error) {
    // The update failed; clean up replacement files.
    if (uploadedPdfPath) {
      try {
        await removeStoredBookPdf(uploadedPdfPath);
      } catch (cleanupError) {
        console.error("New PDF cleanup error:", cleanupError.message);
      }
    }

    if (uploadedCoverPath) {
      try {
        await removeStoredBookCover(uploadedCoverPath);
      } catch (cleanupError) {
        console.error("New cover cleanup error:", cleanupError.message);
      }
    }

    return handleError(res, error, "Edit book error:");
  }
};

// Admin: Delete a book, its PDF and its cover

export const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    const bookId = Number(id);
    const book = await findBookById(bookId);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    await deleteBookById(bookId);

    try {
      await removeStoredBookPdf(book.pdf_path);
    } catch (error) {
      console.error("Deleted book PDF cleanup error:", error.message);
    }

    try {
      await removeStoredBookCover(book.cover_image);
    } catch (error) {
      console.error("Deleted book cover cleanup error:", error.message);
    }

    await safeLogAdminActivity({
      adminId: req.user.id,
      action: "delete",
      entityType: "book",
      entityId: bookId,
      details: {
        title: book.title,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Book deleted successfully",
    });
  } catch (error) {
    return handleError(res, error, "Delete book error:");
  }
};

export const searchBooks = async (req, res, next) => {
  try {
    const q = req.query.q?.trim();

    if (!q) {
      return res.status(200).json({
        success: true,
        message: "No search query provided.",
        count: 0,
        data: [],
      });
    }

    const books = await searchPublishedBooks(q);

    return res.status(200).json({
      success: true,
      message: books.length
        ? "Matching books found."
        : "No matching books found.",
      count: books.length,
      data: books,
    });
  } catch (error) {
    next(error);
  }
};

// Get single book details                                           //
// GET /api/books/:id                                                //

export const getBookById = async (req, res) => {
  try {
    const bookId = Number.parseInt(req.params.id, 10);

    if (!Number.isSafeInteger(bookId) || bookId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    const [rows] = await db.query(
      `SELECT
         b.id,
         b.title,
         b.author,
         b.description,
         b.cover_image,
         b.pdf_path,
         b.category_id,
         b.published_year,
         b.created_at,
         b.status,
         b.is_featured,
         b.featured_order,
         c.name AS category_name
       FROM books b
       LEFT JOIN categories c ON c.id = b.category_id
       WHERE b.id = ?
       LIMIT 1`,
      [bookId],
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    const book = rows[0];

    return res.status(200).json({
      success: true,
      data: {
        id: book.id,
        title: book.title,
        author: book.author || "Unknown author",
        description: book.description || "",
        coverImage: book.cover_image || null,
        pdfPath: book.pdf_path || null,
        categoryId: book.category_id,
        categoryName: book.category_name || "General",
        publishedYear: book.published_year || null,
        status: book.status,
        isFeatured: Boolean(book.is_featured),
        featuredOrder: book.featured_order,
        createdAt: book.created_at,
      },
    });
  } catch (error) {
    console.error("Get book details error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch book details",
    });
  }
};

// Get book content (PDF)                                            //
// GET /api/books/:id/content                                        //

export const getBookContent = async (req, res) => {
  try {
    const bookId = Number.parseInt(req.params.id, 10);

    if (!Number.isSafeInteger(bookId) || bookId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    const [rows] = await db.query(
      `SELECT id, title, pdf_path
       FROM books
       WHERE id = ?
       LIMIT 1`,
      [bookId],
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    const book = rows[0];

    if (!book.pdf_path) {
      return res.status(200).json({
        success: true,
        data: { type: "none" },
      });
    }

    //Relative path ko normalize karo //
    let pdfPath = String(book.pdf_path).trim();

    //Agar already full URL hai to as-is bhejo //
    const isAbsolute = /^https?:\/\//i.test(pdfPath);

    //Agar relative hai to leading slash ensure karo //
    if (!isAbsolute && !pdfPath.startsWith("/")) {
      pdfPath = `/${pdfPath}`;
    }

    return res.status(200).json({
      success: true,
      data: {
        type: "pdf",
        pdfPath: isAbsolute ? pdfPath : pdfPath,
        pdfUrl: isAbsolute ? pdfPath : pdfPath, // both keys for safety
      },
    });
  } catch (error) {
    console.error("Get book content error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch book content",
    });
  }
};
