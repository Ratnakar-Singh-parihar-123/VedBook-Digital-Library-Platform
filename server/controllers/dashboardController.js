import {
  getDashboardOverview,
  getReadingTrend,
  getTrendingBooks,
  getRecentAdminActivity,
  getUserGrowth,
} from "../models/dashboard.js";

const parseDays = (value, fallback = 7) => {
  const days = Number(value ?? fallback);
  return Number.isInteger(days) && [7, 30, 90].includes(days) ? days : null;
};

const handleError = (res, error, label) => {
  console.error(label, error.message);

  return res.status(500).json({
    success: false,
    message: "Unable to load dashboard data",
  });
};

export const dashboardOverview = async (req, res) => {
  try {
    const overview = await getDashboardOverview();

    return res.status(200).json({
      success: true,
      overview,
    });
  } catch (error) {
    return handleError(res, error, "Dashboard overview error:");
  }
};

export const dashboardReadingTrend = async (req, res) => {
  try {
    const days = parseDays(req.query.days);

    if (!days) {
      return res.status(400).json({
        success: false,
        message: "days must be 7, 30, or 90",
      });
    }

    const trend = await getReadingTrend(days);

    return res.status(200).json({
      success: true,
      days,
      trend,
    });
  } catch (error) {
    return handleError(res, error, "Reading trend error:");
  }
};

export const dashboardTrendingBooks = async (req, res) => {
  try {
    const days = parseDays(req.query.days, 30);
    const limit = Number(req.query.limit ?? 10);

    if (!days || !Number.isInteger(limit) || limit < 1 || limit > 50) {
      return res.status(400).json({
        success: false,
        message: "Use days=7, 30, or 90 and limit between 1 and 50",
      });
    }

    const books = await getTrendingBooks(days, limit);

    return res.status(200).json({
      success: true,
      days,
      count: books.length,
      books,
    });
  } catch (error) {
    return handleError(res, error, "Trending books error:");
  }
};

export const dashboardRecentActivity = async (req, res) => {
  try {
    const limit = Number(req.query.limit ?? 10);

    if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
      return res.status(400).json({
        success: false,
        message: "limit must be between 1 and 50",
      });
    }

    const activities = await getRecentAdminActivity(limit);

    return res.status(200).json({
      success: true,
      count: activities.length,
      activities,
    });
  } catch (error) {
    return handleError(res, error, "Recent activity error:");
  }
};
export const dashboardUserGrowth = async (req, res) => {
  try {
    const days = parseDays(req.query.days, 30);

    if (!days) {
      return res.status(400).json({
        success: false,
        message: "days must be 7, 30, or 90",
      });
    }

    const growth = await getUserGrowth(days);

    return res.status(200).json({
      success: true,
      days,
      growth,
    });
  } catch (error) {
    return handleError(res, error, "User growth error:");
  }
};
