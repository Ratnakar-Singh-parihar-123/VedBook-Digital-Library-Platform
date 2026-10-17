import { Router } from "express";

import {
  addBook,
  listPublishedBooks,
  listAdminBooks,
  getAdminBookDetails,
  editBook,
  deleteBook,
  publishBook,
  unpublishBook,
  readPublishedBookPdf,
  searchBooks,
  getBookById,
  getBookContent,
} from "../controllers/bookController.js";

import { verifyAdminToken } from "../middleware/authMiddleware.js";
import { optionalUserToken } from "../middleware/optionalUserMiddleware.js";
import bookUpload from "../middleware/bookUpload.js";

const router = Router();

// Allow uploading PDF and optional cover image
const bookUploadFields = bookUpload.fields([
  { name: "pdf", maxCount: 1 },
  { name: "cover", maxCount: 1 },
  { name: "coverImage", maxCount: 1 },
]);

// Public routes
router.get("/", listPublishedBooks);
router.get("/search", searchBooks);

// Admin routes — specific /admin routes before generic /:id
router.get("/admin", verifyAdminToken, listAdminBooks);
router.get("/admin/:id", verifyAdminToken, getAdminBookDetails);

// Book content and details
router.get("/:id/content", getBookContent);
router.get("/:id", getBookById);
router.get("/:id/read", optionalUserToken, readPublishedBookPdf);

// Create, update, publish and delete
router.post("/", verifyAdminToken, bookUploadFields, addBook);

router.patch("/:id/publish", verifyAdminToken, publishBook);
router.patch("/:id/unpublish", verifyAdminToken, unpublishBook);
router.patch("/:id", verifyAdminToken, bookUploadFields, editBook);

router.delete("/:id", verifyAdminToken, deleteBook);

export default router;
