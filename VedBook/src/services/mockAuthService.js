/**
 * VedBook Mock Authentication Service
 *
 * NOTE: This is an isolated local-only mock service for prototype/demo purposes.
 * It simulates network latency, session tokens, and account persistence.
 * For production, swap this module with real backend authentication endpoints (e.g. REST/GraphQL/Firebase/Supabase).
 */

import {
  getSavedSession,
  saveAuthSession,
  clearAuthSession,
  getUserProfile,
  saveUserProfile,
  getRegisteredUsers,
  saveRegisteredUser,
  setOnboardingCompleted,
} from '../storage/asyncStorage';

// Pre-seeded demo accounts
export const DEMO_CREDENTIALS = [
  {
    id: 'user-demo-1',
    fullName: 'Vedant Sharma',
    email: 'demo@vedbook.com',
    password: 'Password123!',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
    bio: 'Avid reader of ancient philosophy, Indian history, and modern cosmology.',
    streak: 7,
    booksRead: 14,
    hoursRead: 38,
    joinedDate: 'January 2025',
  },
  {
    id: 'user-demo-2',
    fullName: 'Arya Sen',
    email: 'reader@vedbook.com',
    password: 'Password123!',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop',
    bio: 'Software engineer and literature lover.',
    streak: 12,
    booksRead: 26,
    hoursRead: 64,
    joinedDate: 'December 2024',
  },
];

const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockAuthService = {
  /**
   * Log in user using email and password
   */
  async login(email, password) {
    await delay(450);

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanEmail || !cleanPass) {
      throw new Error('Please enter both email and password.');
    }

    // Check predefined demo accounts
    let user = DEMO_CREDENTIALS.find(
      (u) => u.email.toLowerCase() === cleanEmail && u.password === cleanPass,
    );

    // Check dynamically registered local demo accounts
    if (!user) {
      const registered = await getRegisteredUsers();
      user = registered.find(
        (u) => u.email.toLowerCase() === cleanEmail && u.password === cleanPass,
      );
    }

    if (!user) {
      throw new Error('Invalid email or password. Please verify your credentials or use the demo login.');
    }

    // Create session token
    const session = {
      token: `demo-token-${user.id}-${Date.now()}`,
      userId: user.id,
      email: user.email,
      createdAt: new Date().toISOString(),
    };

    const profile = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio || 'VedBook Member',
      streak: user.streak || 3,
      booksRead: user.booksRead || 5,
      hoursRead: user.hoursRead || 12,
      joinedDate: user.joinedDate || 'Recently',
    };

    await saveAuthSession(session);
    await saveUserProfile(profile);
    await setOnboardingCompleted(true);

    return { session, profile };
  },

  /**
   * Register a new demo account
   */
  async register({ fullName, email, password }) {
    await delay(500);

    const cleanName = (fullName || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanName) {
      throw new Error('Full name is required.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      throw new Error('Please provide a valid email address.');
    }

    if (!cleanPass || cleanPass.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    // Check for collision
    const registered = await getRegisteredUsers();
    const existsInDemo = DEMO_CREDENTIALS.some((u) => u.email.toLowerCase() === cleanEmail);
    const existsInRegistered = registered.some((u) => u.email.toLowerCase() === cleanEmail);

    if (existsInDemo || existsInRegistered) {
      throw new Error('An account with this email already exists. Please log in.');
    }

    const newUser = {
      id: `user-custom-${Date.now()}`,
      fullName: cleanName,
      email: cleanEmail,
      password: cleanPass,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=400&auto=format&fit=crop',
      bio: 'New explorer of the VedBook digital library.',
      streak: 1,
      booksRead: 0,
      hoursRead: 0,
      joinedDate: 'October 2025',
    };

    await saveRegisteredUser(newUser);

    const session = {
      token: `demo-token-${newUser.id}-${Date.now()}`,
      userId: newUser.id,
      email: newUser.email,
      createdAt: new Date().toISOString(),
    };

    const profile = {
      id: newUser.id,
      fullName: newUser.fullName,
      email: newUser.email,
      avatar: newUser.avatar,
      bio: newUser.bio,
      streak: newUser.streak,
      booksRead: newUser.booksRead,
      hoursRead: newUser.hoursRead,
      joinedDate: newUser.joinedDate,
    };

    await saveAuthSession(session);
    await saveUserProfile(profile);
    await setOnboardingCompleted(true);

    return { session, profile };
  },

  /**
   * Send simulated password reset link
   */
  async forgotPassword(email) {
    await delay(450);

    const cleanEmail = (email || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      throw new Error('Please enter a valid email address.');
    }

    return {
      success: true,
      message: `Password reset instructions have been sent to ${cleanEmail}. Please check your inbox.`,
    };
  },

  /**
   * Verify saved local session
   */
  async verifySession() {
    const session = await getSavedSession();
    if (!session || !session.token) {
      return null;
    }

    let profile = await getUserProfile();
    if (!profile) {
      profile = {
        id: session.userId,
        fullName: 'VedBook Reader',
        email: session.email,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
        bio: 'Avid reader and knowledge seeker.',
        streak: 5,
        booksRead: 8,
        hoursRead: 22,
        joinedDate: '2025',
      };
      await saveUserProfile(profile);
    }

    return { session, profile };
  },

  /**
   * Clear active demo session while preserving onboarding
   */
  async logout() {
    await delay(250);
    await clearAuthSession();
    return true;
  },
};
