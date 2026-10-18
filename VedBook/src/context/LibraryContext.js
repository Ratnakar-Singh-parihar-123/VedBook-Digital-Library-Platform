// src/context/LibraryContext.js

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { libraryAPI } from '../api/libraryApi';

// User-scoped Storage Keys                                         //

const getStorageKeys = userId => ({
  BOOKMARKS: userId ? `@vedbook_u${userId}_bookmarks` : null,
  PROGRESS: userId ? `@vedbook_u${userId}_reading_progress` : null,
  COMPLETED: userId ? `@vedbook_u${userId}_completed` : null,
  RECENT: userId ? `@vedbook_u${userId}_recently_opened` : null,
  NOTIFS: userId ? `@vedbook_u${userId}_notifications` : null,
  BOOK_META: '@vedbook_shared_book_meta_cache',
});

// Debounced writer                                                 //

const debouncedWriter = (saveFn, delay = 400) => {
  let timer = null;
  let pending = null;

  return (key, value) => {
    pending = { key, value };
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      const toWrite = pending;
      timer = null;
      pending = null;
      if (toWrite?.key) {
        try {
          saveFn?.(toWrite.key, toWrite.value);
        } catch {}
      }
    }, delay);
  };
};

// Storage helpers                                                  //

const readJSON = async key => {
  if (!key) return null;
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeJSON = async (key, value) => {
  if (!key) return;
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

// Book metadata normaliser                                         //

const extractMeta = book => {
  if (!book || typeof book !== 'object') return null;

  const id = book.id ?? book._id ?? book.book_id ?? book.bookId;
  if (!id) return null;

  return {
    id: String(id),
    title: book.title || book.book_title || 'Untitled',
    author: book.author || book.book_author || 'Unknown author',
    coverImage:
      book.coverImage ||
      book.cover ||
      book.cover_image ||
      book.coverUrl ||
      book.thumbnail ||
      null,
    category:
      book.category ||
      book.categoryName ||
      book.category_name ||
      book.category?.name ||
      'General',
    description: book.description || '',
    pages: book.pages || book.totalPages || book.total_pages || null,
    cachedAt: Date.now(),
  };
};

// Context                                                          //

const LibraryContext = createContext(null);

// Provider                                                         //

export const LibraryProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const currentUserId = user?.id ? String(user.id) : null;
  const currentUserIdRef = useRef(currentUserId);

  const [bookmarks, setBookmarks] = useState([]);
  const [readingProgress, setReadingProgress] = useState({});
  const [completedBooks, setCompletedBooks] = useState([]);
  const [recentlyOpened, setRecentlyOpened] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [bookMetaCache, setBookMetaCache] = useState({});
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  //Debounced persist//
  const persistJSON = useRef(debouncedWriter(writeJSON, 400)).current;

  // Clear all in-memory library state                                //

  const clearLibraryState = useCallback(() => {
    setBookmarks([]);
    setReadingProgress({});
    setCompletedBooks([]);
    setRecentlyOpened([]);
    setNotifications([]);
  }, []);

  // registerBooks — batch save metadata for array of books           //

  const registerBooks = useCallback(
    booksArray => {
      if (!Array.isArray(booksArray) || booksArray.length === 0) return;

      setBookMetaCache(prev => {
        let changed = false;
        const next = { ...prev };

        booksArray.forEach(book => {
          const meta = extractMeta(book);
          if (!meta) return;

          const existing = prev[meta.id];
          if (
            existing &&
            existing.title === meta.title &&
            existing.coverImage === meta.coverImage &&
            existing.author === meta.author
          ) {
            return;
          }

          next[meta.id] = { ...existing, ...meta };
          changed = true;
        });

        if (!changed) return prev;

        persistJSON('@vedbook_shared_book_meta_cache', next);
        return next;
      });
    },
    [persistJSON],
  );

  // Hydrate Shared Book Metadata on startup                          //

  useEffect(() => {
    readJSON('@vedbook_shared_book_meta_cache').then(meta => {
      if (meta && typeof meta === 'object') {
        setBookMetaCache(prev => ({ ...prev, ...meta }));
      }
    });
  }, []);

  // Hydrate & Sync for Active User                                   //

  const refreshLibrary = useCallback(async () => {
    const uid = currentUserIdRef.current;
    if (!uid) {
      clearLibraryState();
      return;
    }

    const keys = getStorageKeys(uid);
    setIsLoadingLibrary(true);

    try {
      // 1. Fetch server state for this authenticated user
      const [continueRes, bmRes, compRes, recentRes] = await Promise.allSettled(
        [
          libraryAPI.getContinueReading(),
          libraryAPI.getBookmarks(),
          libraryAPI.getCompleted(),
          libraryAPI.getRecentlyOpened(),
        ],
      );

      if (currentUserIdRef.current !== uid) return; // User switched during fetch

      const booksToRegister = [];

      // Process Continue Reading
      if (
        continueRes.status === 'fulfilled' &&
        Array.isArray(continueRes.value)
      ) {
        const progMap = {};
        continueRes.value.forEach(book => {
          if (book?.id) {
            booksToRegister.push(book);
            const p = book.progress || {};
            progMap[String(book.id)] = {
              currentPage: p.currentPage || 1,
              totalPages: p.totalPages || book.pages || 100,
              percentage: p.percentage ?? p.progressPercent ?? 0,
              lastRead: book.lastReadAt || new Date().toISOString(),
              lastReadAt: book.lastReadAt || new Date().toISOString(),
            };
          }
        });
        setReadingProgress(progMap);
        writeJSON(keys.PROGRESS, progMap);
      }

      // Process Bookmarks
      if (bmRes.status === 'fulfilled' && Array.isArray(bmRes.value)) {
        const bmIds = bmRes.value.map(b => {
          booksToRegister.push(b);
          return String(b.id);
        });
        setBookmarks(bmIds);
        writeJSON(keys.BOOKMARKS, bmIds);
      }

      // Process Completed
      if (compRes.status === 'fulfilled' && Array.isArray(compRes.value)) {
        const compIds = compRes.value.map(b => {
          booksToRegister.push(b);
          return String(b.id);
        });
        setCompletedBooks(compIds);
        writeJSON(keys.COMPLETED, compIds);
      }

      // Process Recently Opened
      if (recentRes.status === 'fulfilled' && Array.isArray(recentRes.value)) {
        const recentIds = recentRes.value.map(b => {
          booksToRegister.push(b);
          return String(b.id);
        });
        setRecentlyOpened(recentIds);
        writeJSON(keys.RECENT, recentIds);
      }

      if (booksToRegister.length > 0) {
        registerBooks(booksToRegister);
      }
    } catch (e) {
      if (__DEV__)
        console.warn('refreshLibrary network sync error:', e?.message);
    } finally {
      if (currentUserIdRef.current === uid) {
        setIsLoadingLibrary(false);
      }
    }
  }, [clearLibraryState, registerBooks]);

  //Re-hydrate on user login/logout//
  useEffect(() => {
    let cancelled = false;

    if (!currentUserId || !isAuthenticated) {
      clearLibraryState();
      return;
    }

    const keys = getStorageKeys(currentUserId);

    // 1. Instant local restore from user-scoped storage
    (async () => {
      try {
        const [bm, rp, cb, ro, nt] = await Promise.all([
          readJSON(keys.BOOKMARKS),
          readJSON(keys.PROGRESS),
          readJSON(keys.COMPLETED),
          readJSON(keys.RECENT),
          readJSON(keys.NOTIFS),
        ]);

        if (cancelled || currentUserIdRef.current !== currentUserId) return;

        setBookmarks(Array.isArray(bm) ? bm : []);
        setReadingProgress(rp && typeof rp === 'object' ? rp : {});
        setCompletedBooks(Array.isArray(cb) ? cb : []);
        setRecentlyOpened(Array.isArray(ro) ? ro : []);
        setNotifications(Array.isArray(nt) ? nt : []);

        // 2. Background sync with backend
        refreshLibrary();
      } catch (e) {
        if (!cancelled) refreshLibrary();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentUserId, isAuthenticated, clearLibraryState, refreshLibrary]);

  // recordBookOpened                                                 //

  const recordBookOpened = useCallback(
    bookOrId => {
      if (!bookOrId) return;

      const isObject = typeof bookOrId === 'object';
      const id = String(isObject ? bookOrId.id ?? bookOrId._id : bookOrId);
      if (!id) return;

      if (isObject) {
        registerBooks([bookOrId]);
      }

      const uid = currentUserIdRef.current;
      if (!uid) return;

      const keys = getStorageKeys(uid);

      setRecentlyOpened(prev => {
        const filtered = prev.filter(x => String(x) !== id);
        const next = [id, ...filtered].slice(0, 30);
        persistJSON(keys.RECENT, next);
        return next;
      });

      // Background backend sync
      libraryAPI.recordBookOpened(id);
    },
    [registerBooks, persistJSON],
  );

  // updateReadingProgress                                            //

  const updateReadingProgress = useCallback(
    (bookId, currentPage, totalPages) => {
      if (!bookId) return;
      const id = String(bookId);
      const uid = currentUserIdRef.current;

      const safeTotal = Math.max(1, Number(totalPages) || 1);
      const safePage = Math.min(
        Math.max(1, Number(currentPage) || 1),
        safeTotal,
      );
      const percentage = Math.min(
        100,
        Math.round((safePage / safeTotal) * 100),
      );
      const now = new Date().toISOString();

      if (uid) {
        const keys = getStorageKeys(uid);

        setReadingProgress(prev => {
          const next = {
            ...prev,
            [id]: {
              currentPage: safePage,
              totalPages: safeTotal,
              percentage,
              lastRead: now,
              lastReadAt: now,
            },
          };
          persistJSON(keys.PROGRESS, next);
          return next;
        });

        if (percentage >= 99) {
          setCompletedBooks(prev => {
            if (prev.includes(id)) return prev;
            const next = [id, ...prev];
            persistJSON(keys.COMPLETED, next);
            return next;
          });
        }

        // Backend sync
        libraryAPI.saveReadingProgress(id, safePage, safeTotal).catch(() => {});
      }
    },
    [persistJSON],
  );

  // toggleBookmark                                                   //

  const toggleBookmark = useCallback(
    bookId => {
      if (!bookId) return;
      const id = String(bookId);
      const uid = currentUserIdRef.current;
      if (!uid) return;

      const keys = getStorageKeys(uid);

      let willBeBookmarked = false;
      setBookmarks(prev => {
        willBeBookmarked = !prev.includes(id);
        const next = willBeBookmarked
          ? [id, ...prev]
          : prev.filter(x => x !== id);
        persistJSON(keys.BOOKMARKS, next);
        return next;
      });

      // Backend sync
      if (willBeBookmarked) {
        libraryAPI.addBookmark(id).catch(() => {});
      } else {
        libraryAPI.removeBookmark(id).catch(() => {});
      }
    },
    [persistJSON],
  );

  const isBookmarked = useCallback(
    bookId => {
      if (!bookId) return false;
      return bookmarks.includes(String(bookId));
    },
    [bookmarks],
  );

  // Notifications                                                    //

  const markNotificationAsRead = useCallback(
    notifId => {
      if (!notifId) return;
      const uid = currentUserIdRef.current;
      const keys = getStorageKeys(uid);

      setNotifications(prev => {
        const next = prev.map(n =>
          String(n.id) === String(notifId) ? { ...n, isRead: true } : n,
        );
        if (keys.NOTIFS) persistJSON(keys.NOTIFS, next);
        return next;
      });
    },
    [persistJSON],
  );

  const markAllNotificationsAsRead = useCallback(() => {
    const uid = currentUserIdRef.current;
    const keys = getStorageKeys(uid);

    setNotifications(prev => {
      const next = prev.map(n => ({ ...n, isRead: true }));
      if (keys.NOTIFS) persistJSON(keys.NOTIFS, next);
      return next;
    });
  }, [persistJSON]);

  // buildBook — assemble full book from meta + progress              //

  const buildBook = useCallback(
    (id, progress = null) => {
      const key = String(id);
      const meta = bookMetaCache[key];

      return {
        id: key,
        title: meta?.title || `Book ${key}`,
        author: meta?.author || 'Unknown author',
        coverImage: meta?.coverImage || null,
        cover: meta?.coverImage || null,
        category: meta?.category || 'General',
        description: meta?.description || '',
        pages: meta?.pages || null,
        progress: progress || null,
      };
    },
    [bookMetaCache],
  );

  // Getters                                                          //

  const getContinueReadingBooks = useCallback(() => {
    if (!currentUserIdRef.current) return [];

    return Object.entries(readingProgress)
      .filter(([, p]) => {
        if (!p) return false;
        const pct = Number(p.percentage ?? p.progressPercent) || 0;
        return pct > 0 && pct < 100;
      })
      .map(([id, progress]) => buildBook(id, progress))
      .sort((a, b) => {
        const aT = new Date(
          a.progress?.lastRead || a.progress?.lastReadAt || 0,
        ).getTime();
        const bT = new Date(
          b.progress?.lastRead || b.progress?.lastReadAt || 0,
        ).getTime();
        return bT - aT;
      });
  }, [readingProgress, buildBook]);

  const getBookmarkedBooks = useCallback(() => {
    if (!currentUserIdRef.current) return [];
    return bookmarks.map(id => buildBook(id));
  }, [bookmarks, buildBook]);

  const getCompletedBooksList = useCallback(() => {
    if (!currentUserIdRef.current) return [];
    return completedBooks.map(id =>
      buildBook(id, readingProgress[String(id)] || null),
    );
  }, [completedBooks, readingProgress, buildBook]);

  const getRecentlyOpenedBooks = useCallback(() => {
    if (!currentUserIdRef.current) return [];
    return recentlyOpened.map(id =>
      buildBook(id, readingProgress[String(id)] || null),
    );
  }, [recentlyOpened, readingProgress, buildBook]);

  const unreadNotificationsCount = useMemo(
    () => notifications.filter(n => !n.isRead).length,
    [notifications],
  );

  // Context Value                                                    //

  const value = useMemo(
    () => ({
      bookmarks,
      readingProgress,
      completedBooks,
      recentlyOpened,
      notifications,
      bookMetaCache,
      isLoadingLibrary,
      unreadNotificationsCount,

      //Actions//
      toggleBookmark,
      isBookmarked,
      updateReadingProgress,
      recordBookOpened,
      registerBooks,
      clearLibraryState,
      refreshLibrary,
      markNotificationAsRead,
      markAllNotificationsAsRead,

      //Getters//
      getContinueReadingBooks,
      getBookmarkedBooks,
      getCompletedBooksList,
      getRecentlyOpenedBooks,
    }),
    [
      bookmarks,
      readingProgress,
      completedBooks,
      recentlyOpened,
      notifications,
      bookMetaCache,
      isLoadingLibrary,
      unreadNotificationsCount,
      toggleBookmark,
      isBookmarked,
      updateReadingProgress,
      recordBookOpened,
      registerBooks,
      clearLibraryState,
      refreshLibrary,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      getContinueReadingBooks,
      getBookmarkedBooks,
      getCompletedBooksList,
      getRecentlyOpenedBooks,
    ],
  );

  return (
    <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const ctx = useContext(LibraryContext);
  if (!ctx) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return ctx;
};

export default LibraryContext;
