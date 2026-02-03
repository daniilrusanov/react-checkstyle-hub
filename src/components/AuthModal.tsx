/**
 * Authentication Modal Component
 * 
 * Combined login/register modal with tab switching.
 */

import { useState } from 'react';
import { X, User, Mail, Lock, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme, getThemeColors } from '../context/ThemeContext';
import toast from 'react-hot-toast';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialTab?: 'login' | 'register';
}

export const AuthModal = ({ isOpen, onClose, initialTab = 'login' }: AuthModalProps) => {
    const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Login form state
    const [loginUsername, setLoginUsername] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    
    // Register form state
    const [registerUsername, setRegisterUsername] = useState('');
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
    
    const { login, register } = useAuth();
    const { isDark } = useTheme();
    const colors = getThemeColors(isDark);

    if (!isOpen) return null;

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await login({ username: loginUsername, password: loginPassword });
            toast.success('Успішний вхід!');
            onClose();
            resetForms();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Помилка входу');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (registerPassword !== registerConfirmPassword) {
            toast.error('Паролі не співпадають');
            return;
        }

        if (registerPassword.length < 6) {
            toast.error('Пароль має бути не менше 6 символів');
            return;
        }

        setIsSubmitting(true);

        try {
            await register({
                username: registerUsername,
                email: registerEmail,
                password: registerPassword
            });
            toast.success('Реєстрація успішна!');
            onClose();
            resetForms();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Помилка реєстрації');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForms = () => {
        setLoginUsername('');
        setLoginPassword('');
        setRegisterUsername('');
        setRegisterEmail('');
        setRegisterPassword('');
        setRegisterConfirmPassword('');
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '14px 16px 14px 48px',
        background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
        border: `1px solid ${colors.borderSecondary}`,
        borderRadius: '12px',
        color: colors.textPrimary,
        fontSize: '16px',
        outline: 'none',
        transition: 'all 0.2s'
    };

    const buttonStyle: React.CSSProperties = {
        width: '100%',
        padding: '16px',
        background: 'linear-gradient(135deg, rgb(59, 130, 246), rgb(37, 99, 235))',
        border: 'none',
        borderRadius: '12px',
        color: 'white',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'all 0.2s'
    };

    return (
        <div 
            style={{
                position: 'fixed',
                inset: 0,
                background: colors.bgOverlay,
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '20px'
            }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div style={{
                width: '100%',
                maxWidth: '440px',
                background: isDark 
                    ? 'linear-gradient(to bottom right, rgb(15, 23, 42), rgb(30, 41, 59))'
                    : 'linear-gradient(to bottom right, rgb(255, 255, 255), rgb(248, 250, 252))',
                borderRadius: '24px',
                border: `1px solid ${colors.borderSecondary}`,
                boxShadow: isDark 
                    ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    : '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    padding: '24px',
                    borderBottom: `1px solid ${colors.borderSecondary}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h2 style={{ 
                        fontSize: '24px', 
                        fontWeight: 'bold', 
                        color: colors.textPrimary,
                        margin: 0
                    }}>
                        {activeTab === 'login' ? 'Вхід' : 'Реєстрація'}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '8px',
                            cursor: 'pointer',
                            color: colors.textSecondary,
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
                            e.currentTarget.style.color = colors.textPrimary;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
                            e.currentTarget.style.color = colors.textSecondary;
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div style={{
                    display: 'flex',
                    borderBottom: `1px solid ${colors.borderSecondary}`
                }}>
                    <button
                        onClick={() => setActiveTab('login')}
                        style={{
                            flex: 1,
                            padding: '16px',
                            background: activeTab === 'login' 
                                ? (isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)')
                                : 'transparent',
                            border: 'none',
                            borderBottom: activeTab === 'login' ? '2px solid rgb(59, 130, 246)' : '2px solid transparent',
                            color: activeTab === 'login' ? colors.accentLight : colors.textSecondary,
                            fontSize: '15px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                    >
                        <LogIn size={18} />
                        Вхід
                    </button>
                    <button
                        onClick={() => setActiveTab('register')}
                        style={{
                            flex: 1,
                            padding: '16px',
                            background: activeTab === 'register' 
                                ? (isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)')
                                : 'transparent',
                            border: 'none',
                            borderBottom: activeTab === 'register' ? '2px solid rgb(59, 130, 246)' : '2px solid transparent',
                            color: activeTab === 'register' ? colors.accentLight : colors.textSecondary,
                            fontSize: '15px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                    >
                        <UserPlus size={18} />
                        Реєстрація
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '24px' }}>
                    {activeTab === 'login' ? (
                        <form onSubmit={handleLogin}>
                            <div style={{ marginBottom: '16px', position: 'relative' }}>
                                <User 
                                    size={20} 
                                    style={{ 
                                        position: 'absolute', 
                                        left: '16px', 
                                        top: '50%', 
                                        transform: 'translateY(-50%)',
                                        color: colors.textSecondary
                                    }} 
                                />
                                <input
                                    type="text"
                                    placeholder="Ім'я користувача"
                                    value={loginUsername}
                                    onChange={(e) => setLoginUsername(e.target.value)}
                                    required
                                    style={inputStyle}
                                    onFocus={(e) => {
                                        e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.borderColor = colors.borderSecondary;
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                />
                            </div>
                            <div style={{ marginBottom: '24px', position: 'relative' }}>
                                <Lock 
                                    size={20} 
                                    style={{ 
                                        position: 'absolute', 
                                        left: '16px', 
                                        top: '50%', 
                                        transform: 'translateY(-50%)',
                                        color: colors.textSecondary
                                    }} 
                                />
                                <input
                                    type="password"
                                    placeholder="Пароль"
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                    required
                                    style={inputStyle}
                                    onFocus={(e) => {
                                        e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.borderColor = colors.borderSecondary;
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                style={{
                                    ...buttonStyle,
                                    opacity: isSubmitting ? 0.7 : 1,
                                    cursor: isSubmitting ? 'not-allowed' : 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSubmitting) {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 10px 20px rgba(59, 130, 246, 0.3)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                {isSubmitting ? (
                                    <div className="animate-spin" style={{
                                        width: '20px',
                                        height: '20px',
                                        border: '2px solid rgba(255, 255, 255, 0.3)',
                                        borderTopColor: 'white',
                                        borderRadius: '50%'
                                    }} />
                                ) : (
                                    <>
                                        <LogIn size={20} />
                                        Увійти
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleRegister}>
                            <div style={{ marginBottom: '16px', position: 'relative' }}>
                                <User 
                                    size={20} 
                                    style={{ 
                                        position: 'absolute', 
                                        left: '16px', 
                                        top: '50%', 
                                        transform: 'translateY(-50%)',
                                        color: colors.textSecondary
                                    }} 
                                />
                                <input
                                    type="text"
                                    placeholder="Ім'я користувача"
                                    value={registerUsername}
                                    onChange={(e) => setRegisterUsername(e.target.value)}
                                    required
                                    minLength={3}
                                    style={inputStyle}
                                    onFocus={(e) => {
                                        e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.borderColor = colors.borderSecondary;
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                />
                            </div>
                            <div style={{ marginBottom: '16px', position: 'relative' }}>
                                <Mail 
                                    size={20} 
                                    style={{ 
                                        position: 'absolute', 
                                        left: '16px', 
                                        top: '50%', 
                                        transform: 'translateY(-50%)',
                                        color: colors.textSecondary
                                    }} 
                                />
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={registerEmail}
                                    onChange={(e) => setRegisterEmail(e.target.value)}
                                    required
                                    style={inputStyle}
                                    onFocus={(e) => {
                                        e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.borderColor = colors.borderSecondary;
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                />
                            </div>
                            <div style={{ marginBottom: '16px', position: 'relative' }}>
                                <Lock 
                                    size={20} 
                                    style={{ 
                                        position: 'absolute', 
                                        left: '16px', 
                                        top: '50%', 
                                        transform: 'translateY(-50%)',
                                        color: colors.textSecondary
                                    }} 
                                />
                                <input
                                    type="password"
                                    placeholder="Пароль"
                                    value={registerPassword}
                                    onChange={(e) => setRegisterPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    style={inputStyle}
                                    onFocus={(e) => {
                                        e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.borderColor = colors.borderSecondary;
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                />
                            </div>
                            <div style={{ marginBottom: '24px', position: 'relative' }}>
                                <Lock 
                                    size={20} 
                                    style={{ 
                                        position: 'absolute', 
                                        left: '16px', 
                                        top: '50%', 
                                        transform: 'translateY(-50%)',
                                        color: colors.textSecondary
                                    }} 
                                />
                                <input
                                    type="password"
                                    placeholder="Підтвердіть пароль"
                                    value={registerConfirmPassword}
                                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                                    required
                                    style={inputStyle}
                                    onFocus={(e) => {
                                        e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.borderColor = colors.borderSecondary;
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                style={{
                                    ...buttonStyle,
                                    opacity: isSubmitting ? 0.7 : 1,
                                    cursor: isSubmitting ? 'not-allowed' : 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSubmitting) {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 10px 20px rgba(59, 130, 246, 0.3)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                {isSubmitting ? (
                                    <div className="animate-spin" style={{
                                        width: '20px',
                                        height: '20px',
                                        border: '2px solid rgba(255, 255, 255, 0.3)',
                                        borderTopColor: 'white',
                                        borderRadius: '50%'
                                    }} />
                                ) : (
                                    <>
                                        <UserPlus size={20} />
                                        Зареєструватися
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {/* Demo credentials hint */}
                    {activeTab === 'login' && (
                        <div style={{
                            marginTop: '20px',
                            padding: '16px',
                            background: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                            borderRadius: '12px',
                            border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.25)'}`
                        }}>
                            <p style={{ 
                                color: colors.accentLighter, 
                                fontSize: '14px',
                                margin: 0,
                                lineHeight: '1.5'
                            }}>
                                <strong>Тестовий акаунт:</strong><br />
                                Логін: <code style={{ 
                                    background: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.08)', 
                                    padding: '2px 6px', 
                                    borderRadius: '4px' 
                                }}>admin</code><br />
                                Пароль: <code style={{ 
                                    background: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.08)', 
                                    padding: '2px 6px', 
                                    borderRadius: '4px' 
                                }}>admin123</code>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
