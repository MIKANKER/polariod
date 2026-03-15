/**
 * LocalStorage utility functions for persistent data storage
 * 
 * Provides type-safe localStorage operations with error handling
 * for auth tokens, render preferences, and template selection.
 */

import { RenderOptions } from '../types/render.types';
import { User } from '../types/auth.types';

// Storage keys
const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER: 'user',
  RENDER_PREFERENCES: 'renderPreferences',
  LAST_SELECTED_TEMPLATE: 'lastSelectedTemplate',
} as const;

/**
 * Save authentication token to localStorage
 */
export const saveAuthToken = (token: string): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  } catch (error) {
    console.error('Failed to save auth token:', error);
  }
};

/**
 * Load authentication token from localStorage
 */
export const loadAuthToken = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch (error) {
    console.error('Failed to load auth token:', error);
    return null;
  }
};

/**
 * Save user data to localStorage
 */
export const saveUser = (user: User): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch (error) {
    console.error('Failed to save user data:', error);
  }
};

/**
 * Load user data from localStorage
 */
export const loadUser = (): User | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER);
    if (stored) {
      return JSON.parse(stored) as User;
    }
    return null;
  } catch (error) {
    console.error('Failed to load user data:', error);
    return null;
  }
};

/**
 * Save render preferences to localStorage
 */
export const saveRenderPreferences = (preferences: RenderOptions): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.RENDER_PREFERENCES, JSON.stringify(preferences));
  } catch (error) {
    console.error('Failed to save render preferences:', error);
  }
};

/**
 * Load render preferences from localStorage
 */
export const loadRenderPreferences = (): RenderOptions | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.RENDER_PREFERENCES);
    if (stored) {
      return JSON.parse(stored) as RenderOptions;
    }
    return null;
  } catch (error) {
    console.error('Failed to load render preferences:', error);
    return null;
  }
};

/**
 * Save last selected template ID to localStorage
 */
export const saveLastSelectedTemplate = (templateId: string): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_SELECTED_TEMPLATE, templateId);
  } catch (error) {
    console.error('Failed to save last selected template:', error);
  }
};

/**
 * Load last selected template ID from localStorage
 */
export const loadLastSelectedTemplate = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEYS.LAST_SELECTED_TEMPLATE);
  } catch (error) {
    console.error('Failed to load last selected template:', error);
    return null;
  }
};

/**
 * Clear all data from localStorage (used on logout)
 */
export const clearAllData = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.RENDER_PREFERENCES);
    localStorage.removeItem(STORAGE_KEYS.LAST_SELECTED_TEMPLATE);
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }
};
