import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './usersApi';

/* ------------------------------------------------------------------ */
/* Axios instance for public + user home endpoints                    */
/* ------------------------------------------------------------------ */

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

/* ------------------------------------------------------------------ */
/* Auto-attach JWT if present                                          */
/* ------------------------------------------------------------------ */

client.interceptors.request.use(async config => {
  try {
    const token = await AsyncStorage.getItem('ved_user_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Ignore storage errors
  }

  return config;
});

/* ------------------------------------------------------------------ */
/* Convert relative image paths to complete URLs                      */
/* ------------------------------------------------------------------ */

const getCoverImageUrl = cover => {
  if (!cover || typeof cover !== 'string') {
    return null;
  }

  const path = cover.trim();

  if (!path) {
    return null;
  }

  // Keep absolute URLs unchanged
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  // Remove leading slashes and optional api/ prefix
  const cleanPath = path.replace(/^\/+/, '').replace(/^api\//i, '');

  // Example API_BASE_URL: http://192.168.1.107:8000/api
  // Image base URL:        http://192.168.1.107:8000
  const serverBaseUrl = API_BASE_URL.replace(/\/api\/?$/i, '');

  return `${serverBaseUrl}/${cleanPath}`;
};

/* ------------------------------------------------------------------ */
/* Normalise book shape                                                */
/* ------------------------------------------------------------------ */

function normaliseBook(b) {
  if (!b) {
    return null;
  }

  const id = b.id || b._id || b.book_id || b.bookId;

  const rawCover =
    b.coverImage ||
    b.cover_image ||
    b.cover ||
    b.coverUrl ||
    b.thumbnail ||
    null;

  const cover = getCoverImageUrl(rawCover);

  const rawProgress = b.progress || null;
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
    title: b.title || b.book_title || 'Untitled',
    author: b.author || b.book_author || 'Unknown author',
    description: b.description || '',

    category:
      b.categoryName ||
      b.category_name ||
      b.category?.name ||
      b.category ||
      'General',

    // BookCard uses book.cover
    coverImage: cover,
    cover,

    rating: Number(b.rating ?? b.avg_rating ?? b.avgRating ?? 0),

    ratingCount: Number(b.ratingCount ?? b.rating_count ?? b.review_count ?? 0),

    pages: b.pages || b.totalPages || b.total_pages || null,
    language: b.language || 'English',

    isFeatured: Boolean(b.isFeatured ?? b.is_featured),
    status: b.status || 'published',

    // Continue-reading extras
    progress: progressData,
    lastReadAt:
      b.lastReadAt ||
      b.last_read_at ||
      progressData?.lastReadAt ||
      null,
  };
}

/* ------------------------------------------------------------------ */
/* API Methods                                                         */
/* ------------------------------------------------------------------ */

export const homeAPI = {
  /* Featured masterpieces — public */
  getFeatured: async () => {
    const { data } = await client.get('/discovery/featured');

    const raw = data?.data || data?.featured || data?.books || data || [];

    return (Array.isArray(raw) ? raw : []).map(normaliseBook).filter(Boolean);
  },

  /* Recently catalogued — public */
  getRecentlyCatalogued: async (limit = 8) => {
    const { data } = await client.get('/discovery/recently-catalogued', {
      params: { limit },
    });

    const raw = data?.data || data?.books || data || [];

    const books = (Array.isArray(raw) ? raw : [])
      .map(normaliseBook)
      .filter(Boolean);

    if (__DEV__) {
      console.log(
        'Recently catalogued covers:',
        books.map(book => ({
          title: book.title,
          cover: book.cover,
        })),
      );
    }

    return books;
  },

  /* Popular this week — public */
  getPopularThisWeek: async () => {
    const { data } = await client.get('/reviews/popular-this-week');

    const raw = data?.data || data?.books || data?.popular || data || [];

    return (Array.isArray(raw) ? raw : []).map(normaliseBook).filter(Boolean);
  },

  /* Recommended for logged-in user — auth */
  getRecommended: async () => {
    const { data } = await client.get('/discovery/recommended');

    const raw = data?.data || data?.books || data || [];

    return (Array.isArray(raw) ? raw : []).map(normaliseBook).filter(Boolean);
  },

  /* Continue reading — auth */
  getContinueReading: async () => {
    const { data } = await client.get('/my-library/continue-reading');

    const raw = data?.data || data?.books || data || [];

    return (Array.isArray(raw) ? raw : []).map(normaliseBook).filter(Boolean);
  },
};

export default homeAPI;
