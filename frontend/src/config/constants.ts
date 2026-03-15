// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Supabase Configuration
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// File Upload Limits
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ACCEPTED_TEMPLATE_FORMATS = ['image/png'];
export const ACCEPTED_PHOTO_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];

// Template Limits
export const MAX_TEMPLATES = 20;

// Render Options Defaults
export const DEFAULT_RENDER_OPTIONS = {
  fit: 'cover' as const,
  offsetX: 0,
  offsetY: 0,
  outputFormat: 'png' as const,
  quality: 90,
};

// UI Configuration
export const TOAST_DURATION = 3000;
export const LONG_OPERATION_THRESHOLD = 10000; // 10 seconds

// Responsive Breakpoints (matching Tailwind)
export const BREAKPOINTS = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

// Touch Target Minimum Size
export const MIN_TOUCH_TARGET = 44; // pixels
