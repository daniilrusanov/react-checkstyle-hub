/**
 * Authentication Service
 * 
 * Handles user authentication, registration, and token management.
 */

import { BACKEND_URL } from '../config';

/**
 * Experience level options.
 */
export type ExperienceLevel = 'STUDENT' | 'JUNIOR' | 'ADVANCED';

/**
 * User data returned after authentication.
 */
export type User = {
    username: string;
    email: string;
    role: string;
    experienceLevel: ExperienceLevel;
};

/**
 * Authentication response from the server.
 */
export type AuthResponse = {
    token: string;
    username: string;
    email: string;
    role: string;
    experienceLevel: ExperienceLevel;
};

/**
 * Registration request data.
 */
export type RegisterRequest = {
    username: string;
    email: string;
    password: string;
};

/**
 * Login request data.
 */
export type LoginRequest = {
    username: string;
    password: string;
};

/**
 * User statistics.
 */
export type UserStatistics = {
    totalAnalyses: number;
    completedAnalyses: number;
    failedAnalyses: number;
    totalViolations: number;
    uniqueRepositories: number;
};

/**
 * Analysis history item.
 */
export type AnalysisHistoryItem = {
    id: number;
    status: string;
    errorMessage: string | null;
    createdAt: string;
    repoUrl: string;
    violationsCount: number | null;
};

/**
 * User Checkstyle settings.
 */
export type UserCheckstyleSettings = {
    charset: string;
    severity: string;
    fileExtensions: string;
    lineLength: number;
    lineLengthIgnorePattern: string;
    avoidStarImport: boolean;
    oneTopLevelClass: boolean;
    noLineWrap: boolean;
    emptyBlock: boolean;
    needBraces: boolean;
    leftCurly: boolean;
    rightCurly: boolean;
    emptyStatement: boolean;
    equalsHashCode: boolean;
    illegalInstantiation: boolean;
    missingSwitchDefault: boolean;
    simplifyBooleanExpression: boolean;
    simplifyBooleanReturn: boolean;
    finalClass: boolean;
    hideUtilityClassConstructor: boolean;
    interfaceIsType: boolean;
    visibilityModifier: boolean;
    outerTypeFilename: boolean;
    illegalTokenText: boolean;
    avoidEscapedUnicodeCharacters: boolean;
};

const TOKEN_KEY = 'checkstyle_hub_token';
const USER_KEY = 'checkstyle_hub_user';

/**
 * Get stored authentication token.
 */
export const getToken = (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
};

/**
 * Get stored user data.
 */
export const getUser = (): User | null => {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
};

/**
 * Store authentication data.
 */
const storeAuthData = (response: AuthResponse): void => {
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify({
        username: response.username,
        email: response.email,
        role: response.role,
        experienceLevel: response.experienceLevel
    }));
};

/**
 * Update stored user data (without changing token).
 */
export const updateStoredUser = (updates: Partial<User>): User | null => {
    const currentUser = getUser();
    if (!currentUser) return null;
    
    const updatedUser = { ...currentUser, ...updates };
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    return updatedUser;
};

/**
 * Clear authentication data.
 */
export const clearAuthData = (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
};

/**
 * Check if user is authenticated.
 */
export const isAuthenticated = (): boolean => {
    return !!getToken();
};

/**
 * Get authorization headers for API requests.
 */
export const getAuthHeaders = (): HeadersInit => {
    const token = getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

/**
 * Register a new user.
 */
export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.username || error.email || error.password || 'Помилка реєстрації');
    }

    const authResponse = await response.json() as AuthResponse;
    storeAuthData(authResponse);
    return authResponse;
};

/**
 * Login user.
 */
export const login = async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Невірне ім\'я користувача або пароль');
    }

    const authResponse = await response.json() as AuthResponse;
    storeAuthData(authResponse);
    return authResponse;
};

/**
 * Logout user.
 */
export const logout = (): void => {
    clearAuthData();
};

/**
 * Get current user from server (validates token).
 */
export const getCurrentUser = async (): Promise<User | null> => {
    const token = getToken();
    if (!token) return null;

    try {
        const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            clearAuthData();
            return null;
        }

        return await response.json() as User;
    } catch {
        clearAuthData();
        return null;
    }
};

/**
 * Get user's analysis history.
 */
export const getAnalysisHistory = async (): Promise<AnalysisHistoryItem[]> => {
    const token = getToken();
    if (!token) throw new Error('Не авторизовано');

    const response = await fetch(`${BACKEND_URL}/api/user/history`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Не вдалося завантажити історію');
    }

    return await response.json() as AnalysisHistoryItem[];
};

/**
 * Get user's statistics.
 */
export const getUserStatistics = async (): Promise<UserStatistics> => {
    const token = getToken();
    if (!token) throw new Error('Не авторизовано');

    const response = await fetch(`${BACKEND_URL}/api/user/statistics`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Не вдалося завантажити статистику');
    }

    return await response.json() as UserStatistics;
};

/**
 * Get user's Checkstyle settings.
 */
export const getUserSettings = async (): Promise<UserCheckstyleSettings> => {
    const token = getToken();
    if (!token) throw new Error('Не авторизовано');

    const response = await fetch(`${BACKEND_URL}/api/user/settings`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Не вдалося завантажити налаштування');
    }

    return await response.json() as UserCheckstyleSettings;
};

/**
 * Update user's Checkstyle settings.
 */
export const updateUserSettings = async (settings: Partial<UserCheckstyleSettings>): Promise<UserCheckstyleSettings> => {
    const token = getToken();
    if (!token) throw new Error('Не авторизовано');

    const response = await fetch(`${BACKEND_URL}/api/user/settings`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
    });

    if (!response.ok) {
        throw new Error('Не вдалося зберегти налаштування');
    }

    return await response.json() as UserCheckstyleSettings;
};

/**
 * Update user's experience level.
 * Returns the updated user data.
 */
export const updateExperienceLevel = async (experienceLevel: ExperienceLevel): Promise<User> => {
    const token = getToken();
    if (!token) throw new Error('Не авторизовано');

    const response = await fetch(`${BACKEND_URL}/api/user/profile/experience`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ experienceLevel })
    });

    if (!response.ok) {
        throw new Error('Не вдалося оновити рівень досвіду');
    }

    // Update localStorage with new experience level
    const updatedUser = updateStoredUser({ experienceLevel });
    if (!updatedUser) {
        throw new Error('Не вдалося оновити дані користувача');
    }
    
    return updatedUser;
};
