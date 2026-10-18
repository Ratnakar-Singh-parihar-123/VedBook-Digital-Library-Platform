import db from "../config/db.js";

export const getAdminNotifications = async (limit = 20, offset = 0) => {
  const [rows] = await db.query(
    `SELECT *
     FROM notifications
     WHERE recipient_type = 'admin'
       AND recipient_id = 0
     ORDER BY created_at DESC, id DESC
     LIMIT ? OFFSET ?`,
    [limit, offset],
  );

  return rows;
};

export const getAdminUnreadCount = async () => {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS unreadCount
     FROM notifications
     WHERE recipient_type = 'admin'
       AND recipient_id = 0
       AND is_read = FALSE`,
  );

  return Number(rows[0].unreadCount);
};

export const markAdminNotificationRead = async (id) => {
  const [result] = await db.query(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE id = ?
       AND recipient_type = 'admin'
       AND recipient_id = 0`,
    [id],
  );

  return result.affectedRows > 0;
};

export const markAllAdminNotificationsRead = async () => {
  const [result] = await db.query(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE recipient_type = 'admin'
       AND recipient_id = 0
       AND is_read = FALSE`,
  );

  return result.affectedRows;
};

// Fetch one notification and, for new registrations, its user details.
export const getAdminNotificationDetails = async (id) => {
  const [rows] = await db.query(
    `SELECT *
     FROM notifications
     WHERE id = ?
       AND recipient_type = 'admin'
       AND recipient_id = 0
     LIMIT 1`,
    [id],
  );

  if (!rows.length) return null;

  const notification = rows[0];

  if (notification.type === "new_user" && notification.entity_id) {
    const [users] = await db.query(
      `SELECT id, name, email, phone, profile_pic, created_at
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [notification.entity_id],
    );

    notification.user = users[0] || null;
  }

  return notification;
};

// Notify admin when a new user registers.
export const createRegistrationNotification = async ({
  userId,
  name,
  email,
  phone,
}) => {
  const title = "New User Registered";
  const message = `Name: ${name} | Email: ${email} | Phone: ${phone || "Not provided"}`;

  const [result] = await db.query(
    `INSERT INTO notifications
     (recipient_type, recipient_id, type, title, message,
      entity_type, entity_id)
     VALUES ('admin', 0, 'new_user', ?, ?, 'user', ?)`,
    [title, message, userId],
  );

  return {
    id: result.insertId,
    recipient_type: "admin",
    recipient_id: 0,
    type: "new_user",
    title,
    message,
    entity_type: "user",
    entity_id: userId,
    is_read: false,
  };
};

// Create notification for one user.
export const createUserNotification = async ({
  recipientId,
  senderAdminId,
  title,
  message,
  type = "admin_message",
  link = null,
}) => {
  const [result] = await db.query(
    `INSERT INTO notifications
     (recipient_type, recipient_id, sender_admin_id,
      type, title, message, link)
     VALUES ('user', ?, ?, ?, ?, ?, ?)`,
    [recipientId, senderAdminId, type, title, message, link],
  );

  return result.insertId;
};

