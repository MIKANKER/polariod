import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from './auth.service';
import { supabase } from './supabase';

// Mock Supabase
vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
    },
  },
}));

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
      };
      const mockSession = {
        access_token: 'token-123',
        user: mockUser,
      };

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { session: mockSession, user: mockUser },
        error: null,
      } as any);

      const result = await authService.login('test@example.com', 'password123');

      expect(result).toEqual({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          createdAt: '2024-01-01T00:00:00Z',
        },
        token: 'token-123',
      });
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should throw error with invalid credentials', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Invalid credentials' } as any,
      } as any);

      await expect(authService.login('test@example.com', 'wrong')).rejects.toThrow(
        'Invalid credentials'
      );
    });

    it('should throw error when no session returned', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { session: null, user: null },
        error: null,
      } as any);

      await expect(authService.login('test@example.com', 'password123')).rejects.toThrow(
        'No se pudo iniciar sesión'
      );
    });
  });

  describe('register', () => {
    it('should register successfully with valid data', async () => {
      const mockUser = {
        id: 'user-456',
        email: 'newuser@example.com',
        created_at: '2024-01-01T00:00:00Z',
      };
      const mockSession = {
        access_token: 'token-456',
        user: mockUser,
      };

      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { session: mockSession, user: mockUser },
        error: null,
      } as any);

      const result = await authService.register('newuser@example.com', 'Password123');

      expect(result).toEqual({
        user: {
          id: 'user-456',
          email: 'newuser@example.com',
          createdAt: '2024-01-01T00:00:00Z',
        },
        token: 'token-456',
      });
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'Password123',
      });
    });

    it('should throw error when registration fails', async () => {
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Email already exists' } as any,
      } as any);

      await expect(authService.register('existing@example.com', 'Password123')).rejects.toThrow(
        'Email already exists'
      );
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: null,
      } as any);

      await expect(authService.logout()).resolves.not.toThrow();
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('should handle logout errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: { message: 'Logout failed' } as any,
      } as any);

      await expect(authService.logout()).resolves.not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('validateToken', () => {
    it('should return user data for valid session', async () => {
      const mockUser = {
        id: 'user-789',
        email: 'valid@example.com',
        created_at: '2024-01-01T00:00:00Z',
      };
      const mockSession = {
        access_token: 'valid-token',
        user: mockUser,
      };

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      } as any);

      const result = await authService.validateToken();

      expect(result).toEqual({
        user: {
          id: 'user-789',
          email: 'valid@example.com',
          createdAt: '2024-01-01T00:00:00Z',
        },
        token: 'valid-token',
      });
    });

    it('should return null for invalid session', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      } as any);

      const result = await authService.validateToken();

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: { message: 'Session error' } as any,
      } as any);

      const result = await authService.validateToken();

      expect(result).toBeNull();
    });
  });
});
