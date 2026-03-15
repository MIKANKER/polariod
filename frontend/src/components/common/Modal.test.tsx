import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from './Modal';

describe('Modal', () => {
  it('should not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()} title="Test Modal">
        Content
      </Modal>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
        Content
      </Modal>
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should display title', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
        Content
      </Modal>
    );
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
  });

  it('should display children content', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
        <p>Modal content here</p>
      </Modal>
    );
    expect(screen.getByText('Modal content here')).toBeInTheDocument();
  });

  it('should have close button', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
        Content
      </Modal>
    );
    expect(screen.getByLabelText(/cerrar modal/i)).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        Content
      </Modal>
    );

    await user.click(screen.getByLabelText(/cerrar modal/i));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when backdrop is clicked', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        Content
      </Modal>
    );

    const backdrop = screen.getByRole('dialog');
    await user.click(backdrop);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('should not call onClose when modal content is clicked', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <p>Content</p>
      </Modal>
    );

    await user.click(screen.getByText('Content'));
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('should call onClose when ESC key is pressed', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        Content
      </Modal>
    );

    await user.keyboard('{Escape}');
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('should have proper ARIA attributes', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
        Content
      </Modal>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
  });

  it('should apply small size class', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal" size="sm">
        Content
      </Modal>
    );

    const modalContent = screen.getByRole('dialog').querySelector('div > div');
    expect(modalContent).toHaveClass('max-w-sm');
  });

  it('should apply medium size class by default', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
        Content
      </Modal>
    );

    const modalContent = screen.getByRole('dialog').querySelector('div > div');
    expect(modalContent).toHaveClass('max-w-md');
  });

  it('should apply large size class', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal" size="lg">
        Content
      </Modal>
    );

    const modalContent = screen.getByRole('dialog').querySelector('div > div');
    expect(modalContent).toHaveClass('max-w-lg');
  });

  it('should trap focus within modal', async () => {
    const user = userEvent.setup();
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
        <button>First</button>
        <button>Second</button>
        <button>Third</button>
      </Modal>
    );

    const closeButton = screen.getByLabelText(/cerrar modal/i);
    const firstButton = screen.getByText('First');
    const thirdButton = screen.getByText('Third');

    // Close button should be focused initially
    expect(closeButton).toHaveFocus();

    // Tab through elements
    await user.tab();
    expect(firstButton).toHaveFocus();

    await user.tab();
    expect(screen.getByText('Second')).toHaveFocus();

    await user.tab();
    expect(thirdButton).toHaveFocus();

    // Tab from last element should cycle to first
    await user.tab();
    expect(closeButton).toHaveFocus();

    // Shift+Tab should go backwards
    await user.tab({ shift: true });
    expect(thirdButton).toHaveFocus();
  });
});
