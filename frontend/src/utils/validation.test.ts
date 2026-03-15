import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  validatePasswordStrength,
  validateTemplateFileType,
  validatePhotoFileType,
  validateFileSize,
  validateTemplateFile,
  validatePhotoFile,
} from './validation';

describe('validation utilities', () => {
  describe('isValidEmail', () => {
    it('should return true for valid email addresses', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.user@domain.co.uk')).toBe(true);
      expect(isValidEmail('name+tag@company.org')).toBe(true);
    });

    it('should return false for invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('missing@domain')).toBe(false);
      expect(isValidEmail('@nodomain.com')).toBe(false);
      expect(isValidEmail('no-at-sign.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should accept strong passwords', () => {
      const result = validatePasswordStrength('Password123');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject passwords shorter than 8 characters', () => {
      const result = validatePasswordStrength('Pass1');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('La contraseña debe tener al menos 8 caracteres');
    });

    it('should reject passwords without uppercase letters', () => {
      const result = validatePasswordStrength('password123');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('La contraseña debe contener mayúsculas, minúsculas y números');
    });

    it('should reject passwords without lowercase letters', () => {
      const result = validatePasswordStrength('PASSWORD123');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('La contraseña debe contener mayúsculas, minúsculas y números');
    });

    it('should reject passwords without numbers', () => {
      const result = validatePasswordStrength('PasswordOnly');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('La contraseña debe contener mayúsculas, minúsculas y números');
    });
  });

  describe('validateTemplateFileType', () => {
    it('should accept PNG files', () => {
      const file = new File(['content'], 'template.png', { type: 'image/png' });
      const result = validateTemplateFileType(file);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject non-PNG files', () => {
      const jpegFile = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
      const result = validateTemplateFileType(jpegFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Solo se permiten archivos PNG');
    });
  });

  describe('validatePhotoFileType', () => {
    it('should accept JPEG files', () => {
      const file = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
      const result = validatePhotoFileType(file);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept PNG files', () => {
      const file = new File(['content'], 'photo.png', { type: 'image/png' });
      const result = validatePhotoFileType(file);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept WebP files', () => {
      const file = new File(['content'], 'photo.webp', { type: 'image/webp' });
      const result = validatePhotoFileType(file);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject unsupported file types', () => {
      const gifFile = new File(['content'], 'animation.gif', { type: 'image/gif' });
      const result = validatePhotoFileType(gifFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Solo se permiten archivos JPEG, PNG o WebP');
    });
  });

  describe('validateFileSize', () => {
    it('should accept files under 10MB', () => {
      const smallFile = new File([new ArrayBuffer(5 * 1024 * 1024)], 'small.png');
      const result = validateFileSize(smallFile);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept files exactly 10MB', () => {
      const exactFile = new File([new ArrayBuffer(10 * 1024 * 1024)], 'exact.png');
      const result = validateFileSize(exactFile);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject files over 10MB', () => {
      const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'large.png');
      const result = validateFileSize(largeFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('El archivo es demasiado grande (máximo 10MB)');
    });
  });

  describe('validateTemplateFile', () => {
    it('should accept valid PNG files under 10MB', () => {
      const file = new File([new ArrayBuffer(5 * 1024 * 1024)], 'template.png', {
        type: 'image/png',
      });
      const result = validateTemplateFile(file);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject non-PNG files', () => {
      const file = new File([new ArrayBuffer(5 * 1024 * 1024)], 'photo.jpg', {
        type: 'image/jpeg',
      });
      const result = validateTemplateFile(file);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Solo se permiten archivos PNG');
    });

    it('should reject PNG files over 10MB', () => {
      const file = new File([new ArrayBuffer(11 * 1024 * 1024)], 'large.png', {
        type: 'image/png',
      });
      const result = validateTemplateFile(file);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('El archivo es demasiado grande (máximo 10MB)');
    });
  });

  describe('validatePhotoFile', () => {
    it('should accept valid JPEG files under 10MB', () => {
      const file = new File([new ArrayBuffer(5 * 1024 * 1024)], 'photo.jpg', {
        type: 'image/jpeg',
      });
      const result = validatePhotoFile(file);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid PNG files under 10MB', () => {
      const file = new File([new ArrayBuffer(5 * 1024 * 1024)], 'photo.png', {
        type: 'image/png',
      });
      const result = validatePhotoFile(file);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid WebP files under 10MB', () => {
      const file = new File([new ArrayBuffer(5 * 1024 * 1024)], 'photo.webp', {
        type: 'image/webp',
      });
      const result = validatePhotoFile(file);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject unsupported file types', () => {
      const file = new File([new ArrayBuffer(5 * 1024 * 1024)], 'animation.gif', {
        type: 'image/gif',
      });
      const result = validatePhotoFile(file);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Solo se permiten archivos JPEG, PNG o WebP');
    });

    it('should reject files over 10MB', () => {
      const file = new File([new ArrayBuffer(11 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      });
      const result = validatePhotoFile(file);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('El archivo es demasiado grande (máximo 10MB)');
    });
  });
});
