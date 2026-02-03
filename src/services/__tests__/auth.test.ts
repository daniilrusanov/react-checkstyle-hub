/**
 * Unit tests for Auth service
 * Tests authentication, registration, token management, and user data
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    getToken,
    getUser,
    isAuthenticated,
    getAuthHeaders,
    register,
    login,
    logout,
    getCurrentUser,
    getAnalysisHistory,
    getUserStatistics,
    getUserSettings,
    updateUserSettings,
    updateExperienceLevel,
    updateStoredUser,
    clearAuthData,
    type User,
    type AuthResponse,
} from '../auth';
import { BACKEND_URL } from '../../config';

// Mock fetch globally
global.fetch = vi.fn() as typeof fetch;

// Get localStorage mock from setup
const localStorageMock = window.localStorage as unknown as {
    getItem: ReturnType<typeof vi.fn>;
    setItem: ReturnType<typeof vi.fn>;
    removeItem: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
};

describe('Auth Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Token Management', () => {
        it('should return null when no token is stored', () => {
            const token = getToken();
            expect(token).toBeNull();
        });

        it('should return token when stored', () => {
            localStorageMock.setItem('checkstyle_hub_token', 'test-token-123');
            localStorageMock.getItem.mockReturnValueOnce('test-token-123');

            const token = getToken();
            expect(token).toBe('test-token-123');
        });

        it('should clear auth data correctly', () => {
            localStorageMock.setItem('checkstyle_hub_token', 'test-token');
            localStorageMock.setItem('checkstyle_hub_user', '{}');

            clearAuthData();

            expect(localStorageMock.removeItem).toHaveBeenCalledWith('checkstyle_hub_token');
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('checkstyle_hub_user');
        });
    });

    describe('User Data Management', () => {
        it('should return null when no user is stored', () => {
            const user = getUser();
            expect(user).toBeNull();
        });

        it('should return user when stored', () => {
            const mockUser: User = {
                username: 'testuser',
                email: 'test@example.com',
                role: 'USER',
                experienceLevel: 'JUNIOR',
            };

            localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockUser));

            const user = getUser();
            expect(user).toEqual(mockUser);
        });

        it('should update stored user correctly', () => {
            const mockUser: User = {
                username: 'testuser',
                email: 'test@example.com',
                role: 'USER',
                experienceLevel: 'STUDENT',
            };

            localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockUser));

            const updatedUser = updateStoredUser({ experienceLevel: 'ADVANCED' });

            expect(updatedUser).not.toBeNull();
            expect(updatedUser?.experienceLevel).toBe('ADVANCED');
            expect(localStorageMock.setItem).toHaveBeenCalled();
        });

        it('should return null when updating non-existent user', () => {
            localStorageMock.getItem.mockReturnValueOnce(null);

            const updatedUser = updateStoredUser({ experienceLevel: 'ADVANCED' });

            expect(updatedUser).toBeNull();
        });
    });

    describe('Authentication State', () => {
        it('should return false when not authenticated', () => {
            localStorageMock.getItem.mockReturnValueOnce(null);

            const isAuth = isAuthenticated();
            expect(isAuth).toBe(false);
        });

        it('should return true when authenticated', () => {
            localStorageMock.getItem.mockReturnValueOnce('valid-token');

            const isAuth = isAuthenticated();
            expect(isAuth).toBe(true);
        });
    });

    describe('Auth Headers', () => {
        it('should return empty object when no token', () => {
            localStorageMock.getItem.mockReturnValueOnce(null);

            const headers = getAuthHeaders();
            expect(headers).toEqual({});
        });

        it('should return Authorization header when token exists', () => {
            localStorageMock.getItem.mockReturnValueOnce('test-token');

            const headers = getAuthHeaders();
            expect(headers).toEqual({ Authorization: 'Bearer test-token' });
        });
    });

    describe('register', () => {
        it('should register user successfully', async () => {
            const mockResponse: AuthResponse = {
                token: 'jwt-token-123',
                username: 'newuser',
                email: 'new@example.com',
                role: 'USER',
                experienceLevel: 'STUDENT',
            };

            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            } as Response);

            const result = await register({
                username: 'newuser',
                email: 'new@example.com',
                password: 'password123',
            });

            expect(result).toEqual(mockResponse);
            expect(global.fetch).toHaveBeenCalledWith(
                `${BACKEND_URL}/api/auth/register`,
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                })
            );
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'checkstyle_hub_token',
                'jwt-token-123'
            );
        });

        it('should throw error when registration fails', async () => {
            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: false,
                json: () => Promise.resolve({ error: 'Username already exists' }),
            } as Response);

            await expect(
                register({
                    username: 'existing',
                    email: 'test@example.com',
                    password: 'password123',
                })
            ).rejects.toThrow('Username already exists');
        });

        it('should throw default error when no specific error message', async () => {
            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: false,
                json: () => Promise.resolve({}),
            } as Response);

            await expect(
                register({
                    username: 'test',
                    email: 'test@example.com',
                    password: 'password123',
                })
            ).rejects.toThrow('Помилка реєстрації');
        });
    });

    describe('login', () => {
        it('should login user successfully', async () => {
            const mockResponse: AuthResponse = {
                token: 'jwt-token-456',
                username: 'testuser',
                email: 'test@example.com',
                role: 'USER',
                experienceLevel: 'JUNIOR',
            };

            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            } as Response);

            const result = await login({
                username: 'testuser',
                password: 'password123',
            });

            expect(result).toEqual(mockResponse);
            expect(global.fetch).toHaveBeenCalledWith(
                `${BACKEND_URL}/api/auth/login`,
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                })
            );
        });

        it('should throw error for invalid credentials', async () => {
            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: false,
                json: () => Promise.resolve({ error: 'Invalid credentials' }),
            } as Response);

            await expect(
                login({
                    username: 'testuser',
                    password: 'wrongpassword',
                })
            ).rejects.toThrow('Invalid credentials');
        });

        it('should throw default error when no specific error message', async () => {
            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: false,
                json: () => Promise.resolve({}),
            } as Response);

            await expect(
                login({
                    username: 'test',
                    password: 'password',
                })
            ).rejects.toThrow("Невірне ім'я користувача або пароль");
        });
    });

    describe('logout', () => {
        it('should clear auth data on logout', () => {
            logout();

            expect(localStorageMock.removeItem).toHaveBeenCalledWith('checkstyle_hub_token');
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('checkstyle_hub_user');
        });
    });

    describe('getCurrentUser', () => {
        it('should return null when no token', async () => {
            localStorageMock.getItem.mockReturnValueOnce(null);

            const user = await getCurrentUser();
            expect(user).toBeNull();
        });

        it('should return user when token is valid', async () => {
            const mockUser: User = {
                username: 'testuser',
                email: 'test@example.com',
                role: 'USER',
                experienceLevel: 'JUNIOR',
            };

            localStorageMock.getItem.mockReturnValueOnce('valid-token');
            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockUser),
            } as Response);

            const user = await getCurrentUser();
            expect(user).toEqual(mockUser);
        });

        it('should clear auth data when token is invalid', async () => {
            localStorageMock.getItem.mockReturnValueOnce('invalid-token');
            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: false,
            } as Response);

            const user = await getCurrentUser();

            expect(user).toBeNull();
            expect(localStorageMock.removeItem).toHaveBeenCalled();
        });

        it('should handle network errors gracefully', async () => {
            localStorageMock.getItem.mockReturnValueOnce('valid-token');
            vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

            const user = await getCurrentUser();

            expect(user).toBeNull();
            expect(localStorageMock.removeItem).toHaveBeenCalled();
        });
    });

    describe('getAnalysisHistory', () => {
        it('should fetch analysis history successfully', async () => {
            const mockHistory = [
                {
                    id: 1,
                    status: 'COMPLETED',
                    errorMessage: null,
                    createdAt: '2025-11-17T10:00:00',
                    repoUrl: 'https://github.com/user/repo',
                    violationsCount: 5,
                },
            ];

            localStorageMock.getItem.mockReturnValueOnce('valid-token');
            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockHistory),
            } as Response);

            const history = await getAnalysisHistory();

            expect(history).toEqual(mockHistory);
            expect(global.fetch).toHaveBeenCalledWith(
                `${BACKEND_URL}/api/user/history`,
                expect.objectContaining({
                    headers: { Authorization: 'Bearer valid-token' },
                })
            );
        });

        it('should throw error when not authenticated', async () => {
            localStorageMock.getItem.mockReturnValueOnce(null);

            await expect(getAnalysisHistory()).rejects.toThrow('Не авторизовано');
        });

        it('should throw error when request fails', async () => {
            localStorageMock.getItem.mockReturnValueOnce('valid-token');
            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: false,
            } as Response);

            await expect(getAnalysisHistory()).rejects.toThrow('Не вдалося завантажити історію');
        });
    });

    describe('getUserStatistics', () => {
        it('should fetch user statistics successfully', async () => {
            const mockStats = {
                totalAnalyses: 10,
                completedAnalyses: 8,
                failedAnalyses: 2,
                totalViolations: 50,
                uniqueRepositories: 5,
            };

            localStorageMock.getItem.mockReturnValueOnce('valid-token');
            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockStats),
            } as Response);

            const stats = await getUserStatistics();

            expect(stats).toEqual(mockStats);
        });

        it('should throw error when not authenticated', async () => {
            localStorageMock.getItem.mockReturnValueOnce(null);

            await expect(getUserStatistics()).rejects.toThrow('Не авторизовано');
        });
    });

    describe('getUserSettings', () => {
        it('should fetch user settings successfully', async () => {
            const mockSettings = {
                lineLength: 120,
                avoidStarImport: true,
                charset: 'UTF-8',
            };

            localStorageMock.getItem.mockReturnValueOnce('valid-token');
            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockSettings),
            } as Response);

            const settings = await getUserSettings();

            expect(settings.lineLength).toBe(120);
            expect(settings.avoidStarImport).toBe(true);
        });

        it('should throw error when not authenticated', async () => {
            localStorageMock.getItem.mockReturnValueOnce(null);

            await expect(getUserSettings()).rejects.toThrow('Не авторизовано');
        });
    });

    describe('updateUserSettings', () => {
        it('should update user settings successfully', async () => {
            const updatedSettings = {
                lineLength: 150,
                avoidStarImport: false,
            };

            localStorageMock.getItem.mockReturnValueOnce('valid-token');
            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(updatedSettings),
            } as Response);

            const result = await updateUserSettings({ lineLength: 150 });

            expect(result.lineLength).toBe(150);
            expect(global.fetch).toHaveBeenCalledWith(
                `${BACKEND_URL}/api/user/settings`,
                expect.objectContaining({
                    method: 'PUT',
                    headers: {
                        Authorization: 'Bearer valid-token',
                        'Content-Type': 'application/json',
                    },
                })
            );
        });

        it('should throw error when not authenticated', async () => {
            localStorageMock.getItem.mockReturnValueOnce(null);

            await expect(updateUserSettings({ lineLength: 150 })).rejects.toThrow('Не авторизовано');
        });
    });

    describe('updateExperienceLevel', () => {
        it('should update experience level successfully', async () => {
            const mockUser: User = {
                username: 'testuser',
                email: 'test@example.com',
                role: 'USER',
                experienceLevel: 'STUDENT',
            };

            localStorageMock.getItem
                .mockReturnValueOnce('valid-token')
                .mockReturnValueOnce(JSON.stringify(mockUser));

            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ ...mockUser, experienceLevel: 'ADVANCED' }),
            } as Response);

            const result = await updateExperienceLevel('ADVANCED');

            expect(result.experienceLevel).toBe('ADVANCED');
            expect(global.fetch).toHaveBeenCalledWith(
                `${BACKEND_URL}/api/user/profile/experience`,
                expect.objectContaining({
                    method: 'PATCH',
                })
            );
        });

        it('should throw error when not authenticated', async () => {
            localStorageMock.getItem.mockReturnValueOnce(null);

            await expect(updateExperienceLevel('ADVANCED')).rejects.toThrow('Не авторизовано');
        });

        it('should throw error when update fails', async () => {
            localStorageMock.getItem.mockReturnValueOnce('valid-token');
            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: false,
            } as Response);

            await expect(updateExperienceLevel('ADVANCED')).rejects.toThrow(
                'Не вдалося оновити рівень досвіду'
            );
        });
    });
});
