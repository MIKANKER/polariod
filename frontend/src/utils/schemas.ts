/**
 * Zod validation schemas for form validation
 * Used with React Hook Form for type-safe form validation
 */

import { z } from 'zod';

/**
 * Login form validation schema
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Email inválido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Registration form validation schema
 */
export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, 'El email es requerido')
      .email('Email inválido'),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'La contraseña debe contener mayúsculas, minúsculas y números'
      ),
    confirmPassword: z
      .string()
      .min(1, 'Debes confirmar la contraseña'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Template upload form validation schema
 */
export const templateUploadSchema = z.object({
  filename: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre es demasiado largo'),
});

export type TemplateUploadFormData = z.infer<typeof templateUploadSchema>;

/**
 * Render options validation schema
 */
export const renderOptionsSchema = z.object({
  fit: z.enum(['cover', 'contain'], {
    errorMap: () => ({ message: 'Selecciona un modo de ajuste válido' }),
  }),
  offsetX: z
    .number()
    .min(-1, 'El offset X debe estar entre -1 y 1')
    .max(1, 'El offset X debe estar entre -1 y 1'),
  offsetY: z
    .number()
    .min(-1, 'El offset Y debe estar entre -1 y 1')
    .max(1, 'El offset Y debe estar entre -1 y 1'),
  outputFormat: z.enum(['png', 'jpeg']).optional(),
  quality: z
    .number()
    .min(1, 'La calidad debe estar entre 1 y 100')
    .max(100, 'La calidad debe estar entre 1 y 100')
    .optional(),
});

export type RenderOptionsFormData = z.infer<typeof renderOptionsSchema>;
