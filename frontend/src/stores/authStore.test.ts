import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from './authStore';

// Mock Supabase
vi.mock('../services/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
    },
  },
}));

describe('Auth Store', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Reset store state
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  });

  it('should initialize with unauthenticated state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('should clear all data on logout', () => {
    // Set up authenticated state
    localStorage.setItem('authToken', 'test-token');
    localStorage.setItem('user', JSON.stringify({ id: '1', email: 'test@example.com' }));
    localStorage.setItem('renderPreferences', JSON.stringify({ fit: 'cover' }));
    localStorage.setItem('lastSelectedTemplate', 'template-1');

    useAuthStore.setState({
      user: { id: '1', email: 'test@example.com', createdAt: '2024-01-01' },
      token: 'test-token',
      isAuthenticated: true,
    });

    // Logout
    useAuthStore.getState().logout();

    // Verify state is cleared
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);

    // Verify localStorage is cleared
    expect(localStorage.getItem('authToken')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(localStorage.getItem('renderPreferences')).toBeNull();
    expect(localStorage.getItem('lastSelectedTemplate')).toBeNull();
  });
});
