import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* ------------------------------------------------------------------ */
/*  Base URL                                                           */
/*  React Native me env vars ka direct support nahi — hardcode karo    */
/*  ya react-native-config / expo-constants use karo.                  */
/* ------------------------------------------------------------------ */
export const API_BASE_URL = 'http://192.168.1.107:8000/api'; // Android emulator
// For iOS simulator:  "http://localhost:8000/api"
// For physical device: "http://<your-laptop-ip>:8000/api"

/* ------------------------------------------------------------------ */
/*  Axios instance for user endpoints                                  */
/* ------------------------------------------------------------------ */
const usersClient = axios.create({
  baseURL: `${API_BASE_URL}/users`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

/* ------------------------------------------------------------------ */
/*  Token storage keys                                                 */
/* ------------------------------------------------------------------ */
const TOKEN_KEY = 'ved_user_token';
const USER_KEY = 'ved_user';

/* ------------------------------------------------------------------ */
/*  Attach token to every request                                      */
/* ------------------------------------------------------------------ */
usersClient.interceptors.request.use(
  async config => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      /* ignore */
    }
    return config;
  },
  error => Promise.reject(error),
);

/* ------------------------------------------------------------------ */
/*  Handle 401 — clear token                                           */
/* ------------------------------------------------------------------ */
usersClient.interceptors.response.use(
  res => res,
  async error => {
    if (error.response?.status === 401) {
      try {
        await AsyncStorage.removeItem(TOKEN_KEY);
        await AsyncStorage.removeItem(USER_KEY);
      } catch {
        /* ignore */
      }
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Something went wrong';

    return Promise.reject({ ...error, message });
  },
);

/* ------------------------------------------------------------------ */
/*  Storage helpers                                                    */
/* ------------------------------------------------------------------ */
export const storage = {
  async getToken() {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  async getUser() {
    try {
      const raw = await AsyncStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  async saveSession({ token, user }) {
    try {
      if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
      if (user) await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {
      /* ignore */
    }
  },
  async clearSession() {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
    } catch {
      /* ignore */
    }
  },
};

/* ------------------------------------------------------------------ */
/*  User API methods                                                   */
/* ------------------------------------------------------------------ */
export const usersAPI = {
  /** Register a new user */
  register: async ({ fullName, name, email, password }) => {
    const payload = {
      name: fullName || name,
      email: (email || '').trim().toLowerCase(),
      password,
    };
    const { data } = await usersClient.post('/register', payload);
    return data;
  },

  /** Log in an existing user */
  login: async ({ email, password }) => {
    const payload = {
      email: (email || '').trim().toLowerCase(),
      password,
    };
    const { data } = await usersClient.post('/login', payload);
    return data;
  },

  /** Log out the current user (clears server-side session) */
  logout: async () => {
    try {
      const { data } = await usersClient.post('/logout');
      return data;
    } catch {
      /* even if server fails, client will clear session */
      return { success: true };
    }
  },

  /** Get the current user's profile */
  getProfile: async () => {
    const { data } = await usersClient.get('/profile');
    return data;
  },

  /** Update profile details (name, etc.) */
  updateProfile: async payload => {
    const { data } = await usersClient.patch('/profile', payload);
    return data;
  },

  /** Upload a new profile picture (React Native FormData) */
  updateProfilePicture: async fileUri => {
    const formData = new FormData();

    const filename = fileUri.split('/').pop();
    const ext = (filename.split('.').pop() || 'jpg').toLowerCase();
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

    formData.append('profilePic', {
      uri: fileUri,
      name: filename,
      type: mimeType,
    });

    const { data } = await usersClient.patch('/profile-picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  /** Change password */
  changePassword: async ({ currentPassword, newPassword }) => {
    const { data } = await usersClient.patch('/change-password', {
      currentPassword,
      newPassword,
    });
    return data;
  },
};

export default usersClient;
