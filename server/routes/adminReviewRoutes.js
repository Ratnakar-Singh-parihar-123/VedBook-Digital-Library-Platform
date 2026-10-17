import { Router } from "express";

import {
  getAdminReviews,
  getAdminReviewStats,
  updateReviewStatus,
} from "../controllers/adminReviewController.js";

import { verifyAdminToken } from "../middleware/authMiddleware.js";

const router = Router();

router.use(verifyAdminToken);

router.get("/", getAdminReviews);
router.get("/stats", getAdminReviewStats);
router.patch("/:id/status", updateReviewStatus);

export default router;
