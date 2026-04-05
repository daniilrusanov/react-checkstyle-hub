/**
 * Results Table Component
 *
 * Displays Checkstyle and PMD violations found during analysis in a user-friendly format.
 * Shows file paths, line numbers, analyzer type, normalized severity, and detailed messages.
 * Each row can be expanded with an AI-generated explanation powered by the local Ollama LLM.
 */

import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import { AlertTriangle, FileCode, Loader2, MapPin, Sparkles } from 'lucide-react';
import type { AnalysisResult } from '../services/api';
import { getAiExplanation } from '../services/api';
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
    return {
        bg:     isDark ? 'rgba(100, 116, 139, 0.2)'  : 'rgba(100, 116, 139, 0.1)',
        text:   colors.textMuted,
        border: isDark ? 'rgba(100, 116, 139, 0.3)'  : 'rgba(100, 116, 139, 0.25)',
        label: 'INFO',
    };
}

/** Purple/indigo palette used exclusively for AI-related UI elements */
const AI_PURPLE = {
    text:        (isDark: boolean) => isDark ? 'rgb(196, 181, 253)' : 'rgb(109, 40, 217)',
    textMuted:   (isDark: boolean) => isDark ? 'rgb(167, 139, 250)' : 'rgb(124, 58, 237)',
    border:      'rgba(139, 92, 246, 0.35)',
    borderHover: 'rgba(139, 92, 246, 0.55)',
    bgPanel:     (isDark: boolean) => isDark ? 'rgba(139, 92, 246, 0.05)' : 'rgba(139, 92, 246, 0.04)',
    bgBtn:       (isDark: boolean) => isDark ? 'rgba(139, 92, 246, 0.18)' : 'rgba(139, 92, 246, 0.12)',
    bgSkeleton:  (isDark: boolean) => isDark ? 'rgba(139, 92, 246, 0.12)' : 'rgba(139, 92, 246, 0.08)',
    codeBlock:   (isDark: boolean) => isDark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(0, 0, 0, 0.04)',
    inlineCode:  (isDark: boolean) => isDark ? 'rgba(139, 92, 246, 0.18)' : 'rgba(139, 92, 246, 0.12)',
};

