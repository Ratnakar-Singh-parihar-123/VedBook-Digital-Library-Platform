import { Router } from "express";
import { verifyAdminToken } from "../middleware/authMiddleware.js";

import {
  dashboardOverview,
  dashboardReadingTrend,
  dashboardTrendingBooks,
  dashboardRecentActivity,
  dashboardUserGrowth,
} from "../controllers/dashboardController.js";

const router = Router();

// Every dashboard endpoint is admin-only.
router.use(verifyAdminToken);

router.get("/overview", dashboardOverview);
router.get("/reading-trend", dashboardReadingTrend);
router.get("/trending-books", dashboardTrendingBooks);
router.get("/recent-activity", dashboardRecentActivity);
router.get("/user-growth", dashboardUserGrowth);

export default router;
