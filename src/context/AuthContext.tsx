/**
 * Authentication Context
 * 
 * Provides authentication state and methods throughout the application.
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { 
    getUser, 
    isAuthenticated as checkAuth,
    login as authLogin,
    register as authRegister,
    logout as authLogout,
    type User, 
    type LoginRequest, 
    type RegisterRequest, 
    type AuthResponse
} from '../services/auth';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (data: LoginRequest) => Promise<AuthResponse>;
    register: (data: RegisterRequest) => Promise<AuthResponse>;
    logout: () => void;
    updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check if user is already logged in on mount
        const storedUser = getUser();
        if (storedUser && checkAuth()) {
            setUser(storedUser);
        }
        setIsLoading(false);
    }, []);

    const login = async (data: LoginRequest): Promise<AuthResponse> => {
        const response = await authLogin(data);
        setUser({
            username: response.username,
            email: response.email,
            role: response.role,
            experienceLevel: response.experienceLevel
        });
        return response;
    };

    const register = async (data: RegisterRequest): Promise<AuthResponse> => {
        const response = await authRegister(data);
        setUser({
            username: response.username,
            email: response.email,
            role: response.role,
            experienceLevel: response.experienceLevel
        });
        return response;
    };

    const logout = () => {
        authLogout();
        setUser(null);
    };

    const updateUser = (updates: Partial<User>) => {
        if (user) {
            setUser({ ...user, ...updates });
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            isLoading,
            login,
            register,
            logout,
            updateUser
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
