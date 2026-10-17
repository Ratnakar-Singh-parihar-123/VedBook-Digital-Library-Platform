import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  ONBOARDING_COMPLETED: '@vedbook_onboarding_completed',
  AUTH_SESSION: '@vedbook_auth_session',
  USER_PROFILE: '@vedbook_user_profile',
  REGISTERED_USERS: '@vedbook_registered_users',
  BOOKMARKS: '@vedbook_bookmarks',
  READING_PROGRESS: '@vedbook_reading_progress',
  NOTIFICATIONS: '@vedbook_notifications',
  RECENTLY_OPENED: '@vedbook_recently_opened',
  COMPLETED_BOOKS: '@vedbook_completed_books',
};

// User-scoped key helpers
export const getUserKey = (prefix, userId) => {
  if (!userId) return prefix;
  return `${prefix}_u${userId}`;
};

// Onboarding
export const getOnboardingCompleted = async () => {
  try {
    const val = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
    return val === 'true';
  } catch (e) {
    return false;
  }
};

export const setOnboardingCompleted = async (completed = true) => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.ONBOARDING_COMPLETED,
      completed ? 'true' : 'false',
    );
  } catch (e) {
    console.error('Failed to set onboarding status', e);
  }
};

// Auth Session
export const getSavedSession = async () => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
    return json ? JSON.parse(json) : null;
  } catch (e) {
    return null;
  }
};

export const saveAuthSession = async (session) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(session));
  } catch (e) {
    console.error('Failed to save auth session', e);
  }
};

export const clearAuthSession = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
  } catch (e) {
    console.error('Failed to clear auth session', e);
  }
};

// User Profile
export const getUserProfile = async () => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    return json ? JSON.parse(json) : null;
  } catch (e) {
    return null;
  }
};

export const saveUserProfile = async (profile) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save user profile', e);
  }
};

// Registered Users (for local demo registration persistence)
export const getRegisteredUsers = async () => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.REGISTERED_USERS);
    return json ? JSON.parse(json) : [];
  } catch (e) {
    return [];
  }
};

export const saveRegisteredUser = async (user) => {
  try {
    const existing = await getRegisteredUsers();
    const filtered = existing.filter((u) => u.email.toLowerCase() !== user.email.toLowerCase());
    const updated = [...filtered, user];
    await AsyncStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save registered user', e);
    return [];
  }
};

// User-scoped Bookmarks
export const getUserBookmarks = async (userId) => {
  if (!userId) return [];
  try {
    const json = await AsyncStorage.getItem(getUserKey(STORAGE_KEYS.BOOKMARKS, userId));
    return json ? JSON.parse(json) : [];
  } catch (e) {
    return [];
  }
};

export const saveUserBookmarks = async (userId, bookmarks) => {
  if (!userId) return;
  try {
    await AsyncStorage.setItem(
      getUserKey(STORAGE_KEYS.BOOKMARKS, userId),
      JSON.stringify(bookmarks || []),
    );
  } catch (e) {
    console.error('Failed to save user bookmarks', e);
  }
};

// Fallback/Legacy Bookmarks (no mock items!)
export const getBookmarks = async (userId = null) => {
  if (userId) return getUserBookmarks(userId);
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.BOOKMARKS);
    return json ? JSON.parse(json) : [];
  } catch (e) {
    return [];
  }
};

export const saveBookmarks = async (bookmarks, userId = null) => {
  if (userId) return saveUserBookmarks(userId, bookmarks);
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks || []));
  } catch (e) {
    console.error('Failed to save bookmarks', e);
  }
};

// User-scoped Reading Progress
export const getUserReadingProgress = async (userId) => {
  if (!userId) return {};
  try {
    const json = await AsyncStorage.getItem(getUserKey(STORAGE_KEYS.READING_PROGRESS, userId));
    return json ? JSON.parse(json) : {};
  } catch (e) {
    return {};
  }
};

export const saveUserReadingProgress = async (userId, progressMap) => {
  if (!userId) return;
  try {
    await AsyncStorage.setItem(
      getUserKey(STORAGE_KEYS.READING_PROGRESS, userId),
      JSON.stringify(progressMap || {}),
    );
  } catch (e) {
    console.error('Failed to save user reading progress', e);
  }
};

// Fallback/Legacy Reading Progress (no mock items!)
export const getReadingProgress = async (userId = null) => {
  if (userId) return getUserReadingProgress(userId);
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.READING_PROGRESS);
    return json ? JSON.parse(json) : {};
  } catch (e) {
    return {};
  }
};

