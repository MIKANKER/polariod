import { describe, it, expect, beforeEach } from 'vitest';
import { api } from './api';

describe('API Client', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should create axios instance with correct base URL', () => {
    expect(api.defaults.baseURL).toBeDefined();
    expect(api.defaults.timeout).toBe(30000);
  });

  it('should have request and response interceptors configured', () => {
    expect(api.interceptors.request.handlers).toBeDefined();
    expect(api.interceptors.response.handlers).toBeDefined();
  });
});
