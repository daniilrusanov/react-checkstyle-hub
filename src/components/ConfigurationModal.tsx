/**
 * Configuration Modal Component
 * 
 * A comprehensive modal dialog for managing Checkstyle configuration settings.
 * Provides an intuitive interface for enabling/disabling code quality rules
 * and adjusting general analysis parameters.
 */

import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw, CheckCircle, XCircle, Loader2, Settings2, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { getConfiguration, updateConfiguration, type CheckstyleConfig, type UpdateConfigDto } from '../services/configuration';
import { getUserSettings, updateUserSettings, updateExperienceLevel, type ExperienceLevel } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import { useTheme, getThemeColors } from '../context/ThemeContext';
import { CHECKSTYLE_RULES, RULE_CATEGORIES, getRulesByCategory } from '../data/checkstyleRules';

/**
 * Props for the ConfigurationModal component
 */
interface ConfigurationModalProps {
    /** Controls whether the modal is visible */
    isOpen: boolean;
    /** Callback invoked when the modal should close */
    onClose: () => void;
}

/**
 * Modal component for managing Checkstyle configuration
 * 
 * Features:
 * - Load and display current configuration
 * - Toggle individual Checkstyle rules
 * - Bulk enable/disable all rules
 * - Adjust general settings (severity, line length, etc.)
 * - Save changes to backend
 * - Reset to server state
 */
