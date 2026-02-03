/**
 * Theme Context
 * 
 * Provides theme state and toggle functionality throughout the application.
 * Supports light and dark themes with persistence in localStorage.
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = 'checkstyle_hub_theme';

interface ThemeProviderProps {
    children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
    const [theme, setTheme] = useState<Theme>(() => {
        // Check localStorage first
        const savedTheme = localStorage.getItem(THEME_KEY);
        if (savedTheme === 'light' || savedTheme === 'dark') {
            return savedTheme;
        }
        // Default to dark theme
        return 'dark';
    });

    useEffect(() => {
        // Save theme to localStorage
        localStorage.setItem(THEME_KEY, theme);
        
        // Apply theme class to document
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    return (
        <ThemeContext.Provider value={{
            theme,
            toggleTheme,
            isDark: theme === 'dark'
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

/**
 * Theme color definitions
 */
export const themeColors = {
    dark: {
        // Backgrounds
        bgPrimary: 'rgb(2, 6, 23)',
        bgSecondary: 'rgb(15, 23, 42)',
        bgCard: 'rgba(255, 255, 255, 0.02)',
        bgCardHover: 'rgba(255, 255, 255, 0.05)',
        bgModal: 'rgba(15, 15, 25, 0.98)',
        bgInput: 'rgba(255, 255, 255, 0.05)',
        bgOverlay: 'rgba(0, 0, 0, 0.85)',
        
        // Text
        textPrimary: 'white',
        textSecondary: 'rgb(148, 163, 184)',
        textMuted: 'rgb(100, 116, 139)',
        
        // Borders
        borderPrimary: 'rgba(255, 255, 255, 0.05)',
        borderSecondary: 'rgba(255, 255, 255, 0.1)',
        borderAccent: 'rgba(59, 130, 246, 0.3)',
        
        // Accents
        accent: 'rgb(59, 130, 246)',
        accentLight: 'rgb(96, 165, 250)',
        accentLighter: 'rgb(147, 197, 253)',
        
        // Status colors
        success: 'rgb(34, 197, 94)',
        warning: 'rgb(251, 191, 36)',
        error: 'rgb(239, 68, 68)',
        
        // Grid overlay
        gridColor: 'rgba(59, 130, 246, 0.5)',
        gridOpacity: 0.03,
    },
    light: {
        // Backgrounds
        bgPrimary: 'rgb(248, 250, 252)',
        bgSecondary: 'rgb(241, 245, 249)',
        bgCard: 'rgba(255, 255, 255, 0.9)',
        bgCardHover: 'rgba(255, 255, 255, 1)',
        bgModal: 'rgba(255, 255, 255, 0.98)',
        bgInput: 'rgba(0, 0, 0, 0.03)',
        bgOverlay: 'rgba(0, 0, 0, 0.5)',
        
        // Text
        textPrimary: 'rgb(15, 23, 42)',
        textSecondary: 'rgb(71, 85, 105)',
        textMuted: 'rgb(100, 116, 139)',
        
        // Borders
        borderPrimary: 'rgba(0, 0, 0, 0.08)',
        borderSecondary: 'rgba(0, 0, 0, 0.12)',
        borderAccent: 'rgba(59, 130, 246, 0.4)',
        
        // Accents
        accent: 'rgb(37, 99, 235)',
        accentLight: 'rgb(59, 130, 246)',
        accentLighter: 'rgb(96, 165, 250)',
        
        // Status colors
        success: 'rgb(22, 163, 74)',
        warning: 'rgb(234, 179, 8)',
        error: 'rgb(220, 38, 38)',
        
        // Grid overlay
        gridColor: 'rgba(59, 130, 246, 0.5)',
        gridOpacity: 0.08,
    }
};

/**
 * Get current theme colors
 */
export const getThemeColors = (isDark: boolean) => isDark ? themeColors.dark : themeColors.light;
