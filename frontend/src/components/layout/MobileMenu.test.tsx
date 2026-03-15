import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { MobileMenu } from './MobileMenu';
import { useAuthStore } from '../../stores/authStore';

// Mock the auth store
vi.mock('../../stores/authStore');

const mockLogout = vi.fn();
const mockOnClose = vi.fn();

describe('MobileMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(useAuthStore).mockReturnValue({
      user: { id: '1', email: 'test@example.com', createdAt: '2024-01-01' },
      token: 'token',
      isAuthenticated: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: mockLogout,
      checkAuth: vi.fn(),
    });
  });

  const renderMobileMenu = (isOpen = true) => {
    return render(
      <BrowserRouter>
        <MobileMenu isOpen={isOpen} onClose={mockOnClose} />
      </BrowserRouter>
    );
  };

  it('should not render when closed', () => {
    renderMobileMenu(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render when open', () => {
    renderMobileMenu(true);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should display user email', () => {
    renderMobileMenu(true);
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('should render all navigation links', () => {
    renderMobileMenu(true);
    expect(screen.getByText('Galería')).toBeInTheDocument();
    expect(screen.getByText('Generar Marco')).toBeInTheDocument();
    expect(screen.getByText('Perfil')).toBeInTheDocument();
  });

  it('should render logout button', () => {
    renderMobileMenu(true);
    expect(screen.getByText('Cerrar sesión')).toBeInTheDocument();
  });

  it('should close menu when backdrop is clicked', async () => {
    const user = userEvent.setup();
    renderMobileMenu(true);
    
    const backdrop = screen.getByRole('dialog').previousSibling as HTMLElement;
    await user.click(backdrop);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should close menu when close button is clicked', async () => {
    const user = userEvent.setup();
    renderMobileMenu(true);
    
    const closeButton = screen.getByLabelText('Cerrar menú');
    await user.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call logout and close menu when logout button is clicked', async () => {
    const user = userEvent.setup();
    renderMobileMenu(true);
    
    const logoutButton = screen.getByText('Cerrar sesión');
    await user.click(logoutButton);
    
    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should close menu on ESC key press', async () => {
    const user = userEvent.setup();
    renderMobileMenu(true);
    
    await user.keyboard('{Escape}');
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should have touch-friendly button sizes (min 44x44px)', () => {
    renderMobileMenu(true);
    
    const navLinks = screen.getAllByRole('link');
    navLinks.forEach(link => {
      expect(link).toHaveClass('min-h-[44px]', 'min-w-[44px]');
    });
    
    const logoutButton = screen.getByText('Cerrar sesión');
    expect(logoutButton).toHaveClass('min-h-[44px]');
  });

  it('should have proper ARIA attributes', () => {
    renderMobileMenu(true);
    
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'Menú de navegación');
  });

  it('should prevent body scroll when open', () => {
    renderMobileMenu(true);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('should restore body scroll when closed', () => {
    const { rerender } = renderMobileMenu(true);
    expect(document.body.style.overflow).toBe('hidden');
    
    rerender(
      <BrowserRouter>
        <MobileMenu isOpen={false} onClose={mockOnClose} />
      </BrowserRouter>
    );
    
    expect(document.body.style.overflow).toBe('');
  });

  it('should have slide-in animation classes', () => {
    renderMobileMenu(true);
    
    const drawer = screen.getByRole('dialog');
    expect(drawer).toHaveClass('transform', 'transition-transform', 'duration-300', 'ease-in-out');
  });
});
