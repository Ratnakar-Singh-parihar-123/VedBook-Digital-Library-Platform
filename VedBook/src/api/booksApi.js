// booksApi.js

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './usersApi';

/* ================================================================== */
/* AXIOS CLIENT                                                        */
/* ================================================================== */
const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use(
  async config => {
    try {
      const token = await AsyncStorage.getItem('ved_user_token');
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      if (__DEV__) console.warn('Token read failed:', error?.message);
    }
    return config;
  },
  error => Promise.reject(error),
);

/* ================================================================== */
/* SHORT-TERM MEMORY CACHE (defensive anti-loop)                       */
/* ================================================================== */
const BOOK_CACHE_TTL = 30000; // 30s
const CONTENT_CACHE_TTL = 60000; // 60s

const bookDetailCache = new Map();
const bookContentCache = new Map();
const inflightBookDetails = new Map();
const inflightBookContent = new Map();

const isFresh = (entry, ttl) => entry && Date.now() - entry.time < ttl;

const readCache = (map, key, ttl) => {
  const entry = map.get(key);
  if (isFresh(entry, ttl)) return entry.data;
  if (entry) map.delete(key);
  return null;
};

const writeCache = (map, key, data) => {
  map.set(key, { data, time: Date.now() });
};

/* ================================================================== */
/* URL HELPERS                                                         */
/* ================================================================== */
const getServerBaseUrl = () =>
  String(API_BASE_URL || '').replace(/\/api\/?$/i, '');

const resolveServerFileUrl = rawPath => {
  if (typeof rawPath !== 'string') return null;
  const path = rawPath.trim();
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(path)) return null;

  const serverBaseUrl = getServerBaseUrl();
  if (!serverBaseUrl) return null;

  let cleanPath = path.replace(/^\/+/, '');
  if (/^api\/uploads\//i.test(cleanPath)) {
    cleanPath = cleanPath.replace(/^api\//i, '');
  }

  const encodedPath = cleanPath
    .split('/')
    .map(segment => {
      try {
        return encodeURIComponent(decodeURIComponent(segment));
      } catch {
        return encodeURIComponent(segment);
      }
    })
    .join('/');

  return `${serverBaseUrl}/${encodedPath}`;
};

const getCoverImageUrl = cover => resolveServerFileUrl(cover);