export const ConfigurationModal: React.FC<ConfigurationModalProps> = ({ isOpen, onClose }) => {
    /** Loading state for initial configuration fetch */
    const [isLoading, setIsLoading] = useState(false);
    /** Loading state for save operation */
    const [isSaving, setIsSaving] = useState(false);
    /** Current configuration state (local edits) */
    const [config, setConfig] = useState<CheckstyleConfig | null>(null);
    /** User experience level */
    const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('STUDENT');
    
    /** Auth context */
    const { isAuthenticated, user, updateUser } = useAuth();
    
    /** Theme context */
    const { isDark } = useTheme();
    const colors = getThemeColors(isDark);

    /**
     * Disable body scroll when modal is open
     */
    useEffect(() => {
        if (isOpen) {
            document.documentElement.classList.add('modal-open');
        } else {
            document.documentElement.classList.remove('modal-open');
        }
        return () => {
            document.documentElement.classList.remove('modal-open');
        };
    }, [isOpen]);

    /**
     * Load configuration when modal opens or auth state changes
     */
    useEffect(() => {
        if (isOpen) {
            loadConfiguration();
        }
    }, [isOpen, isAuthenticated, user?.username]);

    /**
     * Fetches the current configuration from the backend
     * For logged-in users, loads their saved settings
     * For guests, loads default server config with all rules enabled
     */
    const loadConfiguration = async () => {
        setIsLoading(true);
        try {
            // First load the server config
            const serverConfig = await getConfiguration();
            
            // If user is logged in, overlay their settings and load experience level
            if (isAuthenticated && user) {
                setExperienceLevel(user.experienceLevel);
                try {
                    const userSettings = await getUserSettings();
                    setConfig({
                        ...serverConfig,
                        ...userSettings
                    });
                } catch {
                    // User settings not found, use server config
                    setConfig(serverConfig);
                }
            } else {
                // For guests, reset experience level and use server config
                setExperienceLevel('STUDENT');
                setConfig(serverConfig);
            }
        } catch (error) {
            toast.error(`Помилка завантаження: ${(error as Error).message}`);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Updates user experience level (local state only, saved with handleSave)
     */
    const handleExperienceLevelChange = (level: ExperienceLevel) => {
        setExperienceLevel(level);
    };

    /**
     * Saves the current configuration state to the backend
     * For logged-in users, also saves to their user settings
     * Shows success/error notifications
     */
    const handleSave = async () => {
        if (!config) return;

        setIsSaving(true);
        try {
            const updateDto: UpdateConfigDto = {
                charset: config.charset,
                severity: config.severity,
                lineLength: config.lineLength,
                avoidStarImport: config.avoidStarImport,
                oneTopLevelClass: config.oneTopLevelClass,
                noLineWrap: config.noLineWrap,
                emptyBlock: config.emptyBlock,
                needBraces: config.needBraces,
                leftCurly: config.leftCurly,
                rightCurly: config.rightCurly,
                emptyStatement: config.emptyStatement,
                equalsHashCode: config.equalsHashCode,
                illegalInstantiation: config.illegalInstantiation,
                missingSwitchDefault: config.missingSwitchDefault,
                simplifyBooleanExpression: config.simplifyBooleanExpression,
                simplifyBooleanReturn: config.simplifyBooleanReturn,
                finalClass: config.finalClass,
                hideUtilityClassConstructor: config.hideUtilityClassConstructor,
                interfaceIsType: config.interfaceIsType,
                visibilityModifier: config.visibilityModifier,
                outerTypeFilename: config.outerTypeFilename,
                illegalTokenText: config.illegalTokenText,
                avoidEscapedUnicodeCharacters: config.avoidEscapedUnicodeCharacters,
            };

            // Save to server config
            const updated = await updateConfiguration(updateDto);
            setConfig(updated);

            // If logged in, also save to user settings and experience level
            if (isAuthenticated) {
                await updateUserSettings(updateDto);
                
                // Save experience level if it changed
                if (user && experienceLevel !== user.experienceLevel) {
                    try {
                        const updatedUser = await updateExperienceLevel(experienceLevel);
                        updateUser({ experienceLevel: updatedUser.experienceLevel });
                    } catch {
                        // Experience level save failed, but settings were saved
                        toast.error('Не вдалося оновити рівень досвіду');
                    }
                }
                
                toast.success('Налаштування збережено до вашого профілю!');
            } else {
                toast.success('Конфігурацію успішно збережено!');
            }
        } catch (error) {
            toast.error(`Помилка збереження: ${(error as Error).message}`);
        } finally {
            setIsSaving(false);
        }
    };

    /**
     * Resets the configuration to the last saved state
     * by reloading from the server
     */
    const handleReset = () => {
        loadConfiguration();
        toast.success('Конфігурацію скинуто');
    };

    /**
     * Enables all boolean Checkstyle rules at once
     * Useful for strict code quality enforcement
     */
    const handleEnableAll = () => {
        if (!config) return;
        setConfig({
            ...config,
            avoidStarImport: true,
            oneTopLevelClass: true,
            noLineWrap: true,
            emptyBlock: true,
            needBraces: true,
            leftCurly: true,
            rightCurly: true,
            emptyStatement: true,
            equalsHashCode: true,
            illegalInstantiation: true,
            missingSwitchDefault: true,
            simplifyBooleanExpression: true,
            simplifyBooleanReturn: true,
            finalClass: true,
            hideUtilityClassConstructor: true,
            interfaceIsType: true,
            visibilityModifier: true,
            outerTypeFilename: true,
            illegalTokenText: true,
            avoidEscapedUnicodeCharacters: true,
        });
    };

    /**
     * Disables all boolean Checkstyle rules at once
     * Useful for minimal or gradual code quality adoption
     */
    const handleDisableAll = () => {
        if (!config) return;
        setConfig({
            ...config,
            avoidStarImport: false,
            oneTopLevelClass: false,
            noLineWrap: false,
            emptyBlock: false,
            needBraces: false,
            leftCurly: false,
            rightCurly: false,
            emptyStatement: false,
            equalsHashCode: false,
            illegalInstantiation: false,
            missingSwitchDefault: false,
            simplifyBooleanExpression: false,
            simplifyBooleanReturn: false,
            finalClass: false,
            hideUtilityClassConstructor: false,
            interfaceIsType: false,
            visibilityModifier: false,
            outerTypeFilename: false,
            illegalTokenText: false,
            avoidEscapedUnicodeCharacters: false,
        });
    };

    /**
     * Updates a single configuration field
     * 
     * @param field - The configuration field to update
     * @param value - The new value for the field
     */
    const updateField = (field: keyof CheckstyleConfig, value: CheckstyleConfig[keyof CheckstyleConfig]) => {
        if (!config) return;
        setConfig({ ...config, [field]: value });
    };

    /**
     * Counts how many boolean rules are currently enabled
     * Used for displaying statistics
     * 
     * @returns Number of enabled rules
     */
    const getEnabledRulesCount = (): number => {
        if (!config) return 0;
        const booleanFields = [
            'avoidStarImport', 'oneTopLevelClass', 'noLineWrap', 'emptyBlock',
            'needBraces', 'leftCurly', 'rightCurly', 'emptyStatement',
            'equalsHashCode', 'illegalInstantiation', 'missingSwitchDefault',
            'simplifyBooleanExpression', 'simplifyBooleanReturn', 'finalClass',
            'hideUtilityClassConstructor', 'interfaceIsType', 'visibilityModifier',
            'outerTypeFilename', 'illegalTokenText', 'avoidEscapedUnicodeCharacters'
        ];
        return booleanFields.filter(field => config[field as keyof CheckstyleConfig]).length;
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 99999,
                backgroundColor: colors.bgOverlay,
                backdropFilter: 'blur(8px)',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'flex-start',
                padding: '24px'
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: '672px',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    background: isDark 
                        ? 'rgba(15, 15, 25, 0.98)'
                        : 'rgba(255, 255, 255, 0.98)',
                    backdropFilter: 'blur(40px)',
                    border: `2px solid ${colors.borderAccent}`,
                    borderRadius: '16px',
                    boxShadow: isDark 
                        ? '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                        : '0 25px 50px -12px rgba(0, 0, 0, 0.2)',
                    marginTop: '16px',
                    animation: 'fadeIn 0.3s ease-out'
                }}
            >
                {/* Header - Fixed */}
                <div style={{
                    padding: '24px 32px',
                    borderBottom: `1px solid ${colors.borderPrimary}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: `linear-gradient(135deg, ${colors.accent}, ${isDark ? 'rgb(6, 182, 212)' : 'rgb(14, 165, 233)'})`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Settings2 style={{ width: '24px', height: '24px', color: 'white' }} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.textPrimary, margin: 0 }}>
                                Налаштування Checkstyle
                            </h2>
                            <p style={{ fontSize: '14px', color: colors.textSecondary, margin: 0 }}>
                                Керуйте правилами аналізу коду
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                            border: `1px solid ${colors.borderSecondary}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = isDark 
                                ? 'rgba(239, 68, 68, 0.2)'
                                : 'rgba(220, 38, 38, 0.1)';
                            e.currentTarget.style.borderColor = isDark 
                                ? 'rgba(239, 68, 68, 0.5)'
                                : 'rgba(220, 38, 38, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = isDark 
                                ? 'rgba(255, 255, 255, 0.05)'
                                : 'rgba(0, 0, 0, 0.05)';
                            e.currentTarget.style.borderColor = colors.borderSecondary;
                        }}
                    >
                        <X style={{ width: '20px', height: '20px', color: colors.error }} />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="custom-scrollbar" style={{
                    flex: 1,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    padding: '32px'
                }}>
                    {isLoading ? (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '64px 0'
                        }}>
                            <Loader2 className="animate-spin" style={{ width: '48px', height: '48px', color: colors.accentLight, marginBottom: '16px' }} />
                            <p style={{ fontSize: '16px', color: colors.textSecondary }}>Завантаження конфігурації...</p>
                        </div>
                    ) : config ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            {/* Info Box */}
                            <div style={{
                                padding: '12px 16px',
                                background: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                                border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.25)'}`,
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px',
                                flexWrap: 'wrap'
                            }}>
                                <span style={{ fontSize: '13px', color: colors.textSecondary }}>
                                    Оновлено: {new Date(config.updatedAt).toLocaleString('uk-UA')}
                                </span>
                            </div>

                            {/* Quick Actions */}
                            <div>
                                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: colors.textPrimary, marginBottom: '12px' }}>
                                    Швидкі дії
                                </h3>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button
                                        onClick={handleEnableAll}
                                        style={{
                                            flex: 1,
                                            padding: '12px 20px',
                                            background: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(22, 163, 74, 0.08)',
                                            border: `1px solid ${isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(22, 163, 74, 0.3)'}`,
                                            borderRadius: '8px',
                                            color: colors.success,
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(22, 163, 74, 0.15)';
                                            e.currentTarget.style.borderColor = isDark ? 'rgba(34, 197, 94, 0.5)' : 'rgba(22, 163, 74, 0.5)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(22, 163, 74, 0.08)';
                                            e.currentTarget.style.borderColor = isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(22, 163, 74, 0.3)';
                                        }}
                                    >
                                        <CheckCircle style={{ width: '16px', height: '16px' }} />
                                        Увімкнути всі
                                    </button>
                                    <button
                                        onClick={handleDisableAll}
                                        style={{
                                            flex: 1,
                                            padding: '12px 20px',
                                            background: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(220, 38, 38, 0.08)',
                                            border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(220, 38, 38, 0.3)'}`,
                                            borderRadius: '8px',
                                            color: colors.error,
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(220, 38, 38, 0.15)';
                                            e.currentTarget.style.borderColor = isDark ? 'rgba(239, 68, 68, 0.5)' : 'rgba(220, 38, 38, 0.5)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(220, 38, 38, 0.08)';
                                            e.currentTarget.style.borderColor = isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(220, 38, 38, 0.3)';
                                        }}
                                    >
                                        <XCircle style={{ width: '16px', height: '16px' }} />
                                        Вимкнути всі
                                    </button>
                                </div>
                            </div>

                            {/* Stats */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: '16px'
                            }}>
                                <div style={{
                                    padding: '20px 16px',
                                    background: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(22, 163, 74, 0.08)',
                                    border: `1px solid ${isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(22, 163, 74, 0.2)'}`,
                                    borderRadius: '12px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: colors.success, marginBottom: '6px', lineHeight: 1 }}>
                                        {getEnabledRulesCount()}
                                    </div>
                                    <div style={{ fontSize: '14px', color: colors.textSecondary }}>Активних правил</div>
                                </div>
                                <div style={{
                                    padding: '20px 16px',
                                    background: isDark ? 'rgba(251, 191, 36, 0.1)' : 'rgba(202, 138, 4, 0.08)',
                                    border: `1px solid ${isDark ? 'rgba(251, 191, 36, 0.2)' : 'rgba(202, 138, 4, 0.2)'}`,
                                    borderRadius: '12px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: colors.warning, marginBottom: '6px', lineHeight: 1 }}>
                                        {config.lineLength}
                                    </div>
                                    <div style={{ fontSize: '14px', color: colors.textSecondary }}>Символів у рядку</div>
                                </div>
                            </div>

                            {/* User Profile Settings - only for authenticated users */}
                            {isAuthenticated && (
                                <div>
                                    <h3 style={{
                                        fontSize: '18px',
                                        fontWeight: 'bold',
                                        color: colors.textPrimary,
                                        marginBottom: '16px',
                                        paddingBottom: '12px',
                                        borderBottom: `2px solid ${isDark ? 'rgba(168, 85, 247, 0.3)' : 'rgba(147, 51, 234, 0.3)'}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}>
                                        <User style={{ width: '20px', height: '20px', color: isDark ? 'rgb(168, 85, 247)' : 'rgb(147, 51, 234)' }} />
                                        Профіль користувача
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        {/* Experience Level */}
                                        <div>
                                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '12px' }}>
                                                Рівень досвіду
                                            </label>
                                            <div style={{ display: 'flex', gap: '12px' }}>
                                                {[
                                                    { value: 'STUDENT' as ExperienceLevel, label: 'Студент', color: isDark ? 'rgb(34, 197, 94)' : 'rgb(22, 163, 74)' },
                                                    { value: 'JUNIOR' as ExperienceLevel, label: 'Джун', color: 'rgb(59, 130, 246)' },
                                                    { value: 'ADVANCED' as ExperienceLevel, label: 'Просунутий', color: isDark ? 'rgb(168, 85, 247)' : 'rgb(147, 51, 234)' }
                                                ].map((option) => (
                                                    <button
                                                        key={option.value}
                                                        type="button"
                                                        onClick={() => handleExperienceLevelChange(option.value)}
                                                        style={{
                                                            flex: 1,
                                                            padding: '14px 16px',
                                                            background: experienceLevel === option.value 
                                                                ? `${option.color}20` 
                                                                : (isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)'),
                                                            border: `2px solid ${experienceLevel === option.value 
                                                                ? option.color 
                                                                : colors.borderSecondary}`,
                                                            borderRadius: '12px',
                                                            color: experienceLevel === option.value 
                                                                ? option.color 
                                                                : colors.textSecondary,
                                                            fontSize: '15px',
                                                            fontWeight: '600',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (experienceLevel !== option.value) {
                                                                e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
                                                                e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)';
                                                            }
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            if (experienceLevel !== option.value) {
                                                                e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)';
                                                                e.currentTarget.style.borderColor = colors.borderSecondary;
                                                            }
                                                        }}
                                                    >
                                                        {option.label}
                                                    </button>
                                                ))}
                                            </div>
                                            <p style={{ fontSize: '12px', color: colors.textMuted, marginTop: '10px' }}>
                                                Рівень досвіду використовується для персоналізації рекомендацій
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* General Settings */}
                            <div>
                                <h3 style={{
                                    fontSize: '18px',
                                    fontWeight: 'bold',
                                    color: colors.textPrimary,
                                    marginBottom: '16px',
                                    paddingBottom: '12px',
                                    borderBottom: `2px solid ${isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.25)'}`
                                }}>
                                    Загальні налаштування
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {/* Severity */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                                            Рівень суворості
                                        </label>
                                        <select
                                            value={config.severity}
                                            onChange={(e) => updateField('severity', e.target.value)}
                                            style={{
                                                width: '100%',
                                                boxSizing: 'border-box',
                                                padding: '12px 16px',
                                                background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                                                border: `1px solid ${colors.borderSecondary}`,
                                                borderRadius: '8px',
                                                color: colors.textPrimary,
                                                fontSize: '14px',
                                                outline: 'none',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = 'rgb(59, 130, 246)';
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.borderColor = colors.borderSecondary;
                                            }}
                                        >
                                            <option value="ignore" style={{ background: isDark ? 'rgb(15, 15, 25)' : 'white', color: colors.textPrimary }}>Ignore</option>
                                            <option value="info" style={{ background: isDark ? 'rgb(15, 15, 25)' : 'white', color: colors.textPrimary }}>Info</option>
                                            <option value="warning" style={{ background: isDark ? 'rgb(15, 15, 25)' : 'white', color: colors.textPrimary }}>Warning</option>
                                            <option value="error" style={{ background: isDark ? 'rgb(15, 15, 25)' : 'white', color: colors.textPrimary }}>Error</option>
                                        </select>
                                        <p style={{ fontSize: '12px', color: colors.textMuted, marginTop: '6px' }}>
                                            Визначає базовий рівень суворості для всіх перевірок
                                        </p>
                                    </div>

                                    {/* Line Length */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                                            Максимальна довжина рядка
                                        </label>
                                        <input
                                            type="number"
                                            value={config.lineLength}
                                            onChange={(e) => updateField('lineLength', parseInt(e.target.value))}
                                            min="80"
                                            max="200"
                                            style={{
                                                width: '100%',
                                                boxSizing: 'border-box',
                                                padding: '12px 16px',
                                                background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                                                border: `1px solid ${colors.borderSecondary}`,
                                                borderRadius: '8px',
                                                color: colors.textPrimary,
                                                fontSize: '14px',
                                                outline: 'none',
                                                transition: 'all 0.2s'
                                            }}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = 'rgb(59, 130, 246)';
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.borderColor = colors.borderSecondary;
                                            }}
                                        />
                                        <p style={{ fontSize: '12px', color: colors.textMuted, marginTop: '6px' }}>
                                            Максимальна кількість символів у рядку коду (80-200)
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Rules by Category */}
                            {RULE_CATEGORIES.filter(cat => cat !== 'Загальні').map((category) => {
                                const rulesInCategory = getRulesByCategory(category);
                                if (rulesInCategory.length === 0) return null;

                                return (
                                    <div key={category}>
                                        <h3 style={{
                                            fontSize: '18px',
                                            fontWeight: 'bold',
                                            color: colors.textPrimary,
                                            marginBottom: '16px',
                                            paddingBottom: '12px',
                                            borderBottom: `2px solid ${isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.25)'}`
                                        }}>
                                            {category}
                                        </h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {rulesInCategory.map((ruleKey) => {
                                                const rule = CHECKSTYLE_RULES[ruleKey];
                                                const isEnabled = config[ruleKey as keyof CheckstyleConfig] as boolean;

                                                return (
                                                    <label
                                                        key={ruleKey}
                                                        style={{
                                                            padding: '14px 16px',
                                                            background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                                                            border: `1px solid ${colors.borderPrimary}`,
                                                            borderRadius: '8px',
                                                            transition: 'all 0.2s',
                                                            cursor: 'pointer',
                                                            display: 'block'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)';
                                                            e.currentTarget.style.borderColor = colors.borderAccent;
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)';
                                                            e.currentTarget.style.borderColor = colors.borderPrimary;
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={isEnabled}
                                                                onChange={(e) => updateField(ruleKey as keyof CheckstyleConfig, e.target.checked)}
                                                                style={{
                                                                    width: '20px',
                                                                    height: '20px',
                                                                    cursor: 'pointer',
                                                                    accentColor: 'rgb(59, 130, 246)',
                                                                    flexShrink: 0
                                                                }}
                                                            />
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <div style={{ fontSize: '15px', fontWeight: '600', color: colors.textPrimary }}>
                                                                    {rule.name}
                                                                </div>
                                                                <p style={{ fontSize: '13px', color: colors.textSecondary, lineHeight: '1.5', margin: '4px 0 0 0' }}>
                                                                    {rule.description}
                                                                </p>
                                                            </div>
                                                            <div style={{
                                                                padding: '4px 12px',
                                                                borderRadius: '6px',
                                                                fontSize: '12px',
                                                                fontWeight: '600',
                                                                whiteSpace: 'nowrap',
                                                                flexShrink: 0,
                                                                background: isEnabled 
                                                                    ? (isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(22, 163, 74, 0.15)')
                                                                    : (isDark ? 'rgba(100, 116, 139, 0.2)' : 'rgba(100, 116, 139, 0.15)'),
                                                                color: isEnabled ? colors.success : colors.textSecondary,
                                                                border: `1px solid ${isEnabled 
                                                                    ? (isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(22, 163, 74, 0.3)')
                                                                    : (isDark ? 'rgba(100, 116, 139, 0.3)' : 'rgba(100, 116, 139, 0.25)')}`
                                                            }}>
                                                                {isEnabled ? 'ON' : 'OFF'}
                                                            </div>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '64px 0' }}>
                            <p style={{ fontSize: '16px', color: colors.textSecondary }}>
                                Не вдалося завантажити конфігурацію
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer - Fixed */}
                <div style={{
                    padding: '24px 32px',
                    borderTop: `1px solid ${colors.borderPrimary}`,
                    background: isDark ? 'rgba(15, 15, 25, 0.95)' : 'rgba(248, 250, 252, 0.95)',
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end',
                    borderRadius: '0 0 16px 16px'
                }}>
                    <button
                        onClick={handleReset}
                        disabled={isLoading || isSaving}
                        style={{
                            padding: '14px 24px',
                            background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                            border: `1px solid ${colors.borderSecondary}`,
                            borderRadius: '8px',
                            color: colors.textPrimary,
                            fontSize: '15px',
                            fontWeight: '600',
                            cursor: (isLoading || isSaving) ? 'not-allowed' : 'pointer',
                            opacity: (isLoading || isSaving) ? 0.5 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            if (!isLoading && !isSaving) {
                                e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
                        }}
                    >
                        <RotateCcw style={{ width: '18px', height: '18px' }} />
                        Скинути
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isLoading || isSaving}
                        style={{
                            padding: '14px 32px',
                            background: 'linear-gradient(to right, rgb(59, 130, 246), rgb(6, 182, 212))',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '15px',
                            fontWeight: 'bold',
                            cursor: (isLoading || isSaving) ? 'not-allowed' : 'pointer',
                            opacity: (isLoading || isSaving) ? 0.5 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: isDark 
                                ? '0 10px 15px -3px rgba(59, 130, 246, 0.3)'
                                : '0 10px 15px -3px rgba(59, 130, 246, 0.2)',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            if (!isLoading && !isSaving) {
                                e.currentTarget.style.transform = 'scale(1.02)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="animate-spin" style={{ width: '18px', height: '18px' }} />
                                Збереження...
                            </>
                        ) : (
                            <>
                                <Save style={{ width: '18px', height: '18px' }} />
                                Зберегти
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