/** Builds the ReactMarkdown components map, themed to match isDark. */
function buildMarkdownComponents(
    isDark: boolean,
    colors: ReturnType<typeof getThemeColors>
): Components {
    const codeBlockBg = AI_PURPLE.codeBlock(isDark);
    const inlineCodeBg = AI_PURPLE.inlineCode(isDark);
    const inlineCodeColor = isDark ? 'rgb(216, 180, 254)' : 'rgb(109, 40, 217)';
    const headingColor3 = isDark ? 'rgb(196, 181, 253)' : 'rgb(109, 40, 217)';
    const strongColor = isDark ? 'rgb(216, 180, 254)' : 'rgb(109, 40, 217)';
    const codeBorder = `1px solid ${isDark ? 'rgba(139, 92, 246, 0.25)' : 'rgba(139, 92, 246, 0.18)'}`;

    return {
        p: ({ children }) => (
            <p style={{
                color: colors.textPrimary,
                fontSize: '14px',
                lineHeight: '1.75',
                marginBottom: '10px',
                marginTop: 0,
            }}>
                {children}
            </p>
        ),
        h1: ({ children }) => (
            <h1 style={{
                color: colors.textPrimary,
                fontSize: '17px',
                fontWeight: '700',
                marginTop: '18px',
                marginBottom: '10px',
                lineHeight: '1.4',
            }}>
                {children}
            </h1>
        ),
        h2: ({ children }) => (
            <h2 style={{
                color: colors.textPrimary,
                fontSize: '15px',
                fontWeight: '700',
                marginTop: '16px',
                marginBottom: '8px',
                lineHeight: '1.4',
            }}>
                {children}
            </h2>
        ),
        h3: ({ children }) => (
            <h3 style={{
                color: headingColor3,
                fontSize: '14px',
                fontWeight: '700',
                marginTop: '14px',
                marginBottom: '6px',
                lineHeight: '1.4',
            }}>
                {children}
            </h3>
        ),
        strong: ({ children }) => (
            <strong style={{ color: strongColor, fontWeight: '700' }}>
                {children}
            </strong>
        ),
        em: ({ children }) => (
            <em style={{ color: colors.textSecondary, fontStyle: 'italic' }}>
                {children}
            </em>
        ),
        ul: ({ children }) => (
            <ul style={{
                color: colors.textPrimary,
                paddingLeft: '22px',
                marginBottom: '10px',
                marginTop: '4px',
                listStyleType: 'disc',
            }}>
                {children}
            </ul>
        ),
        ol: ({ children }) => (
            <ol style={{
                color: colors.textPrimary,
                paddingLeft: '22px',
                marginBottom: '10px',
                marginTop: '4px',
                listStyleType: 'decimal',
            }}>
                {children}
            </ol>
        ),
        li: ({ children }) => (
            <li style={{
                color: colors.textPrimary,
                fontSize: '14px',
                lineHeight: '1.7',
                marginBottom: '4px',
            }}>
                {children}
            </li>
        ),
        blockquote: ({ children }) => (
            <blockquote style={{
                borderLeft: `3px solid ${AI_PURPLE.border}`,
                paddingLeft: '14px',
                marginLeft: 0,
                marginBottom: '10px',
                color: colors.textSecondary,
                fontStyle: 'italic',
            }}>
                {children}
            </blockquote>
        ),
        pre: ({ children }) => (
            <pre style={{
                background: codeBlockBg,
                border: codeBorder,
                borderRadius: '8px',
                padding: '14px 16px',
                overflowX: 'auto',
                marginBottom: '12px',
                marginTop: '4px',
                fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
                fontSize: '13px',
                lineHeight: '1.6',
                whiteSpace: 'pre',
            }}>
                {children}
            </pre>
        ),
        code: ({ className, children }) => {
            const isBlock = !!className;
            if (isBlock) {
                return (
                    <code style={{
                        fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
                        fontSize: '13px',
                        color: isDark ? 'rgb(203, 213, 225)' : 'rgb(30, 41, 59)',
                    }} className={className}>
                        {children}
                    </code>
                );
            }
            return (
                <code style={{
                    background: inlineCodeBg,
                    color: inlineCodeColor,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
                    fontSize: '13px',
                }}>
                    {children}
                </code>
            );
        },
    };
}

// ─── AI Skeleton Loading ──────────────────────────────────────────────────────

const AiSkeleton: React.FC<{ isDark: boolean }> = ({ isDark }) => (
    <div style={{
        padding: '20px 24px 22px',
        borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)'}`,
        background: AI_PURPLE.bgPanel(isDark),
        borderLeft: `3px solid ${AI_PURPLE.border}`,
    }}>
        {/* Label row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Loader2
                className="animate-spin"
                style={{ width: '14px', height: '14px', color: AI_PURPLE.text(isDark), flexShrink: 0 }}
            />
            <span style={{
                fontSize: '11px',
                fontWeight: '700',
                color: AI_PURPLE.textMuted(isDark),
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
            }}>
                Генерую пояснення…
            </span>
        </div>

        {/* Skeleton lines */}
        <div className="animate-pulse" style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
            {([72, 55, 85, 42, 68, 30] as const).map((w, i) => (
                <div
                    key={i}
                    style={{
                        height: '11px',
                        width: `${w}%`,
                        borderRadius: '6px',
                        background: AI_PURPLE.bgSkeleton(isDark),
                    }}
                />
            ))}
        </div>
    </div>
);

// ─── AI Explanation Panel ─────────────────────────────────────────────────────

const AiPanel: React.FC<{
    explanation: string;
    error?: string;
    isDark: boolean;
    colors: ReturnType<typeof getThemeColors>;
}> = ({ explanation, error, isDark, colors }) => {
    const mdComponents = useMemo(
        () => buildMarkdownComponents(isDark, colors),
        [isDark, colors]
    );

    return (
        <div style={{
            padding: '18px 24px 22px',
            borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)'}`,
            background: AI_PURPLE.bgPanel(isDark),
            borderLeft: `3px solid ${AI_PURPLE.border}`,
            animation: 'fadeIn 0.25s ease-out',
        }}>
            {/* Panel header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '14px',
                paddingBottom: '10px',
                borderBottom: `1px solid ${isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.12)'}`,
            }}>
                <Sparkles style={{
                    width: '15px',
                    height: '15px',
                    color: AI_PURPLE.text(isDark),
                    flexShrink: 0,
                }} />
                <span style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: AI_PURPLE.textMuted(isDark),
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                }}>
                    AI Пояснення
                </span>
            </div>

            {/* Content */}
            {error ? (
                <p style={{
                    fontSize: '14px',
                    color: isDark ? 'rgb(248, 113, 113)' : 'rgb(185, 28, 28)',
                    lineHeight: '1.6',
                    margin: 0,
                }}>
                    {error}
                </p>
            ) : (
                <div style={{
                    maxWidth: '860px',
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                }}>
                    <ReactMarkdown components={mdComponents}>
                        {explanation}
                    </ReactMarkdown>
                </div>
            )}
        </div>
    );
};

