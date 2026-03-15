import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveAuthToken,
  loadAuthToken,
  saveUser,
  loadUser,
  saveRenderPreferences,
  loadRenderPreferences,
  saveLastSelectedTemplate,
  loadLastSelectedTemplate,
  clearAllData,
} from './localStorage';
import { User } from '../types/auth.types';
import { RenderOptions } from '../types/render.types';

describe('localStorage utilities', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Restore all mocks
    vi.restoreAllMocks();
  });

  describe('Auth Token', () => {
    it('should save and load auth token', () => {
      const token = 'test-token-123';
      saveAuthToken(token);
      expect(loadAuthToken()).toBe(token);
    });

    it('should return null when no token is stored', () => {
      expect(loadAuthToken()).toBeNull();
    });

    it('should handle localStorage errors gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock localStorage.setItem to throw an error
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      saveAuthToken('test-token');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save auth token:', expect.any(Error));
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('User Data', () => {
    it('should save and load user data', () => {
      const user: User = {
        id: 'user-123',
        email: 'test@example.com',
        createdAt: '2024-01-01T00:00:00Z',
      };

      saveUser(user);
      const loaded = loadUser();
      expect(loaded).toEqual(user);
    });

    it('should return null when no user is stored', () => {
      expect(loadUser()).toBeNull();
    });

    it('should handle invalid JSON gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Store invalid JSON
      localStorage.setItem('user', 'invalid-json');
      
      expect(loadUser()).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load user data:', expect.any(Error));
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Render Preferences', () => {
    it('should save and load render preferences', () => {
      const preferences: RenderOptions = {
        fit: 'cover',
        offsetX: 0.5,
        offsetY: -0.3,
      };

      saveRenderPreferences(preferences);
      const loaded = loadRenderPreferences();
      expect(loaded).toEqual(preferences);
    });

    it('should return null when no preferences are stored', () => {
      expect(loadRenderPreferences()).toBeNull();
    });

    it('should handle invalid JSON gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Store invalid JSON
      localStorage.setItem('renderPreferences', 'invalid-json');
      
      expect(loadRenderPreferences()).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load render preferences:', expect.any(Error));
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Last Selected Template', () => {
    it('should save and load last selected template', () => {
      const templateId = 'template-456';
      saveLastSelectedTemplate(templateId);
      expect(loadLastSelectedTemplate()).toBe(templateId);
    });

    it('should return null when no template is stored', () => {
      expect(loadLastSelectedTemplate()).toBeNull();
    });
  });

  describe('Clear All Data', () => {
    it('should clear all stored data', () => {
      // Store some data
      saveAuthToken('test-token');
      saveUser({
        id: 'user-123',
        email: 'test@example.com',
        createdAt: '2024-01-01T00:00:00Z',
      });
      saveRenderPreferences({
        fit: 'cover',
        offsetX: 0,
        offsetY: 0,
      });
      saveLastSelectedTemplate('template-123');

      // Verify data is stored
      expect(loadAuthToken()).toBeTruthy();
      expect(loadUser()).toBeTruthy();
      expect(loadRenderPreferences()).toBeTruthy();
      expect(loadLastSelectedTemplate()).toBeTruthy();

      // Clear all data
      clearAllData();

      // Verify all data is cleared
      expect(loadAuthToken()).toBeNull();
      expect(loadUser()).toBeNull();
      expect(loadRenderPreferences()).toBeNull();
      expect(loadLastSelectedTemplate()).toBeNull();
    });

    it('should handle localStorage errors gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock localStorage.removeItem to throw an error
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      clearAllData();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to clear localStorage:', expect.any(Error));
      
      consoleErrorSpy.mockRestore();
    });
  });
});
