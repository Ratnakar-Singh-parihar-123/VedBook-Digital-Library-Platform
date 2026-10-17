import { Router } from "express";

import {
  getFeaturedMasterpieces,
  exploreBooks,
  setBookFeaturedStatus,
  getRecommendedBooks,
  getRecentlyCataloguedBooks,
} from "../controllers/discoveryController.js";

import { verifyAdminToken } from "../middleware/authMiddleware.js";
import { verifyUserToken } from "../middleware/userMiddleware.js";

const router = Router();

// Public APIs
router.get("/featured", getFeaturedMasterpieces);
router.get("/explore", exploreBooks);
// Personalized recommendations for logged-in users
router.get("/recommended", verifyUserToken, getRecommendedBooks);
router.get("/recently-catalogued", getRecentlyCataloguedBooks);
// Admin-only API
router.patch(
  "/admin/books/:id/featured",
  verifyAdminToken,
  setBookFeaturedStatus,
);

export default router;
