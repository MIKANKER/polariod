import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registerSchema,
  templateUploadSchema,
  renderOptionsSchema,
} from './schemas';

describe('Zod validation schemas', () => {
  describe('loginSchema', () => {
    it('should accept valid login data', () => {
      const validData = {
        email: 'user@example.com',
        password: 'password123',
      };
      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty email', () => {
      const invalidData = {
        email: '',
        password: 'password123',
      };
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('El email es requerido');
      }
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'password123',
      };
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Email inválido');
      }
    });

    it('should reject empty password', () => {
      const invalidData = {
        email: 'user@example.com',
        password: '',
      };
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('La contraseña es requerida');
      }
    });
  });

  describe('registerSchema', () => {
    it('should accept valid registration data', () => {
      const validData = {
        email: 'user@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      };
      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject password shorter than 8 characters', () => {
      const invalidData = {
        email: 'user@example.com',
        password: 'Pass1',
        confirmPassword: 'Pass1',
      };
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'La contraseña debe tener al menos 8 caracteres'
        );
      }
    });

    it('should reject password without uppercase', () => {
      const invalidData = {
        email: 'user@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'La contraseña debe contener mayúsculas, minúsculas y números'
        );
      }
    });

    it('should reject password without lowercase', () => {
      const invalidData = {
        email: 'user@example.com',
        password: 'PASSWORD123',
        confirmPassword: 'PASSWORD123',
      };
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'La contraseña debe contener mayúsculas, minúsculas y números'
        );
      }
    });

    it('should reject password without numbers', () => {
      const invalidData = {
        email: 'user@example.com',
        password: 'PasswordOnly',
        confirmPassword: 'PasswordOnly',
      };
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'La contraseña debe contener mayúsculas, minúsculas y números'
        );
      }
    });

    it('should reject mismatched passwords', () => {
      const invalidData = {
        email: 'user@example.com',
        password: 'Password123',
        confirmPassword: 'DifferentPassword123',
      };
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Las contraseñas no coinciden');
      }
    });
  });

  describe('templateUploadSchema', () => {
    it('should accept valid filename', () => {
      const validData = {
        filename: 'My Template',
      };
      const result = templateUploadSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty filename', () => {
      const invalidData = {
        filename: '',
      };
      const result = templateUploadSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('El nombre es requerido');
      }
    });

    it('should reject filename longer than 100 characters', () => {
      const invalidData = {
        filename: 'a'.repeat(101),
      };
      const result = templateUploadSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('El nombre es demasiado largo');
      }
    });
  });

  describe('renderOptionsSchema', () => {
    it('should accept valid render options', () => {
      const validData = {
        fit: 'cover' as const,
        offsetX: 0.5,
        offsetY: -0.3,
        outputFormat: 'png' as const,
      };
      const result = renderOptionsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept contain fit mode', () => {
      const validData = {
        fit: 'contain' as const,
        offsetX: 0,
        offsetY: 0,
      };
      const result = renderOptionsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid fit mode', () => {
      const invalidData = {
        fit: 'invalid',
        offsetX: 0,
        offsetY: 0,
      };
      const result = renderOptionsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject offsetX below -1', () => {
      const invalidData = {
        fit: 'cover' as const,
        offsetX: -1.5,
        offsetY: 0,
      };
      const result = renderOptionsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('El offset X debe estar entre -1 y 1');
      }
    });

    it('should reject offsetX above 1', () => {
      const invalidData = {
        fit: 'cover' as const,
        offsetX: 1.5,
        offsetY: 0,
      };
      const result = renderOptionsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('El offset X debe estar entre -1 y 1');
      }
    });

    it('should reject offsetY below -1', () => {
      const invalidData = {
        fit: 'cover' as const,
        offsetX: 0,
        offsetY: -1.5,
      };
      const result = renderOptionsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('El offset Y debe estar entre -1 y 1');
      }
    });

    it('should reject offsetY above 1', () => {
      const invalidData = {
        fit: 'cover' as const,
        offsetX: 0,
        offsetY: 1.5,
      };
      const result = renderOptionsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('El offset Y debe estar entre -1 y 1');
      }
    });

    it('should accept optional quality parameter', () => {
      const validData = {
        fit: 'cover' as const,
        offsetX: 0,
        offsetY: 0,
        outputFormat: 'jpeg' as const,
        quality: 85,
      };
      const result = renderOptionsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject quality below 1', () => {
      const invalidData = {
        fit: 'cover' as const,
        offsetX: 0,
        offsetY: 0,
        quality: 0,
      };
      const result = renderOptionsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('La calidad debe estar entre 1 y 100');
      }
    });

    it('should reject quality above 100', () => {
      const invalidData = {
        fit: 'cover' as const,
        offsetX: 0,
        offsetY: 0,
        quality: 101,
      };
      const result = renderOptionsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('La calidad debe estar entre 1 y 100');
      }
    });
  });
});
