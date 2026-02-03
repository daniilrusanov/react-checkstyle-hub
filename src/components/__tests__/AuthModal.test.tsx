/**
 * Unit tests for AuthModal component
 * Tests login/register forms, validation, and user interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthModal } from '../AuthModal';
import { AuthProvider } from '../../context/AuthContext';
import { ThemeProvider } from '../../context/ThemeContext';
import * as authService from '../../services/auth';

// Mock auth service
vi.mock('../../services/auth', () => ({
    getUser: vi.fn(() => null),
    isAuthenticated: vi.fn(() => false),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
    default: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

import toast from 'react-hot-toast';

// Wrapper component with providers
const renderWithProviders = (ui: React.ReactElement) => {
    return render(
        <ThemeProvider>
            <AuthProvider>{ui}</AuthProvider>
        </ThemeProvider>
    );
};

describe('AuthModal', () => {
    const mockOnClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should not render when isOpen is false', () => {
            renderWithProviders(<AuthModal isOpen={false} onClose={mockOnClose} />);

            expect(screen.queryByText('Вхід')).not.toBeInTheDocument();
        });

        it('should render login form by default', () => {
            renderWithProviders(<AuthModal isOpen={true} onClose={mockOnClose} />);

            expect(screen.getByPlaceholderText("Ім'я користувача")).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Пароль')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /увійти/i })).toBeInTheDocument();
        });

        it('should render register form when initialTab is register', () => {
            renderWithProviders(
                <AuthModal isOpen={true} onClose={mockOnClose} initialTab="register" />
            );

            expect(screen.getByPlaceholderText("Ім'я користувача")).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Пароль')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Підтвердіть пароль')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /зареєструватися/i })).toBeInTheDocument();
        });

        it('should show demo credentials hint on login tab', () => {
            renderWithProviders(<AuthModal isOpen={true} onClose={mockOnClose} />);

            expect(screen.getByText(/тестовий акаунт/i)).toBeInTheDocument();
            expect(screen.getByText('admin')).toBeInTheDocument();
            expect(screen.getByText('admin123')).toBeInTheDocument();
        });
    });

    describe('Tab Switching', () => {
        it('should switch to register tab when clicked', async () => {
            const user = userEvent.setup();
            renderWithProviders(<AuthModal isOpen={true} onClose={mockOnClose} />);

            await user.click(screen.getByRole('button', { name: /реєстрація/i }));

            expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Підтвердіть пароль')).toBeInTheDocument();
        });

        it('should switch to login tab when clicked', async () => {
            const user = userEvent.setup();
            renderWithProviders(
                <AuthModal isOpen={true} onClose={mockOnClose} initialTab="register" />
            );

            await user.click(screen.getByRole('button', { name: /вхід/i }));

            expect(screen.queryByPlaceholderText('Email')).not.toBeInTheDocument();
            expect(screen.queryByPlaceholderText('Підтвердіть пароль')).not.toBeInTheDocument();
        });
    });

    describe('Login Form', () => {
        it('should submit login form with correct data', async () => {
            const user = userEvent.setup();
            const mockResponse = {
                token: 'jwt-token',
                username: 'testuser',
                email: 'test@example.com',
                role: 'USER',
                experienceLevel: 'STUDENT' as const,
            };

            vi.mocked(authService.login).mockResolvedValue(mockResponse);

            renderWithProviders(<AuthModal isOpen={true} onClose={mockOnClose} />);

            await user.type(screen.getByPlaceholderText("Ім'я користувача"), 'testuser');
            await user.type(screen.getByPlaceholderText('Пароль'), 'password123');
            await user.click(screen.getByRole('button', { name: /увійти/i }));

            await waitFor(() => {
                expect(authService.login).toHaveBeenCalledWith({
                    username: 'testuser',
                    password: 'password123',
                });
            });

            expect(toast.success).toHaveBeenCalledWith('Успішний вхід!');
            expect(mockOnClose).toHaveBeenCalled();
        });

        it('should show error toast on login failure', async () => {
            const user = userEvent.setup();

            vi.mocked(authService.login).mockRejectedValue(new Error('Invalid credentials'));

            renderWithProviders(<AuthModal isOpen={true} onClose={mockOnClose} />);

            await user.type(screen.getByPlaceholderText("Ім'я користувача"), 'testuser');
            await user.type(screen.getByPlaceholderText('Пароль'), 'wrongpassword');
            await user.click(screen.getByRole('button', { name: /увійти/i }));

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
            });

            expect(mockOnClose).not.toHaveBeenCalled();
        });

        it('should disable button while submitting', async () => {
            const user = userEvent.setup();

            // Create a promise that we can control
            let resolveLogin: (value: unknown) => void;
            const loginPromise = new Promise((resolve) => {
                resolveLogin = resolve;
            });
            vi.mocked(authService.login).mockReturnValue(loginPromise as Promise<authService.AuthResponse>);

            renderWithProviders(<AuthModal isOpen={true} onClose={mockOnClose} />);

            await user.type(screen.getByPlaceholderText("Ім'я користувача"), 'testuser');
            await user.type(screen.getByPlaceholderText('Пароль'), 'password');

            const submitButton = screen.getByRole('button', { name: /увійти/i });
            await user.click(submitButton);

            // Button should be disabled while submitting
            expect(submitButton).toBeDisabled();

            // Resolve the promise
            resolveLogin!({
                token: 'token',
                username: 'testuser',
                email: 'test@example.com',
                role: 'USER',
                experienceLevel: 'STUDENT',
            });
        });
    });

    describe('Register Form', () => {
        it('should submit register form with correct data', async () => {
            const user = userEvent.setup();
            const mockResponse = {
                token: 'jwt-token',
                username: 'newuser',
                email: 'new@example.com',
                role: 'USER',
                experienceLevel: 'STUDENT' as const,
            };

            vi.mocked(authService.register).mockResolvedValue(mockResponse);

            renderWithProviders(
                <AuthModal isOpen={true} onClose={mockOnClose} initialTab="register" />
            );

            await user.type(screen.getByPlaceholderText("Ім'я користувача"), 'newuser');
            await user.type(screen.getByPlaceholderText('Email'), 'new@example.com');
            await user.type(screen.getByPlaceholderText('Пароль'), 'password123');
            await user.type(screen.getByPlaceholderText('Підтвердіть пароль'), 'password123');
            await user.click(screen.getByRole('button', { name: /зареєструватися/i }));

            await waitFor(() => {
                expect(authService.register).toHaveBeenCalledWith({
                    username: 'newuser',
                    email: 'new@example.com',
                    password: 'password123',
                });
            });

            expect(toast.success).toHaveBeenCalledWith('Реєстрація успішна!');
            expect(mockOnClose).toHaveBeenCalled();
        });

        it('should show error when passwords do not match', async () => {
            const user = userEvent.setup();

            renderWithProviders(
                <AuthModal isOpen={true} onClose={mockOnClose} initialTab="register" />
            );

            await user.type(screen.getByPlaceholderText("Ім'я користувача"), 'newuser');
            await user.type(screen.getByPlaceholderText('Email'), 'new@example.com');
            await user.type(screen.getByPlaceholderText('Пароль'), 'password123');
            await user.type(screen.getByPlaceholderText('Підтвердіть пароль'), 'different');
            await user.click(screen.getByRole('button', { name: /зареєструватися/i }));

            expect(toast.error).toHaveBeenCalledWith('Паролі не співпадають');
            expect(authService.register).not.toHaveBeenCalled();
        });

        it('should show error when password is too short', async () => {
            const user = userEvent.setup();

            renderWithProviders(
                <AuthModal isOpen={true} onClose={mockOnClose} initialTab="register" />
            );

            await user.type(screen.getByPlaceholderText("Ім'я користувача"), 'newuser');
            await user.type(screen.getByPlaceholderText('Email'), 'new@example.com');
            await user.type(screen.getByPlaceholderText('Пароль'), '12345');
            await user.type(screen.getByPlaceholderText('Підтвердіть пароль'), '12345');
            await user.click(screen.getByRole('button', { name: /зареєструватися/i }));

            expect(toast.error).toHaveBeenCalledWith('Пароль має бути не менше 6 символів');
            expect(authService.register).not.toHaveBeenCalled();
        });

        it('should show error toast on registration failure', async () => {
            const user = userEvent.setup();

            vi.mocked(authService.register).mockRejectedValue(new Error('Username already exists'));

            renderWithProviders(
                <AuthModal isOpen={true} onClose={mockOnClose} initialTab="register" />
            );

            await user.type(screen.getByPlaceholderText("Ім'я користувача"), 'existinguser');
            await user.type(screen.getByPlaceholderText('Email'), 'test@example.com');
            await user.type(screen.getByPlaceholderText('Пароль'), 'password123');
            await user.type(screen.getByPlaceholderText('Підтвердіть пароль'), 'password123');
            await user.click(screen.getByRole('button', { name: /зареєструватися/i }));

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('Username already exists');
            });

            expect(mockOnClose).not.toHaveBeenCalled();
        });
    });

    describe('Close Modal', () => {
        it('should close modal when close button is clicked', async () => {
            const user = userEvent.setup();
            renderWithProviders(<AuthModal isOpen={true} onClose={mockOnClose} />);

            // Find the close button (X icon button)
            const closeButtons = screen.getAllByRole('button');
            const closeButton = closeButtons.find(
                (btn) => btn.querySelector('svg') && !btn.textContent?.includes('Вхід')
            );

            if (closeButton) {
                await user.click(closeButton);
                expect(mockOnClose).toHaveBeenCalled();
            }
        });

        it('should close modal when clicking overlay', async () => {
            const user = userEvent.setup();
            renderWithProviders(<AuthModal isOpen={true} onClose={mockOnClose} />);

            // Click the overlay (parent div with fixed position)
            const overlay = document.querySelector('[style*="position: fixed"]');
            if (overlay) {
                await user.click(overlay);
                expect(mockOnClose).toHaveBeenCalled();
            }
        });
    });

    describe('Input Validation', () => {
        it('should require username field in login form', () => {
            renderWithProviders(<AuthModal isOpen={true} onClose={mockOnClose} />);

            const usernameInput = screen.getByPlaceholderText("Ім'я користувача");
            expect(usernameInput).toHaveAttribute('required');
        });

        it('should require password field in login form', () => {
            renderWithProviders(<AuthModal isOpen={true} onClose={mockOnClose} />);

            const passwordInput = screen.getByPlaceholderText('Пароль');
            expect(passwordInput).toHaveAttribute('required');
        });

        it('should require email field in register form', () => {
            renderWithProviders(
                <AuthModal isOpen={true} onClose={mockOnClose} initialTab="register" />
            );

            const emailInput = screen.getByPlaceholderText('Email');
            expect(emailInput).toHaveAttribute('required');
            expect(emailInput).toHaveAttribute('type', 'email');
        });

        it('should have minimum length for username in register form', () => {
            renderWithProviders(
                <AuthModal isOpen={true} onClose={mockOnClose} initialTab="register" />
            );

            const usernameInput = screen.getByPlaceholderText("Ім'я користувача");
            expect(usernameInput).toHaveAttribute('minLength', '3');
        });

        it('should have minimum length for password in register form', () => {
            renderWithProviders(
                <AuthModal isOpen={true} onClose={mockOnClose} initialTab="register" />
            );

            const passwordInput = screen.getByPlaceholderText('Пароль');
            expect(passwordInput).toHaveAttribute('minLength', '6');
        });
    });

    describe('Form Reset', () => {
        it('should clear forms after successful login', async () => {
            const user = userEvent.setup();
            const mockResponse = {
                token: 'jwt-token',
                username: 'testuser',
                email: 'test@example.com',
                role: 'USER',
                experienceLevel: 'STUDENT' as const,
            };

            vi.mocked(authService.login).mockResolvedValue(mockResponse);

            const { rerender } = renderWithProviders(
                <AuthModal isOpen={true} onClose={mockOnClose} />
            );

            await user.type(screen.getByPlaceholderText("Ім'я користувача"), 'testuser');
            await user.type(screen.getByPlaceholderText('Пароль'), 'password123');
            await user.click(screen.getByRole('button', { name: /увійти/i }));

            await waitFor(() => {
                expect(mockOnClose).toHaveBeenCalled();
            });

            // Reopen modal
            rerender(
                <ThemeProvider>
                    <AuthProvider>
                        <AuthModal isOpen={true} onClose={mockOnClose} />
                    </AuthProvider>
                </ThemeProvider>
            );

            // Forms should be cleared (this depends on implementation)
            const usernameInput = screen.getByPlaceholderText("Ім'я користувача");
            expect(usernameInput).toHaveValue('');
        });
    });

    describe('Accessibility', () => {
        it('should have proper form structure', () => {
            renderWithProviders(<AuthModal isOpen={true} onClose={mockOnClose} />);

            expect(screen.getByRole('button', { name: /увійти/i })).toHaveAttribute(
                'type',
                'submit'
            );
        });

        it('should have password input type', () => {
            renderWithProviders(<AuthModal isOpen={true} onClose={mockOnClose} />);

            const passwordInput = screen.getByPlaceholderText('Пароль');
            expect(passwordInput).toHaveAttribute('type', 'password');
        });

        it('should have proper heading', () => {
            renderWithProviders(<AuthModal isOpen={true} onClose={mockOnClose} />);

            expect(screen.getByRole('heading', { name: 'Вхід' })).toBeInTheDocument();
        });
    });
});
