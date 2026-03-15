import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { ProfilePage } from './ProfilePage';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';

// Mock the stores
vi.mock('../stores/authStore');
vi.mock('../stores/uiStore');

const mockLogout = vi.fn();

describe('ProfilePage', () => {
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
      user: {
        id: 'user-123-abc',
        email: 'test@example.com',
        createdAt: '2024-01-15T10:30:00Z',
      },
      token: 'token',
      isAuthenticated: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: mockLogout,
      checkAuth: vi.fn(),
    });
  });

  const renderProfilePage = () => {
    return render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );
  };

  it('should render page title', () => {
    renderProfilePage();
    expect(screen.getByText('Perfil de Usuario')).toBeInTheDocument();
  });

  it('should display user email', () => {
    renderProfilePage();
    // Use getAllByText since email appears in both nav and profile
    const emails = screen.getAllByText('test@example.com');
    expect(emails.length).toBeGreaterThan(0);
  });

  it('should display user ID', () => {
    renderProfilePage();
    expect(screen.getByText('user-123-abc')).toBeInTheDocument();
  });

  it('should display formatted account creation date', () => {
    renderProfilePage();
    // The date should be formatted in Spanish locale
    expect(screen.getByText(/15 de enero de 2024/i)).toBeInTheDocument();
  });

  it('should render logout button in profile section', () => {
    renderProfilePage();
    // Use getAllByText since logout appears in both nav and profile
    const logoutButtons = screen.getAllByText('Cerrar sesión');
    expect(logoutButtons.length).toBeGreaterThan(0);
  });

  it('should call logout when profile logout button is clicked', async () => {
    const user = userEvent.setup();
    renderProfilePage();
    
    // Get all logout buttons and click the one in the profile (last one)
    const logoutButtons = screen.getAllByText('Cerrar sesión');
    await user.click(logoutButtons[logoutButtons.length - 1]);
    
    expect(mockLogout).toHaveBeenCalled();
  });

  it('should display email label', () => {
    renderProfilePage();
    expect(screen.getByText('Correo electrónico')).toBeInTheDocument();
  });

  it('should display account creation date label', () => {
    renderProfilePage();
    expect(screen.getByText('Cuenta creada')).toBeInTheDocument();
  });

  it('should display user ID label', () => {
    renderProfilePage();
    expect(screen.getByText('ID de usuario')).toBeInTheDocument();
  });

  it('should render user avatar placeholder', () => {
    const { container } = renderProfilePage();
    // Check for the avatar container with gradient background
    const gradientHeader = container.querySelector('.bg-gradient-to-r.from-purple-500.to-pink-500');
    expect(gradientHeader).toBeInTheDocument();
  });

  it('should not render when user is null', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: mockLogout,
      checkAuth: vi.fn(),
    });

    const { container } = renderProfilePage();
    expect(container.firstChild).toBeNull();
  });

  it('should have proper layout structure', () => {
    renderProfilePage();
    
    // Check for max-width container
    const container = screen.getByText('Perfil de Usuario').closest('div');
    expect(container).toHaveClass('max-w-2xl', 'mx-auto');
  });

  it('should render all user information sections', () => {
    renderProfilePage();
    
    // Check that all three information sections are present
    expect(screen.getByText('Correo electrónico')).toBeInTheDocument();
    expect(screen.getByText('Cuenta creada')).toBeInTheDocument();
    expect(screen.getByText('ID de usuario')).toBeInTheDocument();
  });
});
