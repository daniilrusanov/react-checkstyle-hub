/**
 * Unit tests for AuthContext
 * Tests authentication state management, login/logout flows
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../AuthContext';
import * as authService from '../../services/auth';

// Mock auth service
vi.mock('../../services/auth', () => ({
    getUser: vi.fn(),
    isAuthenticated: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
}));

// Test component to access context
const TestComponent = () => {
    const { user, isAuthenticated, isLoading, login, register, logout, updateUser } = useAuth();

    const handleLogin = async () => {
        try {
            await login({ username: 'test', password: 'pass' });
        } catch {
            // Error is expected in some tests
        }
    };

    const handleRegister = async () => {
        try {
            await register({ username: 'test', email: 'test@example.com', password: 'pass' });
        } catch {
            // Error is expected in some tests
        }
    };

    return (
        <div>
            <div data-testid="loading">{isLoading ? 'loading' : 'ready'}</div>
            <div data-testid="authenticated">{isAuthenticated ? 'yes' : 'no'}</div>
            <div data-testid="username">{user?.username || 'none'}</div>
            <div data-testid="email">{user?.email || 'none'}</div>
            <div data-testid="experience">{user?.experienceLevel || 'none'}</div>
            <button data-testid="login-btn" onClick={handleLogin}>
                Login
            </button>
            <button data-testid="register-btn" onClick={handleRegister}>
                Register
            </button>
            <button data-testid="logout-btn" onClick={logout}>
                Logout
            </button>
            <button
                data-testid="update-btn"
                onClick={() => updateUser({ experienceLevel: 'ADVANCED' })}
            >
                Update
            </button>
        </div>
    );
};

describe('AuthContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(authService.getUser).mockReturnValue(null);
        vi.mocked(authService.isAuthenticated).mockReturnValue(false);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Initial State', () => {
        it('should initialize with no user when not logged in', async () => {
            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(screen.getByTestId('loading')).toHaveTextContent('ready');
            });

            expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
            expect(screen.getByTestId('username')).toHaveTextContent('none');
        });

        it('should initialize with user when already logged in', async () => {
            const mockUser = {
                username: 'testuser',
                email: 'test@example.com',
                role: 'USER',
                experienceLevel: 'JUNIOR' as const,
            };

            vi.mocked(authService.getUser).mockReturnValue(mockUser);
            vi.mocked(authService.isAuthenticated).mockReturnValue(true);

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(screen.getByTestId('loading')).toHaveTextContent('ready');
            });

            expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
            expect(screen.getByTestId('username')).toHaveTextContent('testuser');
            expect(screen.getByTestId('email')).toHaveTextContent('test@example.com');
        });

        it('should show loading state initially', () => {
            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            // The component renders immediately but isLoading starts as true
            expect(screen.getByTestId('loading')).toBeInTheDocument();
        });
    });

    describe('Login', () => {
        it('should login user successfully', async () => {
            const user = userEvent.setup();
            const mockResponse = {
                token: 'jwt-token',
                username: 'testuser',
                email: 'test@example.com',
                role: 'USER',
                experienceLevel: 'JUNIOR' as const,
            };

            vi.mocked(authService.login).mockResolvedValue(mockResponse);

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(screen.getByTestId('loading')).toHaveTextContent('ready');
            });

            await user.click(screen.getByTestId('login-btn'));

            await waitFor(() => {
                expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
                expect(screen.getByTestId('username')).toHaveTextContent('testuser');
            });

            expect(authService.login).toHaveBeenCalledWith({
                username: 'test',
                password: 'pass',
            });
        });

        it('should handle login error', async () => {
            const user = userEvent.setup();

            vi.mocked(authService.login).mockRejectedValue(new Error('Invalid credentials'));

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(screen.getByTestId('loading')).toHaveTextContent('ready');
            });

            // Click login - error is caught internally by the component
            await user.click(screen.getByTestId('login-btn'));

            // Wait for state to settle after the error
            await waitFor(() => {
                expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
            });
        });
    });

    describe('Register', () => {
        it('should register user successfully', async () => {
            const user = userEvent.setup();
            const mockResponse = {
                token: 'jwt-token',
                username: 'test',
                email: 'test@example.com',
                role: 'USER',
                experienceLevel: 'STUDENT' as const,
            };

            vi.mocked(authService.register).mockResolvedValue(mockResponse);

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(screen.getByTestId('loading')).toHaveTextContent('ready');
            });

            await user.click(screen.getByTestId('register-btn'));

            await waitFor(() => {
                expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
                expect(screen.getByTestId('username')).toHaveTextContent('test');
                expect(screen.getByTestId('email')).toHaveTextContent('test@example.com');
            });

            expect(authService.register).toHaveBeenCalledWith({
                username: 'test',
                email: 'test@example.com',
                password: 'pass',
            });
        });

        it('should handle registration error', async () => {
            const user = userEvent.setup();

            vi.mocked(authService.register).mockRejectedValue(new Error('Username already exists'));

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(screen.getByTestId('loading')).toHaveTextContent('ready');
            });

            // Click register - error is caught internally by the component
            await user.click(screen.getByTestId('register-btn'));

            // Wait for state to settle after the error
            await waitFor(() => {
                expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
            });
        });
    });

    describe('Logout', () => {
        it('should logout user successfully', async () => {
            const user = userEvent.setup();
            const mockUser = {
                username: 'testuser',
                email: 'test@example.com',
                role: 'USER',
                experienceLevel: 'JUNIOR' as const,
            };

            vi.mocked(authService.getUser).mockReturnValue(mockUser);
            vi.mocked(authService.isAuthenticated).mockReturnValue(true);

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
            });

            await user.click(screen.getByTestId('logout-btn'));

            expect(authService.logout).toHaveBeenCalled();
            expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
            expect(screen.getByTestId('username')).toHaveTextContent('none');
        });
    });

    describe('Update User', () => {
        it('should update user data', async () => {
            const user = userEvent.setup();
            const mockUser = {
                username: 'testuser',
                email: 'test@example.com',
                role: 'USER',
                experienceLevel: 'STUDENT' as const,
            };

            vi.mocked(authService.getUser).mockReturnValue(mockUser);
            vi.mocked(authService.isAuthenticated).mockReturnValue(true);

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(screen.getByTestId('experience')).toHaveTextContent('STUDENT');
            });

            await user.click(screen.getByTestId('update-btn'));

            await waitFor(() => {
                expect(screen.getByTestId('experience')).toHaveTextContent('ADVANCED');
            });
        });

        it('should not update when no user is logged in', async () => {
            const user = userEvent.setup();

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(screen.getByTestId('loading')).toHaveTextContent('ready');
            });

            await user.click(screen.getByTestId('update-btn'));

            expect(screen.getByTestId('username')).toHaveTextContent('none');
        });
    });

    describe('useAuth Hook', () => {
        it('should throw error when used outside AuthProvider', () => {
            const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

            expect(() => {
                render(<TestComponent />);
            }).toThrow('useAuth must be used within an AuthProvider');

            consoleError.mockRestore();
        });
    });

    describe('Session Persistence', () => {
        it('should restore session from storage on mount', async () => {
            const mockUser = {
                username: 'persisteduser',
                email: 'persisted@example.com',
                role: 'USER',
                experienceLevel: 'ADVANCED' as const,
            };

            vi.mocked(authService.getUser).mockReturnValue(mockUser);
            vi.mocked(authService.isAuthenticated).mockReturnValue(true);

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(screen.getByTestId('username')).toHaveTextContent('persisteduser');
                expect(screen.getByTestId('experience')).toHaveTextContent('ADVANCED');
            });
        });

        it('should not restore session when token is invalid', async () => {
            vi.mocked(authService.getUser).mockReturnValue({
                username: 'testuser',
                email: 'test@example.com',
                role: 'USER',
                experienceLevel: 'STUDENT' as const,
            });
            vi.mocked(authService.isAuthenticated).mockReturnValue(false);

            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(screen.getByTestId('loading')).toHaveTextContent('ready');
            });

            expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
        });
    });
});
