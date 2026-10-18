import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import {
  getOnboardingCompleted,
  setOnboardingCompleted,
} from '../storage/asyncStorage';
import { usersAPI, storage } from '../api/usersApi';

const AuthContext = createContext({
  isLoadingSession: true,
  hasCompletedOnboarding: false,
  isAuthenticated: false,
  user: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  completeOnboarding: async () => {},
  updateProfile: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboardingState] =
    useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // Initialize session on app boot                                 //

  useEffect(() => {
    let cancelled = false;

    const initializeAuth = async () => {
      try {
        // 1. Onboarding flag
        const onboarded = await getOnboardingCompleted();
        if (!cancelled) setHasCompletedOnboardingState(onboarded);

        // 2. Restore token + user from storage
        const [token, savedUser] = await Promise.all([
          storage.getToken(),
          storage.getUser(),
        ]);

        if (!token || !savedUser) {
          if (!cancelled) {
            setIsAuthenticated(false);
            setUser(null);
          }
          return;
        }

        // 3. Optimistically restore session
        if (!cancelled) {
          setIsAuthenticated(true);
          setUser(savedUser);
        }

        // 4. Refresh profile in the background (validates token)
        try {
          const res = await usersAPI.getProfile();
          const fresh = res?.user || res?.data?.user || res?.data || res;

          if (!cancelled && fresh && typeof fresh === 'object') {
            setUser(fresh);
            await storage.saveSession({ user: fresh });
          }
        } catch (err) {
          // Token invalid/expired — clear session
          await storage.clearSession();
          if (!cancelled) {
            setIsAuthenticated(false);
            setUser(null);
          }
        }
      } catch (err) {
        console.error('Session initialization error:', err);
        if (!cancelled) {
          setIsAuthenticated(false);
          setUser(null);
        }
      } finally {
        if (!cancelled) setIsLoadingSession(false);
      }
    };

    initializeAuth();
    return () => {
      cancelled = true;
    };
  }, []);

  // Extract token + user from any backend response shape           //

  const extractAuth = res => {
    if (!res) return { token: null, user: null };

    const token =
      res.token ||
      res.accessToken ||
      res.access_token ||
      res.data?.token ||
      res.data?.accessToken ||
      null;

    const userData =
      res.user ||
      res.data?.user ||
      res.data?.data ||
      res.profile ||
      res.data?.profile ||
      null;

    return { token, user: userData };
  };

  // Login                                                          //

  const login = useCallback(async (email, password) => {
    const res = await usersAPI.login({ email, password });
    const { token, user: userData } = extractAuth(res);

    if (!token) {
      throw new Error(res?.message || 'Invalid credentials response');
    }
    if (!userData) {
      throw new Error('User data missing in response');
    }

    await storage.saveSession({ token, user: userData });

    setUser(userData);
    setIsAuthenticated(true);
    setHasCompletedOnboardingState(true);

    return { token, user: userData };
  }, []);

  // Register                                                       //

  const register = useCallback(async formData => {
    const res = await usersAPI.register(formData);
    const { token, user: userData } = extractAuth(res);

    // Some backends auto-login on register (return token).
    // Others only create the account — user must log in manually.
    if (token && userData) {
      await storage.saveSession({ token, user: userData });
      setUser(userData);
      setIsAuthenticated(true);
    }

    return res;
  }, []);

  // Logout                                                         //

  const logout = useCallback(async () => {
    try {
      await usersAPI.logout();
    } catch {
      //even if server fails, we clear locally//
    } finally {
      await storage.clearSession();
      setIsAuthenticated(false);
      setUser(null);
    }
  }, []);

  // Onboarding                                                     //

  const completeOnboarding = useCallback(async () => {
    await setOnboardingCompleted(true);
    setHasCompletedOnboardingState(true);
  }, []);

  // Profile updates                                                //

  const updateProfile = useCallback(
    async updatedFields => {
      // Optimistic local update
      const optimistic = { ...(user || {}), ...updatedFields };
      setUser(optimistic);

      // Try server sync
      try {
        const res = await usersAPI.updateProfile(updatedFields);
        const fresh = res?.user || res?.data?.user || res?.data || optimistic;

        setUser(fresh);
        await storage.saveSession({ user: fresh });
        return fresh;
      } catch (err) {
        // Rollback on failure
        setUser(user);
        throw err;
      }
    },
    [user],
  );

  //Manually refresh from server//
  const refreshProfile = useCallback(async () => {
    try {
      const res = await usersAPI.getProfile();
      const fresh = res?.user || res?.data?.user || res?.data || null;
      if (fresh) {
        setUser(fresh);
        await storage.saveSession({ user: fresh });
      }
      return fresh;
    } catch {
      return null;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLoadingSession,
        hasCompletedOnboarding,
        isAuthenticated,
        user,
        login,
        register,
        logout,
        completeOnboarding,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
