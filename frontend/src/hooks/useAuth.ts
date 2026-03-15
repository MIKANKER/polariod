import { useAuthStore } from '../stores/authStore';
import { useCallback, useEffect, useState } from 'react';

/**
 * Custom hook that wraps authStore with React hook interface
 * Handles loading and error states, implements token persistence in localStorage
 */
export const useAuth = () => {
  const { user, token, isAuthenticated, login, register, logout, checkAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check authentication on mount
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        await checkAuth();
      } catch (err) {
        console.error('Auth check failed:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [checkAuth]);

  // Wrapped login with loading and error handling
  const handleLogin = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setError(null);
      try {
        await login(email, password);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al iniciar sesión';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [login]
  );

  // Wrapped register with loading and error handling
  const handleRegister = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setError(null);
      try {
        await register(email, password);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al registrar usuario';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [register]
  );

  // Wrapped logout
  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    clearError,
  };
};