// ─── Result Entry ─────────────────────────────────────────────────────────────

interface ResultEntryProps {
    result: AnalysisResult;
    index: number;
    isDark: boolean;
    isLoadingAi: boolean;
    isExpanded: boolean;
    aiExplanation?: string;
    aiError?: string;
    onExplainClick: () => void;
}

const ResultEntry: React.FC<ResultEntryProps> = ({
    result, index, isDark,
    isLoadingAi, isExpanded, aiExplanation, aiError,
    onExplainClick,
}) => {
    const colors = getThemeColors(isDark);
    const sevConfig = getSeverityConfig(result.severity, result.analyzerType, isDark, colors);
    const analyzerLabel = result.analyzerType === 'PMD' ? '[PMD]' : '[CS]';
    const isCheckstyle = result.analyzerType !== 'PMD';

    const hasResult = aiExplanation !== undefined || aiError !== undefined;
    const btnActive = isExpanded && hasResult;

    return (
        <>
            {/* ── Main violation row ── */}
            <div
                style={{
                    padding: '24px',
                    borderBottom: isLoadingAi || (isExpanded && hasResult)
                        ? 'none'
                        : `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)'}`,
                    transition: 'background 0.2s',
                    animation: 'fadeIn 0.3s ease-out',
                    animationDelay: `${index * 0.03}s`,
                    animationFillMode: 'both',
                    minWidth: 'fit-content',
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
                {/* Header row: file path + badges + AI button */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    marginBottom: '12px',
                    flexWrap: 'nowrap',
                }}>
                    <FileCode style={{ width: '20px', height: '20px', color: colors.textMuted, flexShrink: 0 }} />
                    <span style={{
                        fontSize: '14px',
                        fontFamily: 'monospace',
                        color: colors.textSecondary,
                        whiteSpace: 'nowrap',
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
                        flexShrink: 0,
                    }}>
                        <MapPin style={{ width: '14px', height: '14px', color: colors.accentLight }} />
                        <span style={{
                            fontSize: '13px',
                            fontWeight: '600',
                            color: colors.accentLight,
                            whiteSpace: 'nowrap',
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

                    {/* ── AI Explain button ── */}
                    <button
                        onClick={onExplainClick}
                        disabled={isLoadingAi}
                        title={btnActive ? 'Сховати AI пояснення' : 'Отримати AI пояснення'}
                        style={{
                            marginLeft: 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '5px 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '600',
                            letterSpacing: '0.02em',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            cursor: isLoadingAi ? 'wait' : 'pointer',
                            border: `1px solid ${btnActive || isLoadingAi ? AI_PURPLE.borderHover : AI_PURPLE.border}`,
                            background: btnActive
                                ? AI_PURPLE.bgBtn(isDark)
                                : isLoadingAi
                                    ? (isDark ? 'rgba(139, 92, 246, 0.08)' : 'rgba(139, 92, 246, 0.05)')
                                    : 'transparent',
                            color: AI_PURPLE.text(isDark),
                            transition: 'all 0.18s',
                        }}
                        onMouseEnter={(e) => {
                            if (!isLoadingAi) {
                                (e.currentTarget as HTMLButtonElement).style.background = AI_PURPLE.bgBtn(isDark);
                                (e.currentTarget as HTMLButtonElement).style.borderColor = AI_PURPLE.borderHover;
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isLoadingAi && !btnActive) {
                                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                                (e.currentTarget as HTMLButtonElement).style.borderColor = AI_PURPLE.border;
                            }
                        }}
                    >
                        {isLoadingAi ? (
                            <Loader2 className="animate-spin" style={{ width: '13px', height: '13px' }} />
                        ) : (
                            <Sparkles style={{ width: '13px', height: '13px' }} />
                        )}
                        {isLoadingAi ? 'Аналізую…' : btnActive ? 'Сховати' : 'Пояснити AI'}
                    </button>
                </div>

                {/* Message row */}
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    paddingLeft: '36px',
                }}>
                    <AlertTriangle style={{
                        width: '18px',
                        height: '18px',
                        color: isDark ? colors.warning : 'rgb(202, 138, 4)',
                        flexShrink: 0,
                        marginTop: '2px',
                    }} />
                    <p style={{
                        fontSize: '15px',
                        color: colors.textPrimary,
                        lineHeight: '1.5',
                        fontWeight: '500',
                        margin: 0,
                        whiteSpace: 'nowrap',
                    }}>
                        {result.message}
                    </p>
                </div>
            </div>

            {/* ── Loading skeleton ── */}
            {isLoadingAi && <AiSkeleton isDark={isDark} />}

            {/* ── Expanded AI explanation panel ── */}
            {!isLoadingAi && isExpanded && hasResult && (
                <AiPanel
                    explanation={aiExplanation ?? ''}
                    error={aiError}
                    isDark={isDark}
                    colors={colors}
                />
            )}
        </>
    );
};

// ─── Results Table ─────────────────────────────────────────────────────────────

/**
 * Main results table component.
 *
 * Features:
 * - Scrollable list of violations
 * - Per-row AI explanation with loading skeleton and Markdown rendering
 * - Explanations cached in component state (no duplicate LLM calls)
 * - Loading state during analysis
 * - Empty state with instructions
 * - Staggered entry animations
 */
export const ResultsTable: React.FC<ResultsTableProps> = ({ results, isAnalyzing }) => {
    const { isDark } = useTheme();
    const colors = getThemeColors(isDark);

    const [loadingAiForId, setLoadingAiForId] = useState<number | null>(null);
    const [aiExplanations, setAiExplanations] = useState<Record<number, string>>({});
    const [aiErrors, setAiErrors] = useState<Record<number, string>>({});
    const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({});

    const handleExplainClick = async (result: AnalysisResult) => {
        const id = result.id;

        // Already loaded — toggle visibility
        if (aiExplanations[id] !== undefined || aiErrors[id] !== undefined) {
            setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
            return;
        }

        // Start loading
        setLoadingAiForId(id);
        setExpandedIds(prev => ({ ...prev, [id]: true }));

        try {
            const explanation = await getAiExplanation(id);
            setAiExplanations(prev => ({ ...prev, [id]: explanation }));
        } catch (e) {
            setAiErrors(prev => ({
                ...prev,
                [id]: e instanceof Error ? e.message : 'Помилка генерації пояснення',
            }));
        } finally {
            setLoadingAiForId(null);
        }
    };

    return (
        <div className="custom-scrollbar" style={{
            height: '100%',
            overflow: 'auto',
            background: isDark ? 'transparent' : colors.bgCard,
        }}>
            {results.length > 0 ? (
                <div style={{ minWidth: 'fit-content' }}>
                    {results.map((result, index) => (
                        <ResultEntry
                            key={result.id}
                            result={result}
                            index={index}
                            isDark={isDark}
                            isLoadingAi={loadingAiForId === result.id}
                            isExpanded={!!expandedIds[result.id]}
                            aiExplanation={aiExplanations[result.id]}
                            aiError={aiErrors[result.id]}
                            onExplainClick={() => handleExplainClick(result)}
                        />
                    ))}
                </div>
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '300px' }}>
                    <div style={{ textAlign: 'center' }}>
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="animate-spin" style={{
                                    width: '64px',
                                    height: '64px',
                                    color: colors.accentLight,
                                    margin: '0 auto 24px',
                                }} />
                                <p style={{ fontSize: '18px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                                    Аналіз триває
                                </p>
                                <p style={{ fontSize: '16px', color: colors.textMuted }}>
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
                                        : '0 10px 25px rgba(0, 0, 0, 0.08)',
                                }}>
                                    <FileCode style={{ width: '40px', height: '40px', color: colors.textMuted }} />
                                </div>
                                <p style={{ fontSize: '18px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                                    Немає результатів
                                </p>
                                <p style={{ fontSize: '16px', color: colors.textMuted }}>
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
