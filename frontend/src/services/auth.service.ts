import { supabase } from './supabase';
import { User } from '../types/auth.types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

/**
 * Authentication service for handling user login, registration, and token validation
 */
export const authService = {
  /**
   * Login user with email and password using Supabase Auth
   * @param email - User email
   * @param password - User password
   * @returns User data and access token
   * @throws Error if login fails
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.session || !data.user) {
      throw new Error('No se pudo iniciar sesión');
    }

    const user: User = {
      id: data.user.id,
      email: data.user.email!,
      createdAt: data.user.created_at,
    };

    return {
      user,
      token: data.session.access_token,
    };
  },

  /**
   * Register new user with email and password using Supabase Auth
   * @param email - User email
   * @param password - User password
   * @returns User data and access token
   * @throws Error if registration fails
   */
  async register(email: string, password: string): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.session || !data.user) {
      throw new Error('No se pudo registrar el usuario');
    }

    const user: User = {
      id: data.user.id,
      email: data.user.email!,
      createdAt: data.user.created_at,
    };

    return {
      user,
      token: data.session.access_token,
    };
  },

  /**
   * Logout current user
   * Clears Supabase session
   */
  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
    }
  },

  /**
   * Validate stored token and get current session
   * @returns User data and token if valid, null otherwise
   */
  async validateToken(): Promise<AuthResponse | null> {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session || !session.user) {
      return null;
    }

    const user: User = {
      id: session.user.id,
      email: session.user.email!,
      createdAt: session.user.created_at,
    };

    return {
      user,
      token: session.access_token,
    };
  },
};