export const saveReadingProgress = async (progressMap, userId = null) => {
  if (userId) return saveUserReadingProgress(userId, progressMap);
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.READING_PROGRESS, JSON.stringify(progressMap || {}));
  } catch (e) {
    console.error('Failed to save reading progress', e);
  }
};

// User-scoped Completed Books
export const getUserCompletedBooks = async (userId) => {
  if (!userId) return [];
  try {
    const json = await AsyncStorage.getItem(getUserKey(STORAGE_KEYS.COMPLETED_BOOKS, userId));
    return json ? JSON.parse(json) : [];
  } catch (e) {
    return [];
  }
};

export const saveUserCompletedBooks = async (userId, completedList) => {
  if (!userId) return;
  try {
    await AsyncStorage.setItem(
      getUserKey(STORAGE_KEYS.COMPLETED_BOOKS, userId),
      JSON.stringify(completedList || []),
    );
  } catch (e) {
    console.error('Failed to save user completed books', e);
  }
};

export const getCompletedBooks = async (userId = null) => {
  if (userId) return getUserCompletedBooks(userId);
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.COMPLETED_BOOKS);
    return json ? JSON.parse(json) : [];
  } catch (e) {
    return [];
  }
};

export const saveCompletedBooks = async (completedList, userId = null) => {
  if (userId) return saveUserCompletedBooks(userId, completedList);
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.COMPLETED_BOOKS, JSON.stringify(completedList || []));
  } catch (e) {
    console.error('Failed to save completed books', e);
  }
};

// User-scoped Notifications
export const getUserStoredNotifications = async (userId) => {
  if (!userId) return [];
  try {
    const json = await AsyncStorage.getItem(getUserKey(STORAGE_KEYS.NOTIFICATIONS, userId));
    return json ? JSON.parse(json) : [];
  } catch (e) {
    return [];
  }
};

export const saveUserStoredNotifications = async (userId, notifications) => {
  if (!userId) return;
  try {
    await AsyncStorage.setItem(
      getUserKey(STORAGE_KEYS.NOTIFICATIONS, userId),
      JSON.stringify(notifications || []),
    );
  } catch (e) {
    console.error('Failed to save user notifications', e);
  }
};

export const getStoredNotifications = async (userId = null) => {
  if (userId) return getUserStoredNotifications(userId);
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return json ? JSON.parse(json) : null;
  } catch (e) {
    return null;
  }
};

export const saveStoredNotifications = async (notifications, userId = null) => {
  if (userId) return saveUserStoredNotifications(userId, notifications);
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications || []));
  } catch (e) {
    console.error('Failed to save notifications', e);
  }
};

// User-scoped Recently Opened
export const getUserRecentlyOpened = async (userId) => {
  if (!userId) return [];
  try {
    const json = await AsyncStorage.getItem(getUserKey(STORAGE_KEYS.RECENTLY_OPENED, userId));
    return json ? JSON.parse(json) : [];
  } catch (e) {
    return [];
  }
};

export const saveUserRecentlyOpened = async (userId, list) => {
  if (!userId) return;
  try {
    await AsyncStorage.setItem(
      getUserKey(STORAGE_KEYS.RECENTLY_OPENED, userId),
      JSON.stringify(list || []),
    );
  } catch (e) {
    console.error('Failed to save user recently opened', e);
  }
};

export const getRecentlyOpened = async (userId = null) => {
  if (userId) return getUserRecentlyOpened(userId);
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.RECENTLY_OPENED);
    return json ? JSON.parse(json) : [];
  } catch (e) {
    return [];
  }
};

export const saveRecentlyOpened = async (list, userId = null) => {
  if (userId) return saveUserRecentlyOpened(userId, list);
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.RECENTLY_OPENED, JSON.stringify(list || []));
  } catch (e) {
    console.error('Failed to save recently opened', e);
  }
};

// Clear all data for a specific user
export const clearUserData = async (userId) => {
  if (!userId) return;
  try {
    await Promise.all([
      AsyncStorage.removeItem(getUserKey(STORAGE_KEYS.BOOKMARKS, userId)),
      AsyncStorage.removeItem(getUserKey(STORAGE_KEYS.READING_PROGRESS, userId)),
      AsyncStorage.removeItem(getUserKey(STORAGE_KEYS.COMPLETED_BOOKS, userId)),
      AsyncStorage.removeItem(getUserKey(STORAGE_KEYS.NOTIFICATIONS, userId)),
      AsyncStorage.removeItem(getUserKey(STORAGE_KEYS.RECENTLY_OPENED, userId)),
    ]);
  } catch (e) {
    console.error('Failed to clear user data', e);
  }
};
