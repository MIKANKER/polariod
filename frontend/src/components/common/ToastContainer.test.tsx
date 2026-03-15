import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ToastContainer from './ToastContainer';

describe('ToastContainer', () => {
  it('should render empty container when no toasts', () => {
    const { container } = render(<ToastContainer toasts={[]} onClose={vi.fn()} />);
    expect(container.firstChild).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should render single toast', () => {
    const toasts = [
      { id: '1', type: 'success' as const, message: 'Success message' },
    ];
    render(<ToastContainer toasts={toasts} onClose={vi.fn()} />);
    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  it('should render multiple toasts', () => {
    const toasts = [
      { id: '1', type: 'success' as const, message: 'Success message' },
      { id: '2', type: 'error' as const, message: 'Error message' },
      { id: '3', type: 'info' as const, message: 'Info message' },
    ];
    render(<ToastContainer toasts={toasts} onClose={vi.fn()} />);

    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.getByText('Info message')).toBeInTheDocument();
  });

  it('should stack toasts vertically', () => {
    const toasts = [
      { id: '1', type: 'success' as const, message: 'First' },
      { id: '2', type: 'error' as const, message: 'Second' },
    ];
    const { container } = render(<ToastContainer toasts={toasts} onClose={vi.fn()} />);
    const toastContainer = container.firstChild as HTMLElement;
    expect(toastContainer).toHaveClass('flex-col', 'gap-3');
  });

  it('should position container at top-right', () => {
    const { container } = render(<ToastContainer toasts={[]} onClose={vi.fn()} />);
    const toastContainer = container.firstChild as HTMLElement;
    expect(toastContainer).toHaveClass('fixed', 'top-4', 'right-4');
  });

  it('should have high z-index', () => {
    const { container } = render(<ToastContainer toasts={[]} onClose={vi.fn()} />);
    const toastContainer = container.firstChild as HTMLElement;
    expect(toastContainer).toHaveClass('z-50');
  });

  it('should call onClose with correct id when toast is closed', async () => {
    const handleClose = vi.fn();
    const toasts = [
      { id: 'toast-1', type: 'success' as const, message: 'Message' },
    ];
    const user = userEvent.setup();
    render(<ToastContainer toasts={toasts} onClose={handleClose} />);

    await user.click(screen.getByLabelText(/cerrar notificación/i));
    expect(handleClose).toHaveBeenCalledWith('toast-1');
  });

  it('should handle closing individual toasts in stack', async () => {
    const handleClose = vi.fn();
    const toasts = [
      { id: '1', type: 'success' as const, message: 'First' },
      { id: '2', type: 'error' as const, message: 'Second' },
      { id: '3', type: 'info' as const, message: 'Third' },
    ];
    const user = userEvent.setup();
    render(<ToastContainer toasts={toasts} onClose={handleClose} />);

    const closeButtons = screen.getAllByLabelText(/cerrar notificación/i);
    await user.click(closeButtons[1]); // Close second toast

    expect(handleClose).toHaveBeenCalledWith('2');
  });

  it('should have aria-live attribute', () => {
    const { container } = render(<ToastContainer toasts={[]} onClose={vi.fn()} />);
    const toastContainer = container.firstChild as HTMLElement;
    expect(toastContainer).toHaveAttribute('aria-live', 'polite');
  });

  it('should have aria-atomic attribute', () => {
    const { container } = render(<ToastContainer toasts={[]} onClose={vi.fn()} />);
    const toastContainer = container.firstChild as HTMLElement;
    expect(toastContainer).toHaveAttribute('aria-atomic', 'false');
  });

  it('should render toasts with custom duration', () => {
    const toasts = [
      { id: '1', type: 'success' as const, message: 'Message', duration: 3000 },
    ];
    render(<ToastContainer toasts={toasts} onClose={vi.fn()} />);
    expect(screen.getByText('Message')).toBeInTheDocument();
  });
});
