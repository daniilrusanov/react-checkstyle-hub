/**
 * Results Table Component
 *
 * Displays Checkstyle and PMD violations found during analysis in a user-friendly format.
 * Shows file paths, line numbers, analyzer type, normalized severity, and detailed messages.
 */

import React from 'react';
import {AlertTriangle, FileCode, Loader2, MapPin} from 'lucide-react';
import type {AnalysisResult} from "../services/api";
import { useTheme, getThemeColors } from '../context/ThemeContext';

/**
 * Props for the ResultsTable component
 */
interface ResultsTableProps {
    /** Array of analysis results (violations) to display */
    results: AnalysisResult[];
    /** Whether an analysis is currently in progress */
    isAnalyzing: boolean;
}

/**
 * Returns background color, text color, border color, and display label for a
 * severity value that may originate from either Checkstyle or PMD.
 *
 * Checkstyle levels : "error" → red | "warning" → yellow | "info" → gray
 * PMD levels        : "HIGH"/"ERROR" → red | "MEDIUM*" → yellow | "LOW" → gray
 */
function getSeverityConfig(
    severity: string,
    analyzerType: string | undefined,
    isDark: boolean,
    colors: ReturnType<typeof getThemeColors>
): { bg: string; text: string; border: string; label: string } {
    const s = severity.toUpperCase();
    const isError =
        s === 'ERROR' ||
        (analyzerType === 'PMD' && (s === 'HIGH' || s === 'ERROR'));
    const isWarning =
        s === 'WARNING' ||
        (analyzerType === 'PMD' && (s === 'MEDIUM' || s === 'MEDIUM_HIGH' || s === 'MEDIUM_LOW'));

    if (isError) {
        return {
            bg:     isDark ? 'rgba(239, 68, 68, 0.2)'  : 'rgba(220, 38, 38, 0.1)',
            text:   isDark ? 'rgb(248, 113, 113)'       : 'rgb(185, 28, 28)',
            border: isDark ? 'rgba(239, 68, 68, 0.3)'  : 'rgba(220, 38, 38, 0.25)',
            label: 'ERROR',
        };
    }
    if (isWarning) {
        return {
            bg:     isDark ? 'rgba(251, 191, 36, 0.2)'  : 'rgba(202, 138, 4, 0.12)',
            text:   isDark ? colors.warning              : 'rgb(161, 98, 7)',
            border: isDark ? 'rgba(251, 191, 36, 0.3)'  : 'rgba(202, 138, 4, 0.3)',
            label: 'WARNING',
        };
    }
    // info / low / anything else → gray
    return {
        bg:     isDark ? 'rgba(100, 116, 139, 0.2)'  : 'rgba(100, 116, 139, 0.1)',
        text:   colors.textMuted,
        border: isDark ? 'rgba(100, 116, 139, 0.3)'  : 'rgba(100, 116, 139, 0.25)',
        label: 'INFO',
    };
}

/**
 * Individual result entry component
 *
 * Renders a single violation with:
 * - File path and name
 * - Line number + analyzer-type badges
 * - Severity badge (normalized across Checkstyle and PMD)
 * - Detailed violation message
 *
 * @param result - The analysis result to display
 * @param index  - Position in result array (used for staggered animations)
 * @param isDark - Whether dark theme is active
 */
