import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../config/constants';

// Create Axios instance with base configuration
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second base delay

// Helper to determine if error is retryable
const isRetryableError = (error: AxiosError): boolean => {
  // Retry on network errors
  if (!error.response) {
    return true;
  }
  
  // Retry on 5xx server errors
  const status = error.response.status;
  if (status >= 500 && status < 600) {
    return true;
  }
  
  // Retry on 408 Request Timeout and 429 Too Many Requests (with backoff)
  if (status === 408 || status === 429) {
    return true;
  }
  
  return false;
};

// Exponential backoff delay
const getRetryDelay = (retryCount: number): number => {
  return Math.min(RETRY_DELAY * Math.pow(2, retryCount), 30000);
};

// Request interceptor: Add auth token and retry logic
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage
    const token = localStorage.getItem('authToken');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Initialize retry count if not present
    if (!config.headers['x-retry-count']) {
      config.headers['x-retry-count'] = '0';
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle common errors and retry logic
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & { headers: { 'x-retry-count': string } };
    const status = error.response?.status;
    const message = (error.response?.data as { detail?: string })?.detail || error.message;
    
    // Check if we should retry
    if (config && isRetryableError(error)) {
      const retryCount = parseInt(config.headers['x-retry-count'] || '0');
      
      if (retryCount < MAX_RETRIES) {
        // Increment retry count
        config.headers['x-retry-count'] = (retryCount + 1).toString();
        
        // Wait before retrying with exponential backoff
        await new Promise(resolve => setTimeout(resolve, getRetryDelay(retryCount)));
        
        // Retry the request
        return api(config);
      }
    }
    
    // Handle 401 Unauthorized - Session expired
    if (status === 401) {
      // Clear auth state
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      // Redirect to login
      window.location.href = '/login';
      
      return Promise.reject(new Error('Sesión expirada'));
    }
    
    // Handle 429 Too Many Requests - Template limit reached
    if (status === 429) {
      return Promise.reject(new Error('Límite de 20 plantillas alcanzado'));
    }
    
    // Handle 413 Payload Too Large - File too large
    if (status === 413) {
      return Promise.reject(new Error('El archivo es demasiado grande (máximo 10MB)'));
    }
    
    // Handle network errors (no response from server)
    if (!error.response) {
      return Promise.reject(new Error('Error de red: no se pudo conectar al servidor'));
    }
    
    // Generic server error with message from backend
    return Promise.reject(new Error(message));
  }
);
