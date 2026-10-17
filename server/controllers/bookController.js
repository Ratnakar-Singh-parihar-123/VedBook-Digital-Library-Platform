import db from "../config/db.js";
import { createReadStream } from "node:fs";
import { generateBookCover } from "../utils/generateBookCover.js";
import {
  safeDeleteStoredFile,
  resolveStoragePath,
  getFileStat,
  isRemoteUrl,
} from "../utils/storage.js";

import {
  createBook,
  findBookById,
  getPublishedBooks,
  getAllBooksForAdmin,
  updateBookStatus,
  updateBookDetails,
  deleteBookById,
  isFileReferencedByOtherBook,
  searchPublishedBooks,
} from "../models/book.js";

import { recordBookRead, logAdminActivity } from "../models/dashboard.js";

// Helper: validate integer ID
const validId = (id) => {
  const n = Number(id);
  return Number.isSafeInteger(n) && n > 0;
};

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

const safeLogAdminActivity = async (activity) => {
  try {
    await logAdminActivity(activity);
  } catch (error) {
    console.error("Could not log admin action:", error.message);
  }
};

// Cleanup uploaded files on error
const cleanupUploadedFiles = async (req) => {
  const pdfFile = req.files?.pdf?.[0] || (req.file?.fieldname === "pdf" ? req.file : null);
  const coverFile =
    req.files?.cover?.[0] ||
    req.files?.coverImage?.[0] ||
    (req.file && ["cover", "coverImage"].includes(req.file.fieldname) ? req.file : null);

  if (pdfFile) {
    await safeDeleteStoredFile(`uploads/books/${pdfFile.filename}`);
  }
  if (coverFile) {
    await safeDeleteStoredFile(`uploads/covers/${coverFile.filename}`);
  }
};

const rejectRequest = async (res, req, message, status = 400) => {
  await cleanupUploadedFiles(req);
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

// Admin: List all books (drafts + published)
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
  const pdfFile =
    req.files?.pdf?.[0] || (req.file?.fieldname === "pdf" ? req.file : req.file);
  const coverFile =
    req.files?.cover?.[0] ||
    req.files?.coverImage?.[0] ||
    (req.file && ["cover", "coverImage"].includes(req.file.fieldname)
      ? req.file
      : null);

  let uploadedPdfPath = pdfFile ? `uploads/books/${pdfFile.filename}` : null;
  let coverImage = coverFile ? `uploads/covers/${coverFile.filename}` : null;

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

    if (!pdfFile) {
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

    // If no cover was manually uploaded, auto-generate from PDF first page
    if (!coverImage && pdfFile) {
      try {
        coverImage = await generateBookCover(pdfFile.path, pdfFile.filename);
      } catch (coverError) {
        console.error("Cover generation failed:", coverError.message);
        coverImage = null;
      }
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
    if (uploadedPdfPath) {
      await safeDeleteStoredFile(uploadedPdfPath);
    }
    if (coverImage) {
      await safeDeleteStoredFile(coverImage);
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

    if (!book.pdf_path) {
      return res.status(404).json({
        success: false,
        message: "No PDF file associated with this book",
      });
    }

    // Handle remote external URL (e.g. S3, Cloudinary)
    if (isRemoteUrl(book.pdf_path)) {
      try {
        await recordBookRead(book.id, req.user?.id ?? null);
      } catch (err) {
        console.error("Could not record reading event:", err.message);
      }
      return res.redirect(book.pdf_path);
    }

    const absolutePath = resolveStoragePath(book.pdf_path);
    if (!absolutePath) {
      return res.status(403).json({
        success: false,
        message: "Invalid PDF storage path",
      });
    }

    const fileInfo = await getFileStat(book.pdf_path);

    if (!fileInfo || !fileInfo.isFile()) {
      return res.status(404).json({
        success: false,
        message:
          "PDF document is currently unavailable on server storage. It may need to be re-uploaded.",
      });
    }

    // Non-blocking reading analytics
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
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, max-age=3600");

    const pdfStream = createReadStream(absolutePath);

    pdfStream.on("error", (error) => {
      console.error("PDF stream error:", error.message);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Unable to read PDF stream",
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

// Admin: Get one book details including drafts
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

// Admin: Edit book details; PDF and cover are optional
export const editBook = async (req, res) => {
  const pdfFile =
    req.files?.pdf?.[0] || (req.file?.fieldname === "pdf" ? req.file : null);
  const coverFile =
    req.files?.cover?.[0] ||
    req.files?.coverImage?.[0] ||
    (req.file && ["cover", "coverImage"].includes(req.file.fieldname)
      ? req.file
      : null);

  let uploadedPdfPath = pdfFile ? `uploads/books/${pdfFile.filename}` : null;
  let uploadedCoverPath = coverFile
    ? `uploads/covers/${coverFile.filename}`
    : null;

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

    // Generate cover if replacement PDF was uploaded and no custom cover provided
    if (pdfFile && !uploadedCoverPath) {
      try {
        uploadedCoverPath = await generateBookCover(
          pdfFile.path,
          pdfFile.filename,
        );
      } catch (coverError) {
        console.warn(
          "Replacement cover generation failed (keeping existing):",
          coverError.message,
        );
        uploadedCoverPath = null;
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

    // Clean up old PDF if replaced AND not shared with another book
    if (uploadedPdfPath && existingBook.pdf_path) {
      const isShared = await isFileReferencedByOtherBook(
        existingBook.pdf_path,
        bookId,
      );
      if (!isShared) {
        await safeDeleteStoredFile(existingBook.pdf_path);
      }
    }

    // Clean up old cover if replaced AND not shared
    if (uploadedCoverPath && existingBook.cover_image) {
      const isShared = await isFileReferencedByOtherBook(
        existingBook.cover_image,
        bookId,
      );
      if (!isShared) {
        await safeDeleteStoredFile(existingBook.cover_image);
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
    if (uploadedPdfPath) {
      await safeDeleteStoredFile(uploadedPdfPath);
    }
    if (uploadedCoverPath) {
      await safeDeleteStoredFile(uploadedCoverPath);
    }
    return handleError(res, error, "Edit book error:");
  }
};

// Admin: Delete a book and its unshared files safely
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

    // Check if other books share these files before deleting the book
    const pdfShared = book.pdf_path
      ? await isFileReferencedByOtherBook(book.pdf_path, bookId)
      : true;
    const coverShared = book.cover_image
      ? await isFileReferencedByOtherBook(book.cover_image, bookId)
      : true;

    // Delete database record first
    await deleteBookById(bookId);

    // Safely delete unshared files
    if (book.pdf_path && !pdfShared) {
      await safeDeleteStoredFile(book.pdf_path);
    }

    if (book.cover_image && !coverShared) {
      await safeDeleteStoredFile(book.cover_image);
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

// Public: Get single book details
// GET /api/books/:id
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

// Get book content (PDF path/url)
// GET /api/books/:id/content
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
      `SELECT id, title, pdf_path, status
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

    let pdfPath = String(book.pdf_path).trim();
    const isAbsolute = isRemoteUrl(pdfPath);

    if (!isAbsolute && !pdfPath.startsWith("/")) {
      pdfPath = `/${pdfPath}`;
    }

    return res.status(200).json({
      success: true,
      data: {
        type: "pdf",
        pdfPath,
        pdfUrl: isAbsolute ? pdfPath : `/api/books/${book.id}/read`,
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
