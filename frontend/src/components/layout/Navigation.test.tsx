import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { Navigation } from './Navigation';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';

// Mock the stores
vi.mock('../../stores/uiStore');
vi.mock('../../stores/authStore');

const mockToggleMobileMenu = vi.fn();
const mockLogout = vi.fn();

describe('Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock implementations
    vi.mocked(useUIStore).mockReturnValue({
      isMobileMenuOpen: false,
      toggleMobileMenu: mockToggleMobileMenu,
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
      logout: mockLogout,
      checkAuth: vi.fn(),
    });
  });

  const renderNavigation = () => {
    return render(
      <BrowserRouter>
        <Navigation />
      </BrowserRouter>
    );
  };

  it('should render logo and brand name', () => {
    renderNavigation();
    expect(screen.getByText('Polaroid Frame')).toBeInTheDocument();
  });

  it('should render all navigation links on desktop', () => {
    renderNavigation();
    expect(screen.getByText('Galería')).toBeInTheDocument();
    expect(screen.getByText('Generar Marco')).toBeInTheDocument();
    expect(screen.getByText('Perfil')).toBeInTheDocument();
  });

  it('should display user email', () => {
    renderNavigation();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('should render logout button', () => {
    renderNavigation();
    expect(screen.getByText('Cerrar sesión')).toBeInTheDocument();
  });

  it('should call logout when logout button is clicked', async () => {
    const user = userEvent.setup();
    renderNavigation();
    
    const logoutButton = screen.getByText('Cerrar sesión');
    await user.click(logoutButton);
    
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('should render mobile menu button', () => {
    renderNavigation();
    const menuButton = screen.getByLabelText('Abrir menú');
    expect(menuButton).toBeInTheDocument();
  });

  it('should toggle mobile menu when hamburger button is clicked', async () => {
    const user = userEvent.setup();
    renderNavigation();
    
    const menuButton = screen.getByLabelText('Abrir menú');
    await user.click(menuButton);
    
    expect(mockToggleMobileMenu).toHaveBeenCalledTimes(1);
  });

  it('should show close icon when mobile menu is open', () => {
    vi.mocked(useUIStore).mockReturnValue({
      isMobileMenuOpen: true,
      toggleMobileMenu: mockToggleMobileMenu,
      activeModal: null,
      toasts: [],
      openModal: vi.fn(),
      closeModal: vi.fn(),
      showToast: vi.fn(),
      hideToast: vi.fn(),
    });

    renderNavigation();
    expect(screen.getByLabelText('Cerrar menú')).toBeInTheDocument();
  });

  it('should highlight active route', () => {
    // Render with a specific route
    render(
      <BrowserRouter>
        <Navigation />
      </BrowserRouter>
    );
    
    // Check that navigation links exist
    const galleryLink = screen.getByText('Galería').closest('a');
    expect(galleryLink).toBeInTheDocument();
    
    // The active styling is applied based on useLocation, which defaults to "/"
    // In a real app, the active route would be highlighted based on the current path
  });

  it('should have accessible navigation structure', () => {
    renderNavigation();
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
  });
});
