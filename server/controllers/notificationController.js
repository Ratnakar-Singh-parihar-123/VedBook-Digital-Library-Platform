import db from "../config/db.js";
import { getIO } from "../config/socket.js";

import {
  getAdminNotifications,
  getAdminUnreadCount,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  getAdminNotificationDetails,
  createUserNotification,
  createBroadcastNotification,
  updateAdminNotification as updateNotificationModel,
  deleteAdminNotification as deleteNotificationModel,
  getSentNotifications,
  getSentNotificationDetails,
  getUserNotifications,
  getUserUnreadCount,
  markUserNotificationRead,
  markAllUserNotificationsRead,
} from "../models/notificationModel.js";

export const listAdminNotifications = async (req, res) => {
  try {
    const limit = Math.min(
      Math.max(Number.parseInt(req.query.limit, 10) || 20, 1),
      50,
    );

    const offset = Math.max(Number.parseInt(req.query.offset, 10) || 0, 0);

    const [notifications, unreadCount] = await Promise.all([
      getAdminNotifications(limit, offset),
      getAdminUnreadCount(),
    ]);

    return res.status(200).json({
      success: true,
      unreadCount,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    console.error("List notifications error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch notifications",
    });
  }
};

export const getAdminNotification = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    const notification = await getAdminNotificationDetails(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error("Notification details error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch notification details",
    });
  }
};

export const readAdminNotification = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    const updated = await markAdminNotificationRead(id);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Mark read error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update notification",
    });
  }
};

export const readAllAdminNotifications = async (req, res) => {
  try {
    const updatedCount = await markAllAdminNotificationsRead();

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      updatedCount,
    });
  } catch (error) {
    console.error("Mark all read error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update notifications",
    });
  }
};

export const createAdminNotification = async (req, res) => {
  try {
    const { title, message, recipientType, userId, link } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      title.trim().length > 200 ||
      typeof message !== "string" ||
      !message.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid title and message are required",
      });
    }

    if (!["all", "user"].includes(recipientType)) {
      return res.status(400).json({
        success: false,
        message: "recipientType must be 'all' or 'user'",
      });
    }

    if (link != null && (typeof link !== "string" || link.length > 500)) {
      return res.status(400).json({
        success: false,
        message: "Link must be a string of at most 500 characters",
      });
    }

    const cleanTitle = title.trim();
    const cleanMessage = message.trim();
    const cleanLink = link?.trim() || null;
    const adminId = req.user.id;
    const io = getIO();

    if (recipientType === "user") {
      const id = Number(userId);

      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valid userId is required",
        });
      }

      const [users] = await db.query(
        "SELECT id FROM users WHERE id = ? LIMIT 1",
        [id],
      );

      if (!users.length) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const notificationId = await createUserNotification({
        recipientId: id,
        senderAdminId: adminId,
        title: cleanTitle,
        message: cleanMessage,
        link: cleanLink,
      });

      const notification = {
        id: notificationId,
        recipient_type: "user",
        recipient_id: id,
        type: "admin_message",
        title: cleanTitle,
        message: cleanMessage,
        link: cleanLink,
        is_read: false,
      };

      io.to(`user:${id}`).emit("notification:new", notification);

      return res.status(201).json({
        success: true,
        message: "Notification sent to user",
        data: notification,
      });
    }

    // Exclude the current admin account if it is also stored in users.
    const [users] = await db.query("SELECT id FROM users WHERE id <> ?", [
      adminId,
    ]);

    const userIds = users.map((user) => user.id);

    const result = await createBroadcastNotification({
      senderAdminId: adminId,
      title: cleanTitle,
      message: cleanMessage,
      link: cleanLink,
      userIds,
    });

    for (const userId of userIds) {
      io.to(`user:${userId}`).emit("notification:new", {
        id: result.broadcastId,
        recipient_type: "user",
        recipient_id: userId,
        type: "admin_message",
        title: cleanTitle,
        message: cleanMessage,
        link: cleanLink,
        is_read: false,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Notification broadcast created",
      recipientCount: result.recipientCount,
      data: { broadcastId: result.broadcastId },
    });
  } catch (error) {
    console.error("Create notification error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create notification",
    });
  }
};

