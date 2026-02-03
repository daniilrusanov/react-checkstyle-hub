/**
 * Theme Toggle Component
 * 
 * A button that switches between light and dark themes.
 * Shows sun icon for light mode, moon icon for dark mode.
 */

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme, getThemeColors } from '../context/ThemeContext';

export const ThemeToggle: React.FC = () => {
    const { isDark, toggleTheme } = useTheme();
    const colors = getThemeColors(isDark);

    return (
        <button
            onClick={toggleTheme}
            title={isDark ? 'Увімкнути світлу тему' : 'Увімкнути темну тему'}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '48px',
                background: isDark 
                    ? 'rgba(255, 255, 255, 0.02)' 
                    : 'rgba(0, 0, 0, 0.03)',
                backdropFilter: 'blur(40px)',
                border: `1px solid ${colors.borderPrimary}`,
                borderRadius: '12px',
                boxShadow: isDark 
                    ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                    : '0 4px 12px rgba(0, 0, 0, 0.1)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                flexShrink: 0,
                position: 'relative',
                overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = isDark 
                    ? 'rgba(147, 197, 253, 0.1)' 
                    : 'rgba(251, 191, 36, 0.15)';
                e.currentTarget.style.borderColor = isDark 
                    ? 'rgba(147, 197, 253, 0.3)' 
                    : 'rgba(251, 191, 36, 0.4)';
                e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = isDark 
                    ? 'rgba(255, 255, 255, 0.02)' 
                    : 'rgba(0, 0, 0, 0.03)';
                e.currentTarget.style.borderColor = colors.borderPrimary;
                e.currentTarget.style.transform = 'scale(1)';
            }}
            onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.95)';
            }}
            onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
            }}
        >
            {isDark ? (
                <Moon 
                    style={{ 
                        width: '22px', 
                        height: '22px', 
                        color: 'rgb(147, 197, 253)',
                        transition: 'transform 0.3s ease'
                    }} 
                />
            ) : (
                <Sun 
                    style={{ 
                        width: '22px', 
                        height: '22px', 
                        color: 'rgb(251, 191, 36)',
                        transition: 'transform 0.3s ease'
                    }} 
                />
            )}
        </button>
    );
};
