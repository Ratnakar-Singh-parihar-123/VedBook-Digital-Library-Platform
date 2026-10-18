const RECENTLY_VIEWED_KEY = "ved_recently_viewed";
const FAVORITES_KEY = "ved_favorites";
const READING_PROGRESS_KEY = "ved_reading_progress";
const READER_PREFS_KEY = "ved_reader_prefs";

const MAX_RECENT_BOOKS = 12;

// Helper to dispatch storage updates to current tab                 */

function dispatchLibraryChange(type, data) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("ved-library-change", { detail: { type, data } }),
    );
  }
}

// Recently Viewed Books                                             */

export function getRecentlyViewed() {
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addRecentlyViewed(book) {
  if (!book || (!book.id && !book._id)) return;
  const id = book.id || book._id;

  try {
    const list = getRecentlyViewed().filter((b) => (b.id || b._id) !== id);
    const item = {
      id,
      title: book.title || "Untitled",
      author: book.author || "Unknown author",
      cover: book.cover || book.cover_image || book.coverImage || "",
      category: book.category || "",
      language: book.language || "",
      viewedAt: Date.now(),
    };

    const updated = [item, ...list].slice(0, MAX_RECENT_BOOKS);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
    dispatchLibraryChange("recent", updated);
  } catch (e) {
    console.warn("Could not save recently viewed:", e);
  }
}

export function clearRecentlyViewed() {
  try {
    localStorage.removeItem(RECENTLY_VIEWED_KEY);
    dispatchLibraryChange("recent", []);
  } catch (e) {
    console.warn("Could not clear recently viewed:", e);
  }
}

// Bookmarks / Favorites                                             */

export function getFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isFavorite(bookId) {
  if (!bookId) return false;
  const favs = getFavorites();
  return favs.some((b) => (b.id || b._id) === bookId);
}

export function toggleFavorite(book) {
  if (!book || (!book.id && !book._id)) return false;
  const id = book.id || book._id;

  try {
    const list = getFavorites();
    const index = list.findIndex((b) => (b.id || b._id) === id);
    let updated;
    let saved;

    if (index >= 0) {
      updated = list.filter((b) => (b.id || b._id) !== id);
      saved = false;
    } else {
      const item = {
        id,
        title: book.title || "Untitled",
        author: book.author || "Unknown author",
        cover: book.cover || book.cover_image || book.coverImage || "",
        category: book.category || "",
        language: book.language || "",
        savedAt: Date.now(),
      };
      updated = [item, ...list];
      saved = true;
    }

    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    dispatchLibraryChange("favorites", updated);
    return saved;
  } catch (e) {
    console.warn("Could not toggle favorite:", e);
    return false;
  }
}

// Reading Progress (Page position)                                  */

export function getReadingProgress(bookId) {
  if (!bookId) return null;
  try {
    const map = JSON.parse(localStorage.getItem(READING_PROGRESS_KEY) || "{}");
    return map[bookId] || null;
  } catch {
    return null;
  }
}

export function saveReadingProgress(bookId, page, totalPages = null) {
  if (!bookId || !page) return;
  try {
    const map = JSON.parse(localStorage.getItem(READING_PROGRESS_KEY) || "{}");
    map[bookId] = {
      page: Number(page),
      totalPages: totalPages
        ? Number(totalPages)
        : map[bookId]?.totalPages || null,
      updatedAt: Date.now(),
    };
    localStorage.setItem(READING_PROGRESS_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn("Could not save reading progress:", e);
  }
}

// Reader Preferences (theme, spread)                                */

export function getReaderPrefs() {
  try {
    const raw = localStorage.getItem(READER_PREFS_KEY);
    return raw ? JSON.parse(raw) : { theme: "cream", spread: "auto" };
  } catch {
    return { theme: "cream", spread: "auto" };
  }
}

export function saveReaderPrefs(prefs) {
  try {
    const current = getReaderPrefs();
    const updated = { ...current, ...prefs };
    localStorage.setItem(READER_PREFS_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return prefs;
  }
}
