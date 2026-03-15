import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from './useAuth';
import { useAuthStore } from '../stores/authStore';

// Mock the auth store
vi.mock('../stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

describe('useAuth', () => {
  const mockLogin = vi.fn();
  const mockRegister = vi.fn();
  const mockLogout = vi.fn();
  const mockCheckAuth = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthStore).mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      login: mockLogin,
      register: mockRegister,
      logout: mockLogout,
      checkAuth: mockCheckAuth,
    });
  });

  it('should initialize with loading state and check auth', async () => {
    mockCheckAuth.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth());

    // Initially loading
    expect(result.current.loading).toBe(true);

    // Wait for auth check to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockCheckAuth).toHaveBeenCalled();
  });

  it('should handle login successfully', async () => {
    mockCheckAuth.mockResolvedValue(undefined);
    mockLogin.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(result.current.error).toBeNull();
  });

  it('should handle login error', async () => {
    mockCheckAuth.mockResolvedValue(undefined);
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      try {
        await result.current.login('test@example.com', 'wrong');
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.error).toBe('Invalid credentials');
  });

  it('should set loading state during login', async () => {
    mockCheckAuth.mockResolvedValue(undefined);
    mockLogin.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.login('test@example.com', 'password123');
    });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should handle register successfully', async () => {
    mockCheckAuth.mockResolvedValue(undefined);
    mockRegister.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.register('newuser@example.com', 'Password123');
    });

    expect(mockRegister).toHaveBeenCalledWith('newuser@example.com', 'Password123');
    expect(result.current.error).toBeNull();
  });

  it('should handle register error', async () => {
    mockCheckAuth.mockResolvedValue(undefined);
    mockRegister.mockRejectedValue(new Error('Email already exists'));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      try {
        await result.current.register('existing@example.com', 'Password123');
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.error).toBe('Email already exists');
  });

  it('should handle logout', async () => {
    mockCheckAuth.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.logout();
    });

    expect(mockLogout).toHaveBeenCalled();
  });

  it('should clear error', async () => {
    mockCheckAuth.mockResolvedValue(undefined);
    mockLogin.mockRejectedValue(new Error('Test error'));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Trigger an error
    await act(async () => {
      try {
        await result.current.login('test@example.com', 'wrong');
      } catch (error) {
        // Expected
      }
    });

    expect(result.current.error).toBe('Test error');

    // Clear the error
    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should return auth state from store', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      createdAt: '2024-01-01T00:00:00Z',
    };

    mockCheckAuth.mockResolvedValue(undefined);
    vi.mocked(useAuthStore).mockReturnValue({
      user: mockUser,
      token: 'token-123',
      isAuthenticated: true,
      login: mockLogin,
      register: mockRegister,
      logout: mockLogout,
      checkAuth: mockCheckAuth,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.token).toBe('token-123');
    expect(result.current.isAuthenticated).toBe(true);
  });
});
