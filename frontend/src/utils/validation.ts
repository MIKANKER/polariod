/**
 * Validation utility functions for form inputs and file uploads
 * Provides reusable validation logic for email, password, file type, and file size
 */

/**
 * Validates email format
 * @param email - Email string to validate
 * @returns true if valid, false otherwise
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  return emailRegex.test(email);
};

/**
 * Validates password strength
 * Password must be at least 8 characters and contain uppercase, lowercase, and numbers
 * @param password - Password string to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export const validatePasswordStrength = (
  password: string
): { isValid: boolean; error?: string } => {
  if (password.length < 8) {
    return {
      isValid: false,
      error: 'La contraseña debe tener al menos 8 caracteres',
    };
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumber) {
    return {
      isValid: false,
      error: 'La contraseña debe contener mayúsculas, minúsculas y números',
    };
  }

  return { isValid: true };
};

/**
 * Validates file type for template uploads (PNG only)
 * @param file - File to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export const validateTemplateFileType = (
  file: File
): { isValid: boolean; error?: string } => {
  if (file.type !== 'image/png') {
    return {
      isValid: false,
      error: 'Solo se permiten archivos PNG',
    };
  }
  return { isValid: true };
};

/**
 * Validates file type for photo uploads (JPEG, PNG, WebP)
 * @param file - File to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export const validatePhotoFileType = (
  file: File
): { isValid: boolean; error?: string } => {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Solo se permiten archivos JPEG, PNG o WebP',
    };
  }
  return { isValid: true };
};

/**
 * Validates file size (max 10MB)
 * @param file - File to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export const validateFileSize = (
  file: File
): { isValid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'El archivo es demasiado grande (máximo 10MB)',
    };
  }
  return { isValid: true };
};

/**
 * Validates a file for template upload (PNG format, max 10MB)
 * @param file - File to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export const validateTemplateFile = (
  file: File
): { isValid: boolean; error?: string } => {
  const typeValidation = validateTemplateFileType(file);
  if (!typeValidation.isValid) {
    return typeValidation;
  }

  const sizeValidation = validateFileSize(file);
  if (!sizeValidation.isValid) {
    return sizeValidation;
  }

  return { isValid: true };
};

/**
 * Validates a file for photo upload (JPEG/PNG/WebP format, max 10MB)
 * @param file - File to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export const validatePhotoFile = (
  file: File
): { isValid: boolean; error?: string } => {
  const typeValidation = validatePhotoFileType(file);
  if (!typeValidation.isValid) {
    return typeValidation;
  }

  const sizeValidation = validateFileSize(file);
  if (!sizeValidation.isValid) {
    return sizeValidation;
  }

  return { isValid: true };
};