// Broadcast: store one row per user so each has independent read status.
export const createBroadcastNotification = async ({
  senderAdminId,
  title,
  message,
  link = null,
  userIds,
}) => {
  if (!userIds.length) return { broadcastId: null, recipientCount: 0 };

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Insert the first row to obtain a group ID.
    const [first] = await connection.query(
      `INSERT INTO notifications
       (recipient_type, recipient_id, sender_admin_id,
        type, title, message, link)
       VALUES ('user', ?, ?, 'admin_message', ?, ?, ?)`,
      [userIds[0], senderAdminId, title, message, link],
    );

    const broadcastId = first.insertId;

    await connection.query(
      `UPDATE notifications SET broadcast_id = ? WHERE id = ?`,
      [broadcastId, broadcastId],
    );

    for (const userId of userIds.slice(1)) {
      await connection.query(
        `INSERT INTO notifications
         (recipient_type, recipient_id, sender_admin_id,
          type, title, message, link, broadcast_id)
         VALUES ('user', ?, ?, 'admin_message', ?, ?, ?, ?)`,
        [userId, senderAdminId, title, message, link, broadcastId],
      );
    }

    await connection.commit();

    return { broadcastId, recipientCount: userIds.length };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Edit one custom notification or every copy of a broadcast.
export const updateAdminNotification = async ({
  notificationId,
  adminId,
  title,
  message,
  link = null,
}) => {
  const [result] = await db.query(
    `UPDATE notifications
     SET title = ?, message = ?, link = ?
     WHERE sender_admin_id = ?
       AND recipient_type = 'user'
       AND type = 'admin_message'
       AND (
         id = ?
         OR broadcast_id = ?
       )`,
    [title, message, link, adminId, notificationId, notificationId],
  );

  return result.affectedRows > 0;
};

// Delete one custom notification or every copy of a broadcast.
export const deleteAdminNotification = async ({ notificationId, adminId }) => {
  const [result] = await db.query(
    `DELETE FROM notifications
     WHERE sender_admin_id = ?
       AND recipient_type = 'user'
       AND type = 'admin_message'
       AND (
         id = ?
         OR broadcast_id = ?
       )`,
    [adminId, notificationId, notificationId],
  );

  return result.affectedRows > 0;
};
// List messages sent by this admin, grouped by broadcast.
export const getSentNotifications = async (adminId, limit = 50, offset = 0) => {
  const [rows] = await db.query(
    `SELECT
       COALESCE(broadcast_id, id) AS id,
       MAX(title) AS title,
       MAX(message) AS message,
       MAX(link) AS link,
       CASE
         WHEN MAX(broadcast_id) IS NOT NULL THEN 'all'
         ELSE 'user'
       END AS recipient_type,
       COUNT(*) AS total_recipients,
       SUM(is_read = TRUE) AS read_count,
       MAX(created_at) AS created_at
     FROM notifications
     WHERE recipient_type = 'user'
       AND sender_admin_id = ?
       AND type = 'admin_message'
     GROUP BY COALESCE(broadcast_id, id)
     ORDER BY MAX(created_at) DESC
     LIMIT ? OFFSET ?`,
    [adminId, limit, offset],
  );

  return rows;
};

// Get one sent notification with individual recipient details.
export const getSentNotificationDetails = async (notificationId, adminId) => {
  const [rows] = await db.query(
    `SELECT *
     FROM notifications
     WHERE sender_admin_id = ?
       AND recipient_type = 'user'
       AND type = 'admin_message'
       AND (id = ? OR broadcast_id = ?)
     ORDER BY created_at DESC`,
    [adminId, notificationId, notificationId],
  );

  if (!rows.length) return null;

  const first = rows[0];
  const isBroadcast = first.broadcast_id !== null;

  const [recipients] = await db.query(
    `SELECT
       n.id,
       n.recipient_id AS user_id,
       n.is_read,
       n.created_at,
       u.name,
       u.email,
       u.phone,
       u.profile_pic
     FROM notifications n
     LEFT JOIN users u ON u.id = n.recipient_id
     WHERE n.sender_admin_id = ?
       AND n.recipient_type = 'user'
       AND n.type = 'admin_message'
       AND ${
         isBroadcast
           ? "n.broadcast_id = ?"
           : "n.id = ? AND n.broadcast_id IS NULL"
       }
     ORDER BY n.created_at DESC`,
    [adminId, notificationId],
  );

  return {
    notification: {
      id: isBroadcast ? first.broadcast_id : first.id,
      title: first.title,
      message: first.message,
      link: first.link,
      recipient_type: isBroadcast ? "all" : "user",
      total_recipients: recipients.length,
      read_count: recipients.filter((r) => Boolean(r.is_read)).length,
      created_at: first.created_at,
    },
    recipients,
  };
};

// USER-FACING NOTIFICATIONS                                      //

//Fetch all notifications for a user//

// USER-FACING NOTIFICATIONS                                      //
// Table: notifications (recipient_type='user', recipient_id=userId)//

//Fetch all notifications for a user//
export const getUserNotifications = async (userId, limit, offset) => {
  const [rows] = await db.query(
    `SELECT
       id,
       title,
       message,
       type,
       link,
       entity_type,
       entity_id,
       is_read,
       created_at
     FROM notifications
     WHERE recipient_type = 'user'
       AND recipient_id = ?
     ORDER BY created_at DESC, id DESC
     LIMIT ? OFFSET ?`,
    [userId, limit, offset],
  );
  return rows;
};

//Unread count for bell badge//
export const getUserUnreadCount = async (userId) => {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS count
     FROM notifications
     WHERE recipient_type = 'user'
       AND recipient_id = ?
       AND is_read = 0`,
    [userId],
  );
  return Number(rows[0]?.count) || 0;
};

//Mark one as read//
export const markUserNotificationRead = async (userId, notificationId) => {
  const [result] = await db.query(
    `UPDATE notifications
     SET is_read = 1
     WHERE id = ?
       AND recipient_type = 'user'
       AND recipient_id = ?`,
    [notificationId, userId],
  );
  return result.affectedRows > 0;
};

//Mark all as read//
export const markAllUserNotificationsRead = async (userId) => {
  const [result] = await db.query(
    `UPDATE notifications
     SET is_read = 1
     WHERE recipient_type = 'user'
       AND recipient_id = ?
       AND is_read = 0`,
    [userId],
  );
  return result.affectedRows || 0;
};
