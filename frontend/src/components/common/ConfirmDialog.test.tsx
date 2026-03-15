import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmDialog from './ConfirmDialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    isOpen: true,
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  it('should not render when isOpen is false', () => {
    render(<ConfirmDialog {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should display title', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
  });

  it('should display message', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
  });

  it('should display default confirm button text', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByRole('button', { name: /confirmar/i })).toBeInTheDocument();
  });

  it('should display default cancel button text', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
  });

  it('should display custom confirm button text', () => {
    render(<ConfirmDialog {...defaultProps} confirmText="Delete" />);
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('should display custom cancel button text', () => {
    render(<ConfirmDialog {...defaultProps} cancelText="Go Back" />);
    expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
  });

  it('should call onConfirm when confirm button is clicked', async () => {
    const handleConfirm = vi.fn();
    const user = userEvent.setup();
    render(<ConfirmDialog {...defaultProps} onConfirm={handleConfirm} />);

    await user.click(screen.getByRole('button', { name: /confirmar/i }));
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when cancel button is clicked', async () => {
    const handleCancel = vi.fn();
    const user = userEvent.setup();
    render(<ConfirmDialog {...defaultProps} onCancel={handleCancel} />);

    await user.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when close button is clicked', async () => {
    const handleCancel = vi.fn();
    const user = userEvent.setup();
    render(<ConfirmDialog {...defaultProps} onCancel={handleCancel} />);

    await user.click(screen.getByLabelText(/cerrar modal/i));
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when ESC key is pressed', async () => {
    const handleCancel = vi.fn();
    const user = userEvent.setup();
    render(<ConfirmDialog {...defaultProps} onCancel={handleCancel} />);

    await user.keyboard('{Escape}');
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });

  it('should use primary variant by default', () => {
    render(<ConfirmDialog {...defaultProps} />);
    const confirmButton = screen.getByRole('button', { name: /confirmar/i });
    expect(confirmButton).toHaveClass('bg-blue-600');
  });

  it('should use danger variant when specified', () => {
    render(<ConfirmDialog {...defaultProps} variant="danger" />);
    const confirmButton = screen.getByRole('button', { name: /confirmar/i });
    expect(confirmButton).toHaveClass('bg-red-600');
  });

  it('should be keyboard accessible', async () => {
    const handleConfirm = vi.fn();
    const handleCancel = vi.fn();
    const user = userEvent.setup();
    render(<ConfirmDialog {...defaultProps} onConfirm={handleConfirm} onCancel={handleCancel} />);

    // Close button should be focused initially (from Modal focus trap)
    const closeButton = screen.getByLabelText(/cerrar modal/i);
    expect(closeButton).toHaveFocus();

    // Tab to cancel button
    await user.tab();
    expect(screen.getByRole('button', { name: /cancelar/i })).toHaveFocus();

    // Tab to confirm button
    await user.tab();
    expect(screen.getByRole('button', { name: /confirmar/i })).toHaveFocus();

    // Press Enter to confirm
    await user.keyboard('{Enter}');
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it('should have proper ARIA attributes from Modal', () => {
    render(<ConfirmDialog {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
  });
});
