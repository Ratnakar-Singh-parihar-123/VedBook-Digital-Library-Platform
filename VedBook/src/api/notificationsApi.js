import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './usersApi';

// Axios instance                                                 //

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use(async config => {
  try {
    const token = await AsyncStorage.getItem('ved_user_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {}
  return config;
});

// Endpoints (user only)                                          //

const ENDPOINTS = {
  list: '/notifications',
  unreadCount: '/notifications/unread-count',
  markAllRead: '/notifications/read-all',
  markRead: id => `/notifications/${id}/read`,
  delete: id => `/notifications/${id}`,
};

// Normaliser                                                     //

function normaliseNotification(n) {
  if (!n) return null;

  const id = n.id || n._id || n.notification_id;

  //entity_type + entity_id → bookId (agar book ho)//
  const entityType = n.entity_type || n.entityType || null;
  const entityId = n.entity_id || n.entityId || null;

  const derivedBookId =
    entityType === 'book' && entityId ? String(entityId) : null;

  return {
    id: String(id ?? ''),
    title: n.title || n.subject || n.heading || 'Notification',
    message: n.message || n.body || n.content || n.text || '',
    type: n.type || n.category || 'admin_message',
    isRead: Boolean(n.isRead ?? n.is_read ?? n.read ?? n.is_seen ?? false),
    createdAt:
      n.createdAt ||
      n.created_at ||
      n.sentAt ||
      n.sent_at ||
      n.timestamp ||
      n.date ||
      new Date().toISOString(),

    //Book navigation — priority: explicit bookId, phir entity//
    bookId:
      n.bookId ||
      n.book_id ||
      n.book?.id ||
      n.data?.bookId ||
      n.data?.book_id ||
      derivedBookId ||
      null,

    entityType,
    entityId,

    actionUrl: n.actionUrl || n.action_url || n.link || null,
    imageUrl: n.imageUrl || n.image_url || n.image || null,
  };
}

// Response parser                                                //

const parseList = data => {
  const raw =
    data?.data?.notifications ||
    data?.notifications ||
    data?.data?.items ||
    data?.items ||
    data?.results ||
    data?.data ||
    data ||
    [];

  const list = (Array.isArray(raw) ? raw : [])
    .map(normaliseNotification)
    .filter(Boolean);

  const unreadCount =
    data?.unreadCount ??
    data?.unread_count ??
    data?.meta?.unread ??
    data?.data?.unreadCount ??
    list.filter(n => !n.isRead).length;

  return { notifications: list, unreadCount };
};

//==================================================================//
// NOTIFICATIONS API                                              //
//==================================================================//
export const notificationsAPI = {
  //---------------- Fetch all ----------------//
  getAll: async ({ page = 1, limit = 50 } = {}) => {
    try {
      const { data } = await client.get(ENDPOINTS.list, {
        params: { page, limit },
      });

      if (__DEV__) {
        console.log(
          '🔔 Notifications raw:',
          JSON.stringify(data, null, 2).slice(0, 800),
        );
      }

      return parseList(data);
    } catch (e) {
      if (__DEV__) {
        console.log('❌ Notifications fetch failed:', e?.message);
      }
      return { notifications: [], unreadCount: 0 };
    }
  },

  //---------------- Unread count only ----------------//
  getUnreadCount: async () => {
    try {
      const { data } = await client.get(ENDPOINTS.unreadCount);
      const count =
        data?.count ??
        data?.unreadCount ??
        data?.unread_count ??
        data?.data?.count ??
        0;
      return Number(count) || 0;
    } catch {
      return 0;
    }
  },

  //---------------- Mark one as read ----------------//
  markAsRead: async notificationId => {
    const { data } = await client.patch(ENDPOINTS.markRead(notificationId));
    return data;
  },

  //---------------- Mark all as read ----------------//
  markAllAsRead: async () => {
    const { data } = await client.patch(ENDPOINTS.markAllRead);
    return data;
  },

  //---------------- Delete one ----------------//
  delete: async notificationId => {
    const { data } = await client.delete(ENDPOINTS.delete(notificationId));
    return data;
  },
};

export default notificationsAPI;
