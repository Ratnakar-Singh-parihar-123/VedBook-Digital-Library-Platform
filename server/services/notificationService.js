import db from "../config/db.js";
import { getIO } from "../config/socket.js";

// Save notification in MySQL and then emit it in real time.
export const createNotification = async ({
  recipientType,
  recipientId,
  senderAdminId = null,
  type,
  title,
  message,
  entityType = null,
  entityId = null,
}) => {
  const [result] = await db.query(
    `INSERT INTO notifications
      (
        recipient_type,
        recipient_id,
        sender_admin_id,
        type,
        title,
        message,
        entity_type,
        entity_id
      )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      recipientType,
      recipientId,
      senderAdminId,
      type,
      title,
      message,
      entityType,
      entityId,
    ],
  );

  const notification = {
    id: result.insertId,
    recipient_type: recipientType,
    recipient_id: recipientId,
    sender_admin_id: senderAdminId,
    type,
    title,
    message,
    entity_type: entityType,
    entity_id: entityId,
    is_read: false,
    created_at: new Date(),
  };

  // The database save succeeds even if nobody is connected.
  try {
    const io = getIO();

    if (recipientType === "admin" && recipientId === 0) {
      io.to("admins").emit("notification:new", notification);
    } else {
      io.to(`${recipientType}:${recipientId}`).emit(
        "notification:new",
        notification,
      );
    }
  } catch (error) {
    console.error("Notification realtime delivery error:", error.message);
  }

  return notification;
};

// Notify all connected admins about a new registration.
export const notifyAdmins = async ({ title, message, entityId }) => {
  return createNotification({
    recipientType: "admin",
    recipientId: 0,
    type: "new_user",
    title,
    message,
    entityType: "user",
    entityId,
  });
};
