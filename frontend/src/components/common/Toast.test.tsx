import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Toast from './Toast';

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const defaultProps = {
    id: 'toast-1',
    type: 'success' as const,
    message: 'Operation successful',
    onClose: vi.fn(),
  };

  it('should render toast message', () => {
    render(<Toast {...defaultProps} />);
    expect(screen.getByText('Operation successful')).toBeInTheDocument();
  });

  it('should have alert role', () => {
    render(<Toast {...defaultProps} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should have aria-live attribute', () => {
    render(<Toast {...defaultProps} />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'polite');
  });

  it('should render success type with correct styling', () => {
    render(<Toast {...defaultProps} type="success" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('bg-green-50', 'border-green-200', 'text-green-800');
  });

  it('should render error type with correct styling', () => {
    render(<Toast {...defaultProps} type="error" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('bg-red-50', 'border-red-200', 'text-red-800');
  });

  it('should render info type with correct styling', () => {
    render(<Toast {...defaultProps} type="info" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('bg-blue-50', 'border-blue-200', 'text-blue-800');
  });

  it('should render warning type with correct styling', () => {
    render(<Toast {...defaultProps} type="warning" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('bg-yellow-50', 'border-yellow-200', 'text-yellow-800');
  });

  it('should display icon for each type', () => {
    const { container } = render(<Toast {...defaultProps} />);
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should have close button', () => {
    render(<Toast {...defaultProps} />);
    expect(screen.getByLabelText(/cerrar notificación/i)).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup({ delay: null });
    render(<Toast {...defaultProps} onClose={handleClose} />);

    await user.click(screen.getByLabelText(/cerrar notificación/i));
    expect(handleClose).toHaveBeenCalledWith('toast-1');
  });

  it('should auto-dismiss after default duration', () => {
    const handleClose = vi.fn();
    render(<Toast {...defaultProps} onClose={handleClose} />);

    // Fast-forward time by default duration (5000ms)
    vi.advanceTimersByTime(5000);

    expect(handleClose).toHaveBeenCalledWith('toast-1');
  });

  it('should auto-dismiss after custom duration', () => {
    const handleClose = vi.fn();
    render(<Toast {...defaultProps} duration={3000} onClose={handleClose} />);

    // Fast-forward time by custom duration
    vi.advanceTimersByTime(3000);

    expect(handleClose).toHaveBeenCalledWith('toast-1');
  });

  it('should not auto-dismiss when duration is 0', () => {
    const handleClose = vi.fn();
    render(<Toast {...defaultProps} duration={0} onClose={handleClose} />);

    // Fast-forward time
    vi.advanceTimersByTime(10000);

    expect(handleClose).not.toHaveBeenCalled();
  });

  it('should cleanup timer on unmount', () => {
    const handleClose = vi.fn();
    const { unmount } = render(<Toast {...defaultProps} onClose={handleClose} />);

    unmount();

    // Fast-forward time after unmount
    vi.advanceTimersByTime(5000);

    expect(handleClose).not.toHaveBeenCalled();
  });
});
