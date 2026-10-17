import { Router } from "express";

import {
  addCategory,
  listCategories,
  listAdminCategories,
  editCategory,
  removeCategory,
  toggleCategoryStatus,
} from "../controllers/categoryController.js";

import { verifyAdminToken } from "../middleware/authMiddleware.js";

const router = Router();

// Public
router.get("/", listCategories);

// Admin-only
router.get("/admin", verifyAdminToken, listAdminCategories);
router.post("/", verifyAdminToken, addCategory);
router.patch("/:id/status", verifyAdminToken, toggleCategoryStatus);
router.patch("/:id", verifyAdminToken, editCategory);
router.delete("/:id", verifyAdminToken, removeCategory);

export default router;
