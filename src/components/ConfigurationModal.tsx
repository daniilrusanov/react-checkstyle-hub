/**
 * Configuration Modal Component
 * 
 * A comprehensive modal dialog for managing Checkstyle configuration settings.
 * Provides an intuitive interface for enabling/disabling code quality rules
 * and adjusting general analysis parameters.
 */

import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw, CheckCircle, XCircle, Loader2, Settings2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getConfiguration, updateConfiguration, type CheckstyleConfig, type UpdateConfigDto } from '../services/configuration';
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

    /**
     * Load configuration when modal opens
     */
    useEffect(() => {
        if (isOpen) {
            loadConfiguration();
        }
    }, [isOpen]);

    /**
     * Fetches the current configuration from the backend
     * and updates the local state
     */
    const loadConfiguration = async () => {
        setIsLoading(true);
        try {
            const data = await getConfiguration();
            setConfig(data);
        } catch (error) {
            toast.error(`Помилка завантаження: ${(error as Error).message}`);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Saves the current configuration state to the backend
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

            const updated = await updateConfiguration(updateDto);
            setConfig(updated);
            toast.success('Конфігурацію успішно збережено!');
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
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
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
                    background: 'rgba(15, 15, 25, 0.98)',
                    backdropFilter: 'blur(40px)',
                    border: '2px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '16px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
                    marginTop: '16px',
                    animation: 'fadeIn 0.3s ease-out'
                }}
            >
                {/* Header - Fixed */}
                <div style={{
                    padding: '32px',
                    borderBottom: '2px solid rgba(59, 130, 246, 0.2)',
                    background: 'linear-gradient(to right, rgba(59, 130, 246, 0.1), rgba(6, 182, 212, 0.1))'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '12px',
                                background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.2), rgba(6, 182, 212, 0.2))',
                                border: '2px solid rgba(59, 130, 246, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Settings2 style={{ width: '28px', height: '28px', color: 'rgb(96, 165, 250)' }} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
                                    Налаштування Checkstyle
                                </h2>
                                <p style={{ fontSize: '14px', color: 'rgb(148, 163, 184)' }}>
                                    Керуйте правилами аналізу коду
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            style={{
                                width: '40px',
                                height: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                            }}
                        >
                            <X style={{ width: '20px', height: '20px', color: 'rgb(248, 113, 113)' }} />
                        </button>
                    </div>
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
                            <Loader2 className="animate-spin" style={{ width: '48px', height: '48px', color: 'rgb(96, 165, 250)', marginBottom: '16px' }} />
                            <p style={{ fontSize: '16px', color: 'rgb(148, 163, 184)' }}>Завантаження конфігурації...</p>
                        </div>
                    ) : config ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            {/* Info Box */}
                            <div style={{
                                padding: '20px',
                                background: 'rgba(59, 130, 246, 0.1)',
                                border: '1px solid rgba(59, 130, 246, 0.2)',
                                borderRadius: '12px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                    <div style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: 'rgb(96, 165, 250)'
                                    }}></div>
                                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'rgb(96, 165, 250)' }}>
                                        Конфігурація: {config.configName}
                                    </span>
                                </div>
                                <p style={{ fontSize: '14px', color: 'rgb(148, 163, 184)', marginLeft: '20px' }}>
                                    Оновлено: {new Date(config.updatedAt).toLocaleString('uk-UA')}
                                </p>
                            </div>

                            {/* Quick Actions */}
                            <div>
                                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'white', marginBottom: '12px' }}>
                                    Швидкі дії
                                </h3>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button
                                        onClick={handleEnableAll}
                                        style={{
                                            flex: 1,
                                            padding: '12px 20px',
                                            background: 'rgba(34, 197, 94, 0.1)',
                                            border: '1px solid rgba(34, 197, 94, 0.3)',
                                            borderRadius: '8px',
                                            color: 'rgb(74, 222, 128)',
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
                                            e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)';
                                            e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.5)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(34, 197, 94, 0.1)';
                                            e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.3)';
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
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            border: '1px solid rgba(239, 68, 68, 0.3)',
                                            borderRadius: '8px',
                                            color: 'rgb(248, 113, 113)',
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
                                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
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
                                    padding: '16px',
                                    background: 'rgba(34, 197, 94, 0.1)',
                                    border: '1px solid rgba(34, 197, 94, 0.2)',
                                    borderRadius: '12px'
                                }}>
                                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'rgb(74, 222, 128)', marginBottom: '4px' }}>
                                        {getEnabledRulesCount()}
                                    </div>
                                    <div style={{ fontSize: '14px', color: 'rgb(148, 163, 184)' }}>Активних правил</div>
                                </div>
                                <div style={{
                                    padding: '16px',
                                    background: 'rgba(251, 191, 36, 0.1)',
                                    border: '1px solid rgba(251, 191, 36, 0.2)',
                                    borderRadius: '12px'
                                }}>
                                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'rgb(251, 191, 36)', marginBottom: '4px' }}>
                                        {config.lineLength}
                                    </div>
                                    <div style={{ fontSize: '14px', color: 'rgb(148, 163, 184)' }}>Символів у рядку</div>
                                </div>
                            </div>

                            {/* General Settings */}
                            <div>
                                <h3 style={{
                                    fontSize: '18px',
                                    fontWeight: 'bold',
                                    color: 'white',
                                    marginBottom: '16px',
                                    paddingBottom: '12px',
                                    borderBottom: '2px solid rgba(59, 130, 246, 0.2)'
                                }}>
                                    Загальні налаштування
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {/* Severity */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'white', marginBottom: '8px' }}>
                                            Рівень суворості
                                        </label>
                                        <select
                                            value={config.severity}
                                            onChange={(e) => updateField('severity', e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '12px 16px',
                                                background: 'rgba(255, 255, 255, 0.05)',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                borderRadius: '8px',
                                                color: 'white',
                                                fontSize: '14px',
                                                outline: 'none',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = 'rgb(59, 130, 246)';
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                            }}
                                        >
                                            <option value="ignore" style={{ background: 'rgb(15, 15, 25)', color: 'white' }}>Ignore</option>
                                            <option value="info" style={{ background: 'rgb(15, 15, 25)', color: 'white' }}>Info</option>
                                            <option value="warning" style={{ background: 'rgb(15, 15, 25)', color: 'white' }}>Warning</option>
                                            <option value="error" style={{ background: 'rgb(15, 15, 25)', color: 'white' }}>Error</option>
                                        </select>
                                        <p style={{ fontSize: '12px', color: 'rgb(100, 116, 139)', marginTop: '6px' }}>
                                            Визначає базовий рівень суворості для всіх перевірок
                                        </p>
                                    </div>

                                    {/* Line Length */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'white', marginBottom: '8px' }}>
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
                                                padding: '12px 16px',
                                                background: 'rgba(255, 255, 255, 0.05)',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                borderRadius: '8px',
                                                color: 'white',
                                                fontSize: '14px',
                                                outline: 'none',
                                                transition: 'all 0.2s'
                                            }}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = 'rgb(59, 130, 246)';
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                            }}
                                        />
                                        <p style={{ fontSize: '12px', color: 'rgb(100, 116, 139)', marginTop: '6px' }}>
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
                                            color: 'white',
                                            marginBottom: '16px',
                                            paddingBottom: '12px',
                                            borderBottom: '2px solid rgba(59, 130, 246, 0.2)'
                                        }}>
                                            {category}
                                        </h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {rulesInCategory.map((ruleKey) => {
                                                const rule = CHECKSTYLE_RULES[ruleKey];
                                                const isEnabled = config[ruleKey as keyof CheckstyleConfig] as boolean;

                                                return (
                                                    <div
                                                        key={ruleKey}
                                                        style={{
                                                            padding: '16px',
                                                            background: 'rgba(255, 255, 255, 0.02)',
                                                            border: '1px solid rgba(255, 255, 255, 0.05)',
                                                            borderRadius: '8px',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                                                            e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                                                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={isEnabled}
                                                                onChange={(e) => updateField(ruleKey as keyof CheckstyleConfig, e.target.checked)}
                                                                style={{
                                                                    width: '20px',
                                                                    height: '20px',
                                                                    marginTop: '2px',
                                                                    cursor: 'pointer',
                                                                    accentColor: 'rgb(59, 130, 246)'
                                                                }}
                                                            />
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ fontSize: '15px', fontWeight: '600', color: 'white', marginBottom: '6px' }}>
                                                                    {rule.name}
                                                                </div>
                                                                <p style={{ fontSize: '13px', color: 'rgb(148, 163, 184)', lineHeight: '1.5' }}>
                                                                    {rule.description}
                                                                </p>
                                                            </div>
                                                            <div style={{
                                                                padding: '4px 12px',
                                                                borderRadius: '6px',
                                                                fontSize: '12px',
                                                                fontWeight: '600',
                                                                whiteSpace: 'nowrap',
                                                                background: isEnabled ? 'rgba(34, 197, 94, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                                                                color: isEnabled ? 'rgb(74, 222, 128)' : 'rgb(148, 163, 184)',
                                                                border: `1px solid ${isEnabled ? 'rgba(34, 197, 94, 0.3)' : 'rgba(100, 116, 139, 0.3)'}`
                                                            }}>
                                                                {isEnabled ? 'ON' : 'OFF'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '64px 0' }}>
                            <p style={{ fontSize: '16px', color: 'rgb(148, 163, 184)' }}>
                                Не вдалося завантажити конфігурацію
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer - Fixed */}
                <div style={{
                    padding: '24px 32px',
                    borderTop: '2px solid rgba(59, 130, 246, 0.2)',
                    background: 'rgba(15, 15, 25, 0.95)',
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end'
                }}>
                    <button
                        onClick={handleReset}
                        disabled={isLoading || isSaving}
                        style={{
                            padding: '14px 24px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            color: 'white',
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
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
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
                            boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)',
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
