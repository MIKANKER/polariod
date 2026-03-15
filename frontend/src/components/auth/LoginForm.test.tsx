import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';
import { useAuth } from '../../hooks/useAuth';

// Mock useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('LoginForm', () => {
  const mockLogin = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      login: mockLogin,
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      register: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
    });
  });

  it('should render email and password fields', () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
  });

  it('should render submit button', () => {
    render(<LoginForm />);

    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it('should disable submit button when fields are empty', () => {
    render(<LoginForm />);

    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    expect(submitButton).toBeDisabled();
  });

  it('should show error for invalid email format', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'invalid-email');
    
    // Trigger validation by moving focus away (blur)
    await user.tab();

    // Wait for validation to complete and error to appear
    await waitFor(() => {
      expect(screen.getByText(/email inválido/i)).toBeInTheDocument();
    });
  });

  it('should show error when email is required', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    await user.click(emailInput);
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/el email es requerido/i)).toBeInTheDocument();
    });
  });

  it('should show error when password is required', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const passwordInput = screen.getByLabelText(/contraseña/i);
    await user.click(passwordInput);
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/la contraseña es requerida/i)).toBeInTheDocument();
    });
  });

  it('should enable submit button when form is valid', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);

    // Type valid data
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    // Trigger blur on both fields to trigger validation
    await user.tab(); // Blur password field
    await user.tab(); // Blur to next element (or body)

    // Wait for validation state to update (isValid becomes true)
    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
      expect(submitButton).not.toBeDisabled();
    }, { timeout: 3000 });
  });

  it('should call login with correct credentials on submit', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue(undefined);

    render(<LoginForm onSuccess={mockOnSuccess} />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    // Trigger blur to validate
    await user.tab();
    await user.tab();

    // Wait for button to be enabled
    const submitButton = await screen.findByRole('button', { name: /iniciar sesión/i }, { timeout: 3000 });
    expect(submitButton).not.toBeDisabled();

    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('should call onSuccess callback after successful login', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue(undefined);

    render(<LoginForm onSuccess={mockOnSuccess} />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    // Trigger blur to validate
    await user.tab();
    await user.tab();

    // Wait for button to be enabled
    const submitButton = await screen.findByRole('button', { name: /iniciar sesión/i }, { timeout: 3000 });
    expect(submitButton).not.toBeDisabled();

    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('should display server error message on login failure', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValue(new Error('Credenciales inválidas'));

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');

    // Trigger blur to validate
    await user.tab();
    await user.tab();

    // Wait for button to be enabled
    const submitButton = await screen.findByRole('button', { name: /iniciar sesión/i }, { timeout: 3000 });
    expect(submitButton).not.toBeDisabled();

    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/credenciales inválidas/i)).toBeInTheDocument();
    });
  });

  it('should show loading state during submission', async () => {
    const user = userEvent.setup();
    mockLogin.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    // Trigger blur to validate
    await user.tab();
    await user.tab();

    // Wait for button to be enabled
    const submitButton = await screen.findByRole('button', { name: /iniciar sesión/i }, { timeout: 3000 });
    expect(submitButton).not.toBeDisabled();

    await user.click(submitButton);

    // Button should now show loading text
    expect(screen.getByText(/iniciando sesión/i)).toBeInTheDocument();
  });

  it('should disable form fields during submission', async () => {
    const user = userEvent.setup();
    mockLogin.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    // Trigger blur to validate
    await user.tab();
    await user.tab();

    // Wait for button to be enabled
    const submitButton = await screen.findByRole('button', { name: /iniciar sesión/i }, { timeout: 3000 });
    expect(submitButton).not.toBeDisabled();

    await user.click(submitButton);

    // Fields should be disabled during submission
    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
  });
});
