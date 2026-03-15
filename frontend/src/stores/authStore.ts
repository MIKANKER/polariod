import { create } from 'zustand';
import { User } from '../types/auth.types';
import { supabase } from '../services/supabase';
import {
  saveAuthToken,
  loadAuthToken,
  saveUser,
  loadUser,
  clearAllData,
} from '../utils/localStorage';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (data.session && data.user) {
      const user: User = {
        id: data.user.id,
        email: data.user.email!,
        createdAt: data.user.created_at,
      };

      const token = data.session.access_token;

      // Store in localStorage using utility functions
      saveAuthToken(token);
      saveUser(user);

      set({
        user,
        token,
        isAuthenticated: true,
      });
    }
  },

  register: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (data.session && data.user) {
      const user: User = {
        id: data.user.id,
        email: data.user.email!,
        createdAt: data.user.created_at,
      };

      const token = data.session.access_token;

      // Store in localStorage using utility functions
      saveAuthToken(token);
      saveUser(user);

      set({
        user,
        token,
        isAuthenticated: true,
      });
    }
  },

  logout: () => {
    // Sign out from Supabase
    supabase.auth.signOut();

    // Clear localStorage using utility function
    clearAllData();

    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  checkAuth: async () => {
    // Try to get session from Supabase
    const { data: { session } } = await supabase.auth.getSession();

    if (session && session.user) {
      const user: User = {
        id: session.user.id,
        email: session.user.email!,
        createdAt: session.user.created_at,
      };

      const token = session.access_token;

      // Update localStorage using utility functions
      saveAuthToken(token);
      saveUser(user);

      set({
        user,
        token,
        isAuthenticated: true,
      });
    } else {
      // No valid session, check localStorage using utility functions
      const storedToken = loadAuthToken();
      const storedUser = loadUser();

      if (storedToken && storedUser) {
        set({
          user: storedUser,
          token: storedToken,
          isAuthenticated: true,
        });
      }
    }
  },
}));
