/**
 * User Menu Component
 * 
 * Displays user info and provides logout functionality.
 */

import { useState } from 'react';
import { User, LogOut, ChevronDown, BarChart3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme, getThemeColors } from '../context/ThemeContext';

interface UserMenuProps {
    onShowHistory?: () => void;
}

export const UserMenu = ({ onShowHistory }: UserMenuProps) => {
    const { user, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const { isDark } = useTheme();
    const colors = getThemeColors(isDark);

    if (!user) return null;

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 20px',
                    background: colors.bgCard,
                    backdropFilter: 'blur(40px)',
                    border: `1px solid ${colors.borderPrimary}`,
                    borderRadius: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = colors.bgCardHover;
                    e.currentTarget.style.borderColor = colors.borderAccent;
                }}
                onMouseLeave={(e) => {
                    if (!isOpen) {
                        e.currentTarget.style.background = colors.bgCard;
                        e.currentTarget.style.borderColor = colors.borderPrimary;
                    }
                }}
            >
                <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgb(59, 130, 246), rgb(37, 99, 235))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <User size={18} color="white" />
                </div>
                <div style={{ textAlign: 'left' }}>
                    <div style={{ 
                        fontSize: '15px', 
                        fontWeight: '600', 
                        color: colors.textPrimary 
                    }}>
                        {user.username}
                    </div>
                    <div style={{ 
                        fontSize: '12px', 
                        color: colors.textSecondary 
                    }}>
                        {user.role === 'ADMIN' ? 'Адміністратор' : 'Користувач'}
                    </div>
                </div>
                <ChevronDown 
                    size={18} 
                    style={{ 
                        color: colors.textSecondary,
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s'
                    }} 
                />
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div 
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 40
                        }}
                        onClick={() => setIsOpen(false)}
                    />
                    
                    {/* Dropdown menu */}
                    <div style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        right: 0,
                        minWidth: '220px',
                        background: isDark ? 'rgb(15, 23, 42)' : 'rgb(255, 255, 255)',
                        border: `1px solid ${colors.borderSecondary}`,
                        borderRadius: '16px',
                        boxShadow: isDark 
                            ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                            : '0 15px 35px rgba(0, 0, 0, 0.15)',
                        overflow: 'hidden',
                        zIndex: 50,
                        animation: 'fadeIn 0.2s ease-out'
                    }}>
                        {/* User info */}
                        <div style={{
                            padding: '16px',
                            borderBottom: `1px solid ${colors.borderSecondary}`
                        }}>
                            <div style={{ 
                                fontSize: '14px', 
                                color: colors.textSecondary,
                                marginBottom: '4px'
                            }}>
                                Увійшли як
                            </div>
                            <div style={{ 
                                fontSize: '15px', 
                                fontWeight: '600', 
                                color: colors.textPrimary,
                                wordBreak: 'break-all'
                            }}>
                                {user.email}
                            </div>
                        </div>

                        {/* Menu items */}
                        <div style={{ padding: '8px' }}>
                            {onShowHistory && (
                                <button
                                    onClick={() => {
                                        onShowHistory();
                                        setIsOpen(false);
                                    }}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '12px',
                                        background: 'transparent',
                                        border: 'none',
                                        borderRadius: '10px',
                                        color: colors.textSecondary,
                                        fontSize: '15px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = isDark 
                                            ? 'rgba(255, 255, 255, 0.05)'
                                            : 'rgba(0, 0, 0, 0.05)';
                                        e.currentTarget.style.color = colors.textPrimary;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = colors.textSecondary;
                                    }}
                                >
                                    <BarChart3 size={18} />
                                    Панель користувача
                                </button>
                            )}

                            <button
                                onClick={() => {
                                    logout();
                                    setIsOpen(false);
                                }}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px',
                                    background: 'transparent',
                                    border: 'none',
                                    borderRadius: '10px',
                                    color: colors.error,
                                    fontSize: '15px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = isDark 
                                        ? 'rgba(239, 68, 68, 0.1)'
                                        : 'rgba(220, 38, 38, 0.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                <LogOut size={18} />
                                Вийти
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
