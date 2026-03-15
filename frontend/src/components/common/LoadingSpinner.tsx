import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', message }) => {
  const sizeStyles = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const textSizeStyles = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3" role="status" aria-live="polite">
      <Loader2 className={`${sizeStyles[size]} text-blue-600 animate-spin`} aria-hidden="true" />
      {message && (
        <p className={`${textSizeStyles[size]} text-gray-600`}>
          {message}
        </p>
      )}
      <span className="sr-only">Cargando...</span>
    </div>
  );
};

export default LoadingSpinner;
