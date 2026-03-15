import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from './LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should render spinner', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should have screen reader text', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('should render with small size', () => {
    const { container } = render(<LoadingSpinner size="sm" />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toHaveClass('w-4', 'h-4');
  });

  it('should render with medium size by default', () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toHaveClass('w-8', 'h-8');
  });

  it('should render with large size', () => {
    const { container } = render(<LoadingSpinner size="lg" />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toHaveClass('w-12', 'h-12');
  });

  it('should not display message when not provided', () => {
    render(<LoadingSpinner />);
    const status = screen.getByRole('status');
    // Only screen reader text should be present
    expect(status.textContent).toBe('Cargando...');
  });

  it('should display message when provided', () => {
    render(<LoadingSpinner message="Subiendo archivo..." />);
    expect(screen.getByText('Subiendo archivo...')).toBeInTheDocument();
  });

  it('should have aria-live attribute for accessibility', () => {
    render(<LoadingSpinner />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  it('should apply correct text size for small spinner with message', () => {
    render(<LoadingSpinner size="sm" message="Loading" />);
    const message = screen.getByText('Loading');
    expect(message).toHaveClass('text-sm');
  });

  it('should apply correct text size for medium spinner with message', () => {
    render(<LoadingSpinner size="md" message="Loading" />);
    const message = screen.getByText('Loading');
    expect(message).toHaveClass('text-base');
  });

  it('should apply correct text size for large spinner with message', () => {
    render(<LoadingSpinner size="lg" message="Loading" />);
    const message = screen.getByText('Loading');
    expect(message).toHaveClass('text-lg');
  });
});