const ResultEntry: React.FC<{ result: AnalysisResult; index: number; isDark: boolean }> = ({result, index, isDark}) => {
    const colors = getThemeColors(isDark);
    const sevConfig = getSeverityConfig(result.severity, result.analyzerType, isDark, colors);
    const analyzerLabel = result.analyzerType === 'PMD' ? '[PMD]' : '[CS]';
    const isCheckstyle = result.analyzerType !== 'PMD';

    return (
        <div
            style={{
                padding: '24px',
                borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)'}`,
                transition: 'background 0.2s',
                animation: 'fadeIn 0.3s ease-out',
                animationDelay: `${index * 0.03}s`,
                animationFillMode: 'both',
                minWidth: 'fit-content'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = isDark
                    ? 'rgba(255, 255, 255, 0.02)'
                    : 'rgba(0, 0, 0, 0.02)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
            }}
        >
            {/* Header row: file path + badges */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '12px',
                flexWrap: 'nowrap'
            }}>
                <FileCode style={{width: '20px', height: '20px', color: colors.textMuted, flexShrink: 0}}/>
                <span style={{
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    color: colors.textSecondary,
                    whiteSpace: 'nowrap'
                }}>
                    {result.filePath}
                </span>

                {/* Line number badge */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px 10px',
                    background: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                    border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.25)'}`,
                    borderRadius: '6px',
                    flexShrink: 0
                }}>
                    <MapPin style={{width: '14px', height: '14px', color: colors.accentLight}}/>
                    <span style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: colors.accentLight,
                        whiteSpace: 'nowrap'
                    }}>
                        Рядок {result.lineNumber}
                    </span>
                </div>

                {/* Analyzer-type badge */}
                <span style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '700',
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.04em',
                    flexShrink: 0,
                    background: isCheckstyle
                        ? (isDark ? 'rgba(34, 197, 94, 0.15)'  : 'rgba(22, 163, 74, 0.1)')
                        : (isDark ? 'rgba(168, 85, 247, 0.15)' : 'rgba(126, 34, 206, 0.1)'),
                    color: isCheckstyle
                        ? (isDark ? colors.success : 'rgb(21, 128, 61)')
                        : (isDark ? 'rgb(216, 180, 254)' : 'rgb(126, 34, 206)'),
                    border: isCheckstyle
                        ? `1px solid ${isDark ? 'rgba(34, 197, 94, 0.3)'  : 'rgba(22, 163, 74, 0.3)'}`
                        : `1px solid ${isDark ? 'rgba(168, 85, 247, 0.3)' : 'rgba(126, 34, 206, 0.3)'}`,
                }}>
                    {analyzerLabel}
                </span>

                {/* Severity badge */}
                <span style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    background: sevConfig.bg,
                    color: sevConfig.text,
                    border: `1px solid ${sevConfig.border}`,
                }}>
                    {sevConfig.label}
                </span>
            </div>

            {/* Message row */}
            <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                paddingLeft: '36px'
            }}>
                <AlertTriangle style={{
                    width: '18px',
                    height: '18px',
                    color: isDark ? colors.warning : 'rgb(202, 138, 4)',
                    flexShrink: 0,
                    marginTop: '2px'
                }}/>
                <p style={{
                    fontSize: '15px',
                    color: colors.textPrimary,
                    lineHeight: '1.5',
                    fontWeight: '500',
                    margin: 0,
                    whiteSpace: 'nowrap'
                }}>
                    {result.message}
                </p>
            </div>
        </div>
    );
};

/**
 * Main results table component
 *
 * Features:
 * - Scrollable list of violations
 * - Loading state during analysis
 * - Empty state with instructions
 * - Staggered entry animations
 * - Responsive layout
 */
export const ResultsTable: React.FC<ResultsTableProps> = ({results, isAnalyzing}) => {
    const { isDark } = useTheme();
    const colors = getThemeColors(isDark);

    return (
        <div className="custom-scrollbar" style={{
            height: '100%',
            overflow: 'auto',
            background: isDark ? 'transparent' : colors.bgCard
        }}>
            {results.length > 0 ? (
                <div style={{ minWidth: 'fit-content' }}>
                    {results.map((result, index) => (
                        <ResultEntry key={result.id} result={result} index={index} isDark={isDark}/>
                    ))}
                </div>
            ) : (
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '300px'}}>
                    <div style={{textAlign: 'center'}}>
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="animate-spin" style={{
                                    width: '64px',
                                    height: '64px',
                                    color: colors.accentLight,
                                    margin: '0 auto 24px'
                                }} />
                                <p style={{fontSize: '18px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px'}}>
                                    Аналіз триває
                                </p>
                                <p style={{fontSize: '16px', color: colors.textMuted}}>
                                    Очікуйте завершення обробки
                                </p>
                            </>
                        ) : (
                            <>
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '1rem',
                                    background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.03)',
                                    backdropFilter: 'blur(40px)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 24px',
                                    border: `2px solid ${colors.borderPrimary}`,
                                    boxShadow: isDark 
                                        ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                                        : '0 10px 25px rgba(0, 0, 0, 0.08)'
                                }}>
                                    <FileCode style={{width: '40px', height: '40px', color: colors.textMuted}}/>
                                </div>
                                <p style={{fontSize: '18px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px'}}>
                                    Немає результатів
                                </p>
                                <p style={{fontSize: '16px', color: colors.textMuted}}>
                                    Запустіть аналіз для перегляду порушень
                                </p>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