export const editAdminNotification = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { title, message, link } = req.body;

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    if (
      typeof title !== "string" ||
      !title.trim() ||
      title.trim().length > 200 ||
      typeof message !== "string" ||
      !message.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid title and message are required",
      });
    }

    if (link != null && (typeof link !== "string" || link.length > 500)) {
      return res.status(400).json({
        success: false,
        message: "Invalid link",
      });
    }

    const updated = await updateNotificationModel({
      notificationId: id,
      adminId: req.user.id,
      title: title.trim(),
      message: message.trim(),
      link: link?.trim() || null,
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Custom notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification updated successfully",
    });
  } catch (error) {
    console.error("Edit notification error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to update notification",
    });
  }
};

export const deleteAdminNotification = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    const deleted = await deleteNotificationModel({
      notificationId: id,
      adminId: req.user.id,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Custom notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Delete notification error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to delete notification",
    });
  }
};
export const listSentNotifications = async (req, res) => {
  try {
    const adminId = req.user.id;
    const limit = Math.min(
      Math.max(Number.parseInt(req.query.limit, 10) || 50, 1),
      100,
    );
    const offset = Math.max(Number.parseInt(req.query.offset, 10) || 0, 0);

    const notifications = await getSentNotifications(adminId, limit, offset);

    return res.status(200).json({ notifications });
  } catch (error) {
    console.error("List sent notifications error:", error);
    return res.status(500).json({
      message: "Failed to load sent notifications",
    });
  }
};

export const getSentNotification = async (req, res) => {
  try {
    const notificationId = Number.parseInt(req.params.id, 10);

    if (!Number.isSafeInteger(notificationId) || notificationId < 1) {
      return res.status(400).json({
        message: "Invalid notification ID",
      });
    }

    const result = await getSentNotificationDetails(
      notificationId,
      req.user.id,
    );

    if (!result) {
      return res.status(404).json({
        message: "Sent notification not found",
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Get sent notification error:", error);
    return res.status(500).json({
      message: "Failed to load notification details",
    });
  }
};

// USER-FACING CONTROLLERS                                        //

//GET /api/notifications//
// export const listUserNotifications = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     const limit = Math.min(
//       Math.max(Number.parseInt(req.query.limit, 10) || 50, 1),
//       100,
//     );
//     const offset = Math.max(Number.parseInt(req.query.offset, 10) || 0, 0);

//     const [notifications, unreadCount] = await Promise.all([
//       getUserNotifications(userId, limit, offset),
//       getUserUnreadCount(userId),
//     ]);

//     return res.status(200).json({
//       success: true,
//       unreadCount,
//       count: notifications.length,
//       data: { notifications },
//     });
//   } catch (error) {
//     console.error("List user notifications error:", error.message);
//     return res.status(500).json({
//       success: false,
//       message: "Unable to fetch notifications",
//     });
//   }
// };
//GET /api/notifications//
export const listUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const limit = Math.min(
      Math.max(Number.parseInt(req.query.limit, 10) || 50, 1),
      100,
    );
    const offset = Math.max(Number.parseInt(req.query.offset, 10) || 0, 0);

    const [notifications, unreadCount] = await Promise.all([
      getUserNotifications(userId, limit, offset),
      getUserUnreadCount(userId),
    ]);

    //Normalize response for frontend//
    const normalized = notifications.map((n) => ({
      id: String(n.id),
      title: n.title,
      message: n.message,
      type: n.type || "admin_message",
      link: n.link || null,
      isRead: Boolean(n.is_read),
      createdAt: n.created_at,
      //Book navigation//
      entityType: n.entity_type || null,
      entityId: n.entity_id || null,
      bookId:
        n.entity_type === "book" && n.entity_id ? String(n.entity_id) : null,
    }));

    return res.status(200).json({
      success: true,
      unreadCount,
      count: normalized.length,
      data: { notifications: normalized },
    });
  } catch (error) {
    console.error("List user notifications error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch notifications",
    });
  }
};
//GET /api/notifications/unread-count//
export const getUnreadCount = async (req, res) => {
  try {
    const count = await getUserUnreadCount(req.user.id);
    return res.status(200).json({ success: true, count });
  } catch (error) {
    console.error("Unread count error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch unread count",
    });
  }
};

//PATCH /api/notifications/:id/read//
export const readUserNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = Number(req.params.id);

    if (!Number.isSafeInteger(notificationId) || notificationId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    const updated = await markUserNotificationRead(userId, notificationId);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Mark read error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to update notification",
    });
  }
};

//PATCH /api/notifications/read-all//
export const readAllUserNotifications = async (req, res) => {
  try {
    const updatedCount = await markAllUserNotificationsRead(req.user.id);

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      updatedCount,
    });
  } catch (error) {
    console.error("Mark all read error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to update notifications",
    });
  }
};
