import express from "express";
import { verifyUserToken } from "../middleware/userMiddleware.js";

import {
  getMyLibrarySummary,
  getContinueReading,
  getInProgressBooks,
  getBookmarkedBooks,
  getRecentlyReadBooks,
  getCompletedBooks,
  getReadingProgress,
  saveReadingProgress,
  addBookmark,
  removeBookmark,
  toggleBookmark,
  recordRecentlyOpened,
  getReadingHistory,
} from "../controllers/myLibraryController.js";

const router = express.Router();

// All routes in this file require a logged-in user.
router.use(verifyUserToken);

router.get("/", getMyLibrarySummary);
router.get("/continue-reading", getContinueReading);
router.get("/in-progress", getInProgressBooks);
router.get("/bookmarked", getBookmarkedBooks);
router.get("/bookmarks", getBookmarkedBooks);
router.get("/recently-read", getRecentlyReadBooks);
router.get("/recently-opened", getRecentlyReadBooks);
router.get("/completed", getCompletedBooks);
router.get("/history", getReadingHistory);

router.post("/recently-opened", recordRecentlyOpened);

router.get("/reading-progress/:bookId", getReadingProgress);
router.put("/reading-progress/:bookId", saveReadingProgress);
router.post("/reading-progress/:bookId", saveReadingProgress);
router.put("/:bookId/progress", saveReadingProgress);
router.post("/:bookId/progress", saveReadingProgress);

router.post("/:bookId/bookmark", addBookmark);
router.delete("/:bookId/bookmark", removeBookmark);
router.post("/:bookId/bookmark/toggle", toggleBookmark);
router.post("/bookmarks/:bookId/toggle", toggleBookmark);

export default router;

