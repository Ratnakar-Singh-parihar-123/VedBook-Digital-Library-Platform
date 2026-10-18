import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './usersApi';

// Axios instance                                                    */

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

// Cover URL normaliser                                              */

const getCoverImageUrl = cover => {
  if (!cover || typeof cover !== 'string') return null;
  const path = cover.trim();
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;

  const cleanPath = path.replace(/^\/+/, '').replace(/^api\//i, '');
  const serverBaseUrl = API_BASE_URL.replace(/\/api\/?$/i, '');
  return `${serverBaseUrl}/${cleanPath}`;
};

// Book shape normaliser                                             */

export function normaliseBook(b) {
  if (!b) return null;

  // Some endpoints wrap book in { book: {...}, progress: {...} }
  const bookData = b.book || b;

  const id =
    bookData.id ||
    bookData._id ||
    bookData.book_id ||
    bookData.bookId ||
    b.book_id ||
    b.bookId;

  const rawCover =
    bookData.coverImage ||
    bookData.cover_image ||
    bookData.cover ||
    bookData.coverUrl ||
    bookData.thumbnail ||
    null;

  const cover = getCoverImageUrl(rawCover);

  // Progress can be at top-level OR inside `.progress`
  const rawProgress = b.progress || bookData.progress || null;

  let progressData = null;
  if (rawProgress) {
    if (typeof rawProgress === 'number') {
      progressData = {
        percentage: rawProgress,
        progressPercent: rawProgress,
        currentPage: b.currentPage ?? b.current_page ?? 1,
        totalPages: b.totalPages ?? b.total_pages ?? null,
        lastReadAt: b.lastReadAt || b.last_read_at || null,
      };
    } else {
      const pct =
        rawProgress.percentage ??
        rawProgress.percent ??
        rawProgress.progressPercent ??
        rawProgress.progress ??
        null;
      progressData = {
        percentage: pct != null ? Number(pct) : null,
        progressPercent: pct != null ? Number(pct) : null,
        currentPage:
          rawProgress.currentPage ?? rawProgress.current_page ?? null,
        totalPages: rawProgress.totalPages ?? rawProgress.total_pages ?? null,
        lastReadAt: rawProgress.lastReadAt || rawProgress.last_read_at || null,
      };
    }
  } else if (
    b.percentage != null ||
    b.progress_percentage != null ||
    b.progressPercent != null ||
    b.current_page != null ||
    b.currentPage != null
  ) {
    const pct =
      b.percentage ??
      b.progressPercent ??
      b.progress_percentage ??
      (b.currentPage && b.totalPages
        ? Math.round((Number(b.currentPage) / Number(b.totalPages)) * 100)
        : null);

    progressData = {
      percentage: pct != null ? Number(pct) : null,
      progressPercent: pct != null ? Number(pct) : null,
      currentPage: b.currentPage ?? b.current_page ?? null,
      totalPages: b.totalPages ?? b.total_pages ?? null,
      lastReadAt: b.last_read_at || b.lastReadAt || null,
    };
  }

  return {
    id: String(id ?? ''),
    title: bookData.title || bookData.book_title || 'Untitled',
    author: bookData.author || bookData.book_author || 'Unknown author',
    description: bookData.description || '',

    category:
      bookData.categoryName ||
      bookData.category_name ||
      bookData.category?.name ||
      (typeof bookData.category === 'string' ? bookData.category : null) ||
      'General',

    coverImage: cover,
    cover,

    rating: Number(bookData.rating ?? bookData.avg_rating ?? 0),
    ratingCount: Number(bookData.ratingCount ?? bookData.rating_count ?? 0),

    pages:
      bookData.pages || bookData.totalPages || bookData.total_pages || null,
    language: bookData.language || 'English',

    progress: progressData,
    lastReadAt:
      b.lastReadAt ||
      b.last_read_at ||
      progressData?.lastReadAt ||
      bookData.lastReadAt ||
      bookData.last_read_at ||
      null,

    bookmarkedAt: b.bookmarkedAt || b.bookmarked_at || b.savedAt || null,
    completedAt: b.completedAt || b.completed_at || b.finished_at || null,
  };
}

// Universal list parser                                             */

const parseList = data => {
  const raw =
    data?.data?.books ||
    data?.data?.items ||
    data?.books ||
    data?.items ||
    data?.results ||
    data?.data ||
    data ||
    [];

  return (Array.isArray(raw) ? raw : []).map(normaliseBook).filter(Boolean);
};

//================================================================== */
// LIBRARY API                                                       */
//================================================================== */
export const libraryAPI = {
  /** Get Library Summary counts */
  getMyLibrarySummary: async () => {
    const { data } = await client.get('/my-library');
    return data?.data || data || {};
  },

  /** In Progress — continue reading */
  getContinueReading: async () => {
    const { data } = await client.get('/my-library/continue-reading');
    return parseList(data);
  },

  /** In Progress — full list */
  getInProgressBooks: async () => {
    const { data } = await client.get('/my-library/in-progress');
    return parseList(data);
  },

  /** Bookmarked */
  getBookmarks: async () => {
    try {
      const { data } = await client.get('/my-library/bookmarked');
      return parseList(data);
    } catch (err) {
      // Fallback to alias /bookmarks
      const { data } = await client.get('/my-library/bookmarks');
      return parseList(data);
    }
  },

  /** Completed */
  getCompleted: async () => {
    const { data } = await client.get('/my-library/completed');
    return parseList(data);
  },

  /** Recently opened / read */
  getRecentlyOpened: async () => {
    try {
      const { data } = await client.get('/my-library/recently-read');
      return parseList(data);
    } catch {
      const { data } = await client.get('/my-library/recently-opened');
      return parseList(data);
    }
  },

  /** Get Reading History */
  getReadingHistory: async (limit = 20) => {
    const { data } = await client.get('/my-library/history', {
      params: { limit },
    });
    return parseList(data);
  },

  /** Track a book open (fire-and-forget) */
  recordBookOpened: async bookId => {
    if (!bookId) return;
    try {
      await client.post('/my-library/recently-opened', {
        bookId: Number(bookId) || bookId,
      });
    } catch {
      // non-critical, silently ignore
    }
  },

  /** Add bookmark */
  addBookmark: async bookId => {
    if (!bookId) return;
    const { data } = await client.post(`/my-library/${bookId}/bookmark`);
    return data;
  },

  /** Remove bookmark */
  removeBookmark: async bookId => {
    if (!bookId) return;
    const { data } = await client.delete(`/my-library/${bookId}/bookmark`);
    return data;
  },

  /** Toggle bookmark */
  toggleBookmark: async bookId => {
    if (!bookId) return;
    try {
      const { data } = await client.post(
        `/my-library/${bookId}/bookmark/toggle`,
      );
      return data;
    } catch {
      const { data } = await client.post(
        `/my-library/bookmarks/${bookId}/toggle`,
      );
      return data;
    }
  },

  /** Save reading progress to server */
  saveReadingProgress: async (bookId, currentPage, totalPages) => {
    if (!bookId) return;
    const safeTotal = Math.max(1, Number(totalPages) || 1);
    const safePage = Math.min(Math.max(1, Number(currentPage) || 1), safeTotal);
    const { data } = await client.put(
      `/my-library/reading-progress/${encodeURIComponent(bookId)}`,
      {
        currentPage: safePage,
        totalPages: safeTotal,
      },
    );
    return data;
  },

  /** Get reading progress for a book */
  getReadingProgress: async bookId => {
    if (!bookId) return null;
    const { data } = await client.get(
      `/my-library/reading-progress/${encodeURIComponent(bookId)}`,
    );
    return data?.data || data;
  },
};

export default libraryAPI;
