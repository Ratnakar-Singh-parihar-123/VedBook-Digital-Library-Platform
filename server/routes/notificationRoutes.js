import { Router } from "express";

import {
  listAdminNotifications,
  getAdminNotification,
  readAdminNotification,
  readAllAdminNotifications,
  createAdminNotification,
  editAdminNotification,
  deleteAdminNotification,
  listSentNotifications,
  getSentNotification,
} from "../controllers/notificationController.js";

import { verifyAdminToken } from "../middleware/authMiddleware.js";

const router = Router();

// Sent notifications — specific routes first
router.get("/sent", verifyAdminToken, listSentNotifications);
router.get("/sent/:id", verifyAdminToken, getSentNotification);

// Admin inbox
router.get("/", verifyAdminToken, listAdminNotifications);
router.get("/:id", verifyAdminToken, getAdminNotification);

router.post("/", verifyAdminToken, createAdminNotification);

router.patch("/read-all", verifyAdminToken, readAllAdminNotifications);
router.patch("/:id/read", verifyAdminToken, readAdminNotification);
router.patch("/:id", verifyAdminToken, editAdminNotification);

router.delete("/:id", verifyAdminToken, deleteAdminNotification);

export default router;