const looksLikePdfPath = value => {
  if (typeof value !== 'string') return false;
  const path = value.trim();
  return path ? /\.pdf(?:[?#].*)?$/i.test(path) : false;
};

const getPdfPathFromObject = object => {
  if (!object || typeof object !== 'object') return null;

  const directFields = [
    'pdfUrl',
    'pdf_url',
    'pdfPath',
    'pdf_path',
    'fileUrl',
    'file_url',
    'filePath',
    'file_path',
    'contentUrl',
    'content_url',
    'documentUrl',
    'document_url',
    'documentPath',
    'document_path',
    'downloadUrl',
    'download_url',
    'downloadPath',
    'download_path',
    'pdf',
    'file',
  ];

  for (const field of directFields) {
    const value = object[field];
    if (typeof value === 'string' && value.trim()) {
      if (/pdf/i.test(field) || looksLikePdfPath(value)) return value.trim();
    }
  }

  if (typeof object.content === 'string' && looksLikePdfPath(object.content)) {
    return object.content.trim();
  }

  return null;
};

const getPdfUrl = rawPath => {
  if (typeof rawPath !== 'string' || !rawPath.trim()) return null;
  return resolveServerFileUrl(rawPath);
};

/* ================================================================== */
/* RESPONSE HELPERS                                                    */
/* ================================================================== */
const getBookObject = response => {
  if (!response) return null;

  const candidates = [
    response?.data?.book,
    response?.book,
    response?.data?.data?.book,
    response?.data?.data,
    response?.data,
    response,
  ];

  for (const item of candidates) {
    if (
      item &&
      typeof item === 'object' &&
      !Array.isArray(item) &&
      (item.id != null ||
        item._id != null ||
        item.book_id != null ||
        item.bookId != null ||
        item.title != null ||
        item.book_title != null)
    ) {
      return item;
    }
  }

  return null;
};

const getBooksArray = response => {
  const candidates = [
    response?.data?.books,
    response?.data?.results,
    response?.books,
    response?.results,
    response?.payload?.items,
    response?.items,
    response?.data,
    response,
  ];

  for (const c of candidates) if (Array.isArray(c)) return c;
  return [];
};

/* ================================================================== */
/* BOOK NORMALISER                                                     */
/* ================================================================== */
function normaliseBook(b) {
  if (!b || typeof b !== 'object') return null;

  const id = b.id ?? b._id ?? b.book_id ?? b.bookId;

  const rawCover =
    b.coverImage ||
    b.cover_image ||
    b.cover ||
    b.coverUrl ||
    b.cover_url ||
    b.thumbnail ||
    b.thumbnailUrl ||
    b.thumbnail_url ||
    null;

  const cover = getCoverImageUrl(rawCover);

  const rawPdfPath = getPdfPathFromObject(b);
  const pdfUrl = rawPdfPath ? getPdfUrl(rawPdfPath) : null;

  return {
    id: String(id ?? ''),
    title: b.title || b.book_title || 'Untitled',
    author: b.author || b.book_author || 'Unknown author',
    description: b.description || b.summary || '',
    category:
      b.categoryName ||
      b.category_name ||
      b.category?.name ||
      (typeof b.category === 'string' ? b.category : null) ||
      'General',
    coverImage: cover,
    cover,
    pdfUrl,
    pdfPath: rawPdfPath || null,
    rating: Number(b.rating ?? b.avg_rating ?? b.avgRating ?? 0),
    ratingCount: Number(b.ratingCount ?? b.rating_count ?? b.review_count ?? 0),
    pages: b.pages || b.totalPages || b.total_pages || null,
    language: b.language || 'English',
    isFeatured: Boolean(b.isFeatured ?? b.is_featured),
    status: b.status || 'published',
    addedAt: b.addedAt || b.created_at || b.createdAt || null,
  };
}

/* ================================================================== */
/* DETAIL ENRICHER                                                     */
/* ================================================================== */
function enrichBookDetails(raw, fullResponse) {
  if (!raw || typeof raw !== 'object') return null;

  const normalised = normaliseBook(raw);
  if (!normalised) return null;

  const pdfPath =
    getPdfPathFromObject(raw) ||
    getPdfPathFromObject(fullResponse?.data?.book) ||
    getPdfPathFromObject(fullResponse?.book) ||
    null;

  return {
    ...normalised,
    pdfUrl: pdfPath ? getPdfUrl(pdfPath) : normalised.pdfUrl,
    pdfPath: pdfPath || normalised.pdfPath,
    publishedYear:
      raw.publishedYear ||
      raw.published_year ||
      raw.publish_year ||
      raw.year ||
      null,
    publisher: raw.publisher || raw.published_by || null,
    isbn: raw.isbn || raw.ISBN || null,
    language: raw.language || 'English',
    reviewCount:
      raw.reviewCount ??
      raw.review_count ??
      raw.rating_count ??
      normalised.ratingCount ??
      0,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    progress:
      raw.progress ||
      fullResponse?.data?.progress ||
      fullResponse?.progress ||
      normalised.progress ||
      null,
  };
}

/* ================================================================== */
/* TEXT PAGINATION                                                     */
/* ================================================================== */
const splitTextIntoPages = (text, charsPerPage = 1200) => {
  if (!text || typeof text !== 'string') return [];

  const paragraphs = text
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean);

  const pages = [];
  let buffer = '';

  const flush = () => {
    if (buffer.trim()) {
      pages.push(buffer.trim());
      buffer = '';
    }
  };

  paragraphs.forEach(p => {
    if ((buffer + '\n\n' + p).length > charsPerPage && buffer.length > 0) {
      flush();
      buffer = p;
    } else {
      buffer = buffer ? `${buffer}\n\n${p}` : p;
    }

    while (buffer.length > charsPerPage * 1.6) {
      const slice = buffer.slice(0, charsPerPage);
      const lastSpace = slice.lastIndexOf(' ');
      const cutAt = lastSpace > charsPerPage * 0.6 ? lastSpace : charsPerPage;
      pages.push(buffer.slice(0, cutAt).trim());
      buffer = buffer.slice(cutAt).trim();
    }
  });

  flush();
  return pages;
};

/* ================================================================== */
/* BOOKS API                                                           */
/* ================================================================== */
export const booksAPI = {
  /* ---------------- SEARCH ---------------- */
  searchBooks: async ({
    query = '',
    category = 'All',
    sort = 'popular',
    page = 1,
    limit = 20,
  } = {}) => {
    const hasQuery = typeof query === 'string' && query.trim().length > 0;
    const hasCategory = category && category !== 'All';

    const buildParams = () => {
      const params = { page, limit };
      if (hasQuery) params.q = query.trim();
      if (hasCategory) params.category = category;
      if (sort && sort !== 'popular') params.sort = sort;
      return params;
    };

    const parseResponse = data => {
      const books = getBooksArray(data).map(normaliseBook).filter(Boolean);
      const total =
        data?.total ??
        data?.count ??
        data?.pagination?.total ??
        data?.meta?.total ??
        data?.payload?.total ??
        books.length;
      const hasMore =
        data?.hasMore ??
        data?.has_more ??
        (books.length >= limit && page * limit < total);
      return { books, total, hasMore, page };
    };

    if (hasQuery) {
      try {
        const { data } = await client.get('/books/search', {
          params: buildParams(),
        });
        return parseResponse(data);
      } catch (error) {
        if (__DEV__)
          console.log('/books/search failed, fallback:', error?.message);
      }
    }

    try {
      const { data } = await client.get('/books', { params: buildParams() });
      return parseResponse(data);
    } catch (error) {
      if (__DEV__) console.warn('/books failed:', error?.message);
      return { books: [], total: 0, hasMore: false, page };
    }
  },

  /* ---------------- CATEGORIES ---------------- */
  getCategories: async () => {
    const { data } = await client.get('/categories');
    const raw =
      data?.data?.categories || data?.categories || data?.data || data || [];
    if (!Array.isArray(raw)) return [];

    return raw
      .map(c => ({
        id: String(c.id ?? c._id ?? c.name ?? ''),
        name: c.name || c.title || c.category || 'Untitled',
        bookCount: c.bookCount ?? c.book_count ?? c.count ?? null,
        icon: c.icon || 'book',
        description: c.description || '',
      }))
      .filter(c => c.name);
  },

  /* ---------------- BOOK DETAILS (CACHED) ---------------- */
  getBookById: async bookId => {
    if (!bookId) return null;

    const cacheKey = String(bookId);

    const cached = readCache(bookDetailCache, cacheKey, BOOK_CACHE_TTL);
    if (cached) return cached;

    if (inflightBookDetails.has(cacheKey)) {
      return inflightBookDetails.get(cacheKey);
    }

    const fetchPromise = (async () => {
      /* Direct detail endpoint */
      try {
        const { data } = await client.get(
          `/books/${encodeURIComponent(cacheKey)}`,
        );
        const raw = getBookObject(data);
        if (raw) {
          if (__DEV__) console.log('📕 Book details:', raw.title);
          const enriched = enrichBookDetails(raw, data);
          if (enriched) return enriched;
        }
      } catch (error) {
        if (__DEV__) console.log('Detail endpoint failed:', error?.message);
      }

      /* Fallback: list with ID params */
      try {
        for (const params of [
          { id: cacheKey },
          { bookId: cacheKey },
          { book_id: cacheKey },
        ]) {
          try {
            const { data } = await client.get('/books', { params });
            const found = getBooksArray(data).find(item => {
              const id = item.id ?? item._id ?? item.book_id ?? item.bookId;
              return String(id) === cacheKey;
            });
            if (found) return enrichBookDetails(found, data);
          } catch {}
        }
      } catch {}

      /* Last resort: larger list */
      try {
        const { data } = await client.get('/books', { params: { limit: 500 } });
        const found = getBooksArray(data).find(item => {
          const id = item.id ?? item._id ?? item.book_id ?? item.bookId;
          return String(id) === cacheKey;
        });
        if (found) return enrichBookDetails(found, data);
      } catch {}

      return null;
    })();

    inflightBookDetails.set(cacheKey, fetchPromise);

    try {
      const result = await fetchPromise;
      if (result) writeCache(bookDetailCache, cacheKey, result);
      return result;
    } finally {
      inflightBookDetails.delete(cacheKey);
    }
  },

  /* ---------------- RELATED ---------------- */
  getRelated: async ({ category, excludeId, limit = 8 } = {}) => {
    if (!category || category === 'General') return [];

    const params = { category, limit: limit + 1 };
    if (excludeId) params.excludeId = excludeId;

    const { data } = await client.get('/books', { params });

    return getBooksArray(data)
      .map(normaliseBook)
      .filter(Boolean)
      .filter(b => String(b.id) !== String(excludeId))
      .slice(0, limit);
  },

  /* ---------------- BOOK CONTENT / PDF (CACHED) ---------------- */
  getBookContent: async (bookId, passedBook = null) => {
    if (!bookId) return { type: 'none' };

    const cacheKey = String(bookId);

    const cached = readCache(bookContentCache, cacheKey, CONTENT_CACHE_TTL);
    if (cached) return cached;

    if (inflightBookContent.has(cacheKey)) {
      return inflightBookContent.get(cacheKey);
    }

    const fetchPromise = (async () => {
      /* Try content endpoint */
      try {
        const { data } = await client.get(
          `/books/${encodeURIComponent(cacheKey)}/content`,
        );

        const payload =
          data?.data?.content && typeof data.data.content === 'object'
            ? data.data.content
            : data?.data || data || {};

        const nestedBook =
          data?.data?.book || data?.book || payload?.book || null;

        const pdfCandidates = [
          getPdfPathFromObject(payload),
          getPdfPathFromObject(nestedBook),
          getPdfPathFromObject(data?.data),
          getPdfPathFromObject(data),
        ];

        const rawPdfPath =
          pdfCandidates.find(v => typeof v === 'string' && v.trim()) || null;

        if (rawPdfPath) {
          const url = getPdfUrl(rawPdfPath);
          if (url) {
            if (__DEV__) console.log('📄 PDF URL resolved');
            return { type: 'pdf', url };
          }
        }

        /* Text pages */
        const rawPages =
          payload.pages ||
          payload.chapters ||
          payload.sections ||
          payload.data?.pages ||
          payload.data?.chapters;

        if (Array.isArray(rawPages) && rawPages.length > 0) {
          const pages = rawPages
            .map((page, idx) => ({
              page: page.page || page.pageNumber || page.page_number || idx + 1,
              chapter:
                page.chapter ||
                page.title ||
                page.heading ||
                `Chapter ${idx + 1}`,
              text:
                page.text ||
                page.content ||
                page.body ||
                page.html ||
                (typeof page === 'string' ? page : '') ||
                '',
            }))
            .filter(
              p => typeof p.text === 'string' && p.text.trim().length > 0,
            );

          if (pages.length > 0) return { type: 'text', pages };
        }

        /* Long text */
        const longText =
          (typeof payload.content === 'string' &&
            !looksLikePdfPath(payload.content) &&
            payload.content) ||
          (typeof payload.fullText === 'string' && payload.fullText) ||
          (typeof payload.text === 'string' && payload.text) ||
          '';

        if (longText.trim()) {
          const splitPages = splitTextIntoPages(longText);
          if (splitPages.length > 0) {
            return {
              type: 'text',
              pages: splitPages.map((text, idx) => ({
                page: idx + 1,
                chapter: idx === 0 ? 'Opening' : `Part ${idx + 1}`,
                text,
              })),
            };
          }
        }
      } catch (error) {
        if (__DEV__) {
          console.log('Content endpoint failed:', error?.response?.status);
        }
      }

      /* Fallback: PDF from passed book — no extra network */
      if (passedBook) {
        const passedPdf = getPdfPathFromObject(passedBook);
        if (passedPdf) {
          const url = getPdfUrl(passedPdf);
          if (url) return { type: 'pdf', url };
        }
      }

      /* Fallback: fetch details (uses cached getBookById) */
      try {
        const book = await booksAPI.getBookById(bookId);
        const pdfPath = getPdfPathFromObject(book);

        if (pdfPath) {
          const url = getPdfUrl(pdfPath);
          if (url) return { type: 'pdf', url };
        }

        if (book) {
          const fallbackText = [
            book.description || 'No description available.',
            `\n\nPreview edition of "${book.title}" by ${book.author}.`,
          ]
            .join('')
            .trim();

          const pages = splitTextIntoPages(fallbackText, 700);
          if (pages.length > 0) {
            return {
              type: 'text',
              pages: pages.map((text, idx) => ({
                page: idx + 1,
                chapter:
                  idx === 0 ? `About "${book.title}"` : `Part ${idx + 1}`,
                text,
              })),
              isFallback: true,
            };
          }
        }
      } catch (error) {
        if (__DEV__) console.warn('Fallback failed:', error?.message);
      }

      return { type: 'none' };
    })();

    inflightBookContent.set(cacheKey, fetchPromise);

    try {
      const result = await fetchPromise;
      if (result && result.type !== 'none') {
        writeCache(bookContentCache, cacheKey, result);
      }
      return result;
    } finally {
      inflightBookContent.delete(cacheKey);
    }
  },
};

/* ================================================================== */
/* CATEGORIES API                                                      */
/* ================================================================== */
export const categoriesAPI = {
  getAll: async () => {
    const { data } = await client.get('/categories');

    const raw =
      data?.data?.categories ||
      data?.categories ||
      data?.payload?.items ||
      data?.payload ||
      data?.items ||
      data?.results ||
      data?.data ||
      data ||
      [];

    if (!Array.isArray(raw)) return [];

    return raw
      .map(c => {
        const count =
          c.bookCount ??
          c.book_count ??
          c.books_count ??
          c.total_books ??
          c.totalBooks ??
          c.num_books ??
          c.count ??
          (Array.isArray(c.books) ? c.books.length : 0);

        return {
          id: String(c.id ?? c._id ?? c.slug ?? c.name ?? ''),
          name: c.name || c.title || c.category || 'Untitled',
          description:
            c.description || c.desc || c.summary || 'Explore this discipline.',
          icon: c.icon || c.iconName || c.icon_name || 'book',
          bookCount: Number(count) || 0,
        };
      })
      .filter(c => c.name);
  },

  getBooks: async ({
    categoryId,
    categoryName,
    page = 1,
    limit = 20,
    sort = 'popular',
  } = {}) => {
    const params = { page, limit, sort };
    if (categoryId) params.categoryId = categoryId;
    if (categoryName) params.category = categoryName;

    const { data } = await client.get('/books', { params });

    const books = getBooksArray(data).map(normaliseBook).filter(Boolean);

    const total =
      data?.total ??
      data?.count ??
      data?.pagination?.total ??
      data?.meta?.total ??
      data?.payload?.total ??
      books.length;

    const hasMore =
      data?.hasMore ??
      data?.has_more ??
      (books.length >= limit && page * limit < total);

    return { books, total, hasMore, page };
  },
};

export default booksAPI;
