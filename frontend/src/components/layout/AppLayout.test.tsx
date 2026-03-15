import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';

// Mock the stores
vi.mock('../../stores/uiStore');
vi.mock('../../stores/authStore');

describe('AppLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(useUIStore).mockReturnValue({
      isMobileMenuOpen: false,
      toggleMobileMenu: vi.fn(),
      activeModal: null,
      toasts: [],
      openModal: vi.fn(),
      closeModal: vi.fn(),
      showToast: vi.fn(),
      hideToast: vi.fn(),
    });

    vi.mocked(useAuthStore).mockReturnValue({
      user: { id: '1', email: 'test@example.com', createdAt: '2024-01-01' },
      token: 'token',
      isAuthenticated: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      checkAuth: vi.fn(),
    });
  });

  const renderAppLayout = (children: React.ReactNode = <div>Test Content</div>) => {
    return render(
      <BrowserRouter>
        <AppLayout>{children}</AppLayout>
      </BrowserRouter>
    );
  };

  it('should render children content', () => {
    renderAppLayout(<div>Test Content</div>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render Navigation component', () => {
    renderAppLayout();
    expect(screen.getByText('Polaroid Frame')).toBeInTheDocument();
  });

  it('should render footer with copyright', () => {
    renderAppLayout();
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(`© ${currentYear} Polaroid Frame. Todos los derechos reservados.`)).toBeInTheDocument();
  });

  it('should have proper layout structure', () => {
    renderAppLayout();
    
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass('flex-1', 'w-full');
  });

  it('should have responsive padding classes', () => {
    renderAppLayout();
    
    const main = screen.getByRole('main');
    const container = main.firstChild as HTMLElement;
    expect(container).toHaveClass('max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'py-6', 'sm:py-8');
  });

  it('should render MobileMenu when mobile menu is open', () => {
    vi.mocked(useUIStore).mockReturnValue({
      isMobileMenuOpen: true,
      toggleMobileMenu: vi.fn(),
      activeModal: null,
      toasts: [],
      openModal: vi.fn(),
      closeModal: vi.fn(),
      showToast: vi.fn(),
      hideToast: vi.fn(),
    });

    renderAppLayout();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should have min-h-screen for full viewport height', () => {
    const { container } = renderAppLayout();
    const layoutDiv = container.firstChild as HTMLElement;
    expect(layoutDiv).toHaveClass('min-h-screen', 'bg-gray-50', 'flex', 'flex-col');
  });

  it('should render navigation at the top', () => {
    renderAppLayout();
    const nav = screen.getByRole('navigation');
    const main = screen.getByRole('main');
    
    // Navigation should come before main in DOM order
    expect(nav.compareDocumentPosition(main)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('should render footer at the bottom', () => {
    renderAppLayout();
    const main = screen.getByRole('main');
    const footer = screen.getByRole('contentinfo');
    
    // Footer should come after main in DOM order
    expect(main.compareDocumentPosition(footer)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });
});
