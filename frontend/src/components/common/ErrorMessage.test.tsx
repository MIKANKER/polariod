import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorMessage from './ErrorMessage';

describe('ErrorMessage', () => {
  it('should render error message', () => {
    render(<ErrorMessage message="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should have alert role', () => {
    render(<ErrorMessage message="Error" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should have aria-live attribute', () => {
    render(<ErrorMessage message="Error" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
  });

  it('should display error icon', () => {
    const { container } = render(<ErrorMessage message="Error" />);
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should not show retry button when onRetry is not provided', () => {
    render(<ErrorMessage message="Error" />);
    expect(screen.queryByRole('button', { name: /reintentar/i })).not.toBeInTheDocument();
  });

  it('should show retry button when onRetry is provided', () => {
    render(<ErrorMessage message="Error" onRetry={vi.fn()} />);
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });

  it('should call onRetry when retry button is clicked', async () => {
    const handleRetry = vi.fn();
    const user = userEvent.setup();
    render(<ErrorMessage message="Error" onRetry={handleRetry} />);

    await user.click(screen.getByRole('button', { name: /reintentar/i }));
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('should style with error colors', () => {
    render(<ErrorMessage message="Error" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('bg-red-50', 'border-red-200');
  });

  it('should display long error messages', () => {
    const longMessage = 'This is a very long error message that should still be displayed correctly without breaking the layout or causing any issues with the component rendering.';
    render(<ErrorMessage message={longMessage} />);
    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });
});
