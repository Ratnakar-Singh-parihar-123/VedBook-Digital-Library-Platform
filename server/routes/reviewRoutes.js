import { Router } from "express";
import {
  submitReview,
  getBookReviews,
  getMyReview,
  getPopularThisWeek,
} from "../controllers/reviewController.js";
import { verifyUserToken } from "../middleware/userMiddleware.js";

const router = Router();

// Public endpoints
router.get("/popular-this-week", getPopularThisWeek);
router.get("/book/:bookId", getBookReviews);

// Authenticated user endpoints
router.get("/my/:bookId", verifyUserToken, getMyReview);
router.post("/:bookId", verifyUserToken, submitReview);

export default router;
