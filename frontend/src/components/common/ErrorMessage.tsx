import React from 'react';
import { AlertCircle } from 'lucide-react';
import Button from './Button';

export interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 p-6 bg-red-50 border border-red-200 rounded-lg"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-center gap-3 text-red-700">
        <AlertCircle className="w-6 h-6 flex-shrink-0" aria-hidden="true" />
        <p className="text-base font-medium">{message}</p>
      </div>
      {onRetry && (
        <Button variant="danger" size="sm" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  );
};

export default ErrorMessage;
