import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { loginSchema, type LoginFormData } from '../../utils/schemas';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface LoginFormProps {
  onSuccess?: () => void;
}

/**
 * Login form component with email and password fields
 * Implements client-side validation using Zod schema and handles form submission with loading state
 */
export const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, touchedFields },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      await login(data.email, data.password);
      onSuccess?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al iniciar sesión';
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <div className="relative">
          <input
            id="email"
            type="email"
            {...register('email')}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.email
                ? 'border-red-500'
                : touchedFields.email && !errors.email
                ? 'border-green-500'
                : 'border-gray-300'
            }`}
            placeholder="tu@email.com"
            disabled={isSubmitting}
            aria-invalid={errors.email ? 'true' : 'false'}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {touchedFields.email && !errors.email && (
            <CheckCircle className="absolute right-3 top-2.5 w-5 h-5 text-green-500" aria-hidden="true" />
          )}
        </div>
        {errors.email && (
          <p id="email-error" className="mt-1 text-sm text-red-600 flex items-center" role="alert">
            <AlertCircle className="w-4 h-4 mr-1" aria-hidden="true" />
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Contraseña
        </label>
        <div className="relative">
          <input
            id="password"
            type="password"
            {...register('password')}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.password
                ? 'border-red-500'
                : touchedFields.password && !errors.password
                ? 'border-green-500'
                : 'border-gray-300'
            }`}
            placeholder="••••••••"
            disabled={isSubmitting}
            aria-invalid={errors.password ? 'true' : 'false'}
            aria-describedby={errors.password ? 'password-error' : undefined}
          />
          {touchedFields.password && !errors.password && (
            <CheckCircle className="absolute right-3 top-2.5 w-5 h-5 text-green-500" aria-hidden="true" />
          )}
        </div>
        {errors.password && (
          <p id="password-error" className="mt-1 text-sm text-red-600 flex items-center" role="alert">
            <AlertCircle className="w-4 h-4 mr-1" aria-hidden="true" />
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Server Error Message */}
      {serverError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md" role="alert">
          <p className="text-sm text-red-800 flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" aria-hidden="true" />
            {serverError}
          </p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!isValid || isSubmitting}
        className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
          !isValid || isSubmitting
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Iniciando sesión...
          </span>
        ) : (
          'Iniciar Sesión'
        )}
      </button>
    </form>
  );
};
