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
  getBookById, // ← NEW
  getBookContent,
} from "../controllers/bookController.js";

import { verifyAdminToken } from "../middleware/authMiddleware.js";
import { optionalUserToken } from "../middleware/optionalUserMiddleware.js";
import bookUpload from "../middleware/bookUpload.js";

const router = Router();

// Public routes
router.get("/", listPublishedBooks);
router.get("/search", searchBooks);

// Admin routes — generic /:id route se pehle
router.get("/admin", verifyAdminToken, listAdminBooks);
router.get("/admin/:id", verifyAdminToken, getAdminBookDetails);

// Book content and details
router.get("/:id/content", getBookContent);
router.get("/:id", getBookById);
router.get("/:id/read", optionalUserToken, readPublishedBookPdf);

// Create, update, publish and delete
router.post("/", verifyAdminToken, bookUpload.single("pdf"), addBook);

router.patch("/:id/publish", verifyAdminToken, publishBook);
router.patch("/:id/unpublish", verifyAdminToken, unpublishBook);
router.patch("/:id", verifyAdminToken, bookUpload.single("pdf"), editBook);

router.delete("/:id", verifyAdminToken, deleteBook);

export default router;
