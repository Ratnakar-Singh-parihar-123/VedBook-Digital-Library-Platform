import { Router } from "express";

import {
  listUserNotifications,
  getUnreadCount,
  readUserNotification,
  readAllUserNotifications,
} from "../controllers/notificationController.js";

import { verifyUserToken } from "../middleware/userMiddleware.js";

const router = Router();

/* Specific routes PEHLE */
router.get("/unread-count", verifyUserToken, getUnreadCount);
router.patch("/read-all", verifyUserToken, readAllUserNotifications);

/* Param routes baad me */
router.get("/", verifyUserToken, listUserNotifications);
router.patch("/:id/read", verifyUserToken, readUserNotification);

export default router;
