import { Router } from "express";

import { getAdminPopularBooks } from "../controllers/adminReviewController.js";

import { verifyAdminToken } from "../middleware/authMiddleware.js";

const router = Router();

router.use(verifyAdminToken);

router.get("/popular-books", getAdminPopularBooks);

export default router;
