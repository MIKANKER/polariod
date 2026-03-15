import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from './RegisterForm';
import { useAuth } from '../../hooks/useAuth';

// Mock useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('RegisterForm', () => {
  const mockRegister = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      register: mockRegister,
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
    });
  });

  it('should render email, password, and confirm password fields', () => {
    render(<RegisterForm />);

    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^contraseña$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmar contraseña/i)).toBeInTheDocument();
  });

  it('should render submit button', () => {
    render(<RegisterForm />);

    expect(screen.getByRole('button', { name: /registrarse/i })).toBeInTheDocument();
  });

  it('should disable submit button when fields are empty', () => {
    render(<RegisterForm />);

    const submitButton = screen.getByRole('button', { name: /registrarse/i });
    expect(submitButton).toBeDisabled();
  });

  it('should show error for invalid email format', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const emailInput = screen.getByLabelText(/^email$/i);
    await user.type(emailInput, 'invalid-email');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/email inválido/i)).toBeInTheDocument();
    });
  });

  it('should show error for weak password (less than 8 characters)', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const passwordInput = screen.getByLabelText(/^contraseña$/i);
    await user.type(passwordInput, 'Pass1');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/al menos 8 caracteres/i)).toBeInTheDocument();
    });
  });

  it('should show error for password without uppercase, lowercase, and numbers', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const passwordInput = screen.getByLabelText(/^contraseña$/i);
    await user.type(passwordInput, 'password');
    await user.tab();

    await waitFor(() => {
      expect(
        screen.getByText(/debe contener mayúsculas, minúsculas y números/i)
      ).toBeInTheDocument();
    });
  });

  it('should show error when passwords do not match', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const passwordInput = screen.getByLabelText(/^contraseña$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmar contraseña/i);

    await user.type(passwordInput, 'Password123');
    await user.type(confirmPasswordInput, 'Password456');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/las contraseñas no coinciden/i)).toBeInTheDocument();
    });
  });

  it('should enable submit button when form is valid', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const emailInput = screen.getByLabelText(/^email$/i);
    const passwordInput = screen.getByLabelText(/^contraseña$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmar contraseña/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Password123');
    await user.type(confirmPasswordInput, 'Password123');

    // Trigger blur to validate
    await user.tab(); // Blur confirm password field
    await user.tab(); // Blur to next element

    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /registrarse/i });
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('should call register with correct data on submit', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue(undefined);

    render(<RegisterForm onSuccess={mockOnSuccess} />);

    const emailInput = screen.getByLabelText(/^email$/i);
    const passwordInput = screen.getByLabelText(/^contraseña$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmar contraseña/i);

    await user.type(emailInput, 'newuser@example.com');
    await user.type(passwordInput, 'Password123');
    await user.type(confirmPasswordInput, 'Password123');

    // Trigger blur to validate
    await user.tab();
    await user.tab();

    // Wait for button to be enabled
    const submitButton = await screen.findByRole('button', { name: /registrarse/i }, { timeout: 3000 });
    expect(submitButton).not.toBeDisabled();

    await user.click(submitButton);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('newuser@example.com', 'Password123');
    });
  });

  it('should call onSuccess callback after successful registration', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue(undefined);

    render(<RegisterForm onSuccess={mockOnSuccess} />);

    const emailInput = screen.getByLabelText(/^email$/i);
    const passwordInput = screen.getByLabelText(/^contraseña$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmar contraseña/i);

    await user.type(emailInput, 'newuser@example.com');
    await user.type(passwordInput, 'Password123');
    await user.type(confirmPasswordInput, 'Password123');

    // Trigger blur to validate
    await user.tab();
    await user.tab();

    // Wait for button to be enabled
    const submitButton = await screen.findByRole('button', { name: /registrarse/i }, { timeout: 3000 });
    expect(submitButton).not.toBeDisabled();

    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('should display server error message on registration failure', async () => {
    const user = userEvent.setup();
    mockRegister.mockRejectedValue(new Error('El email ya está registrado'));

    render(<RegisterForm />);

    const emailInput = screen.getByLabelText(/^email$/i);
    const passwordInput = screen.getByLabelText(/^contraseña$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmar contraseña/i);

    await user.type(emailInput, 'existing@example.com');
    await user.type(passwordInput, 'Password123');
    await user.type(confirmPasswordInput, 'Password123');

    // Trigger blur to validate
    await user.tab();
    await user.tab();

    // Wait for button to be enabled
    const submitButton = await screen.findByRole('button', { name: /registrarse/i }, { timeout: 3000 });
    expect(submitButton).not.toBeDisabled();

    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/el email ya está registrado/i)).toBeInTheDocument();
    });
  });

  it('should show loading state during submission', async () => {
    const user = userEvent.setup();
    mockRegister.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<RegisterForm />);

    const emailInput = screen.getByLabelText(/^email$/i);
    const passwordInput = screen.getByLabelText(/^contraseña$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmar contraseña/i);

    await user.type(emailInput, 'newuser@example.com');
    await user.type(passwordInput, 'Password123');
    await user.type(confirmPasswordInput, 'Password123');

    // Trigger blur to validate
    await user.tab();
    await user.tab();

    // Wait for button to be enabled
    const submitButton = await screen.findByRole('button', { name: /registrarse/i }, { timeout: 3000 });
    expect(submitButton).not.toBeDisabled();

    await user.click(submitButton);

    expect(screen.getByText(/registrando.../i)).toBeInTheDocument();
  });
});
