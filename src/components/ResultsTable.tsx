/**
 * Results Table Component
 *
 * Displays Checkstyle violations found during analysis in a user-friendly format.
 * Shows file paths, line numbers, severity levels, and detailed messages.
 */

import React from 'react';
import {AlertTriangle, FileCode, Loader2, MapPin} from 'lucide-react';
import type {AnalysisResult} from "../services/api";

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
 * Individual result entry component
 *
 * Renders a single Checkstyle violation with:
 * - File path and name
 * - Line number location
 * - Severity badge (error/warning)
 * - Detailed violation message
 *
 * @param result - The analysis result to display
 * @param index - Position in a result array (used for staggered animations)
 */
const ResultEntry: React.FC<{ result: AnalysisResult; index: number }> = ({result, index}) => {
    /** Determines styling based on severity */
    const isError = result.severity === 'error';

    return (
        <div
            style={{
                padding: '32px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.02)',
                transition: 'background 0.2s',
                animation: 'fadeIn 0.3s ease-out',
                animationDelay: `${index * 0.03}s`,
                animationFillMode: 'both'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
            }}
        >
            <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '32px',
                marginBottom: '16px'
            }}>
                <div style={{flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '20px'}}>
                    {/* File path with severity badge */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '24px'
                    }}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
                            <FileCode
                                style={{width: '24px', height: '24px', color: 'rgb(100, 116, 139)', flexShrink: 0}}/>
                            <span style={{fontSize: '16px', fontFamily: 'monospace', color: 'rgb(148, 163, 184)'}}>
                                {result.filePath}
                            </span>
                        </div>
                        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px'}}>
                            <span style={{
                                display: 'inline-flex',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                whiteSpace: 'nowrap',
                                background: isError ? 'rgba(239, 68, 68, 0.2)' : 'rgba(251, 191, 36, 0.2)',
                                color: isError ? 'rgb(248, 113, 113)' : 'rgb(251, 191, 36)',
                                border: isError ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(251, 191, 36, 0.3)'
                            }}>
                                {result.severity === 'error' ? 'Warning' : result.severity}
                            </span>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '6px 12px',
                                background: 'rgba(59, 130, 246, 0.1)',
                                border: '1px solid rgba(59, 130, 246, 0.2)',
                                borderRadius: '8px'
                            }}>
                                <MapPin
                                    style={{width: '16px', height: '16px', color: 'rgb(96, 165, 250)', flexShrink: 0}}/>
                                <span style={{
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: 'rgb(96, 165, 250)',
                                    whiteSpace: 'nowrap'
                                }}>
                                    Рядок {result.lineNumber}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Message with icon */}
                    <div style={{display: 'flex', alignItems: 'center', gap: '32px'}}>
                        <AlertTriangle
                            style={{width: '32px', height: '32px', color: 'rgb(251, 191, 36)', flexShrink: 0}}/>
                        <p style={{fontSize: '18px', color: 'white', lineHeight: '1.6', fontWeight: '500'}}>
                            {result.message}
                        </p>
                    </div>
                </div>
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
    return (
        <div className="custom-scrollbar" style={{
            height: '100%',
            display: results.length > 0 ? 'block' : 'flex',
            flexDirection: 'column'
        }}>
            {results.length > 0 ? (
                results.map((result, index) => (
                    <ResultEntry key={result.id} result={result} index={index}/>
                ))
            ) : (
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: 0}}>
                    <div style={{textAlign: 'center'}}>
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="animate-spin" style={{
                                    width: '64px',
                                    height: '64px',
                                    color: 'rgb(96, 165, 250)',
                                    margin: '0 auto 24px'
                                }} />
                                <p style={{fontSize: '18px', fontWeight: '600', color: 'white', marginBottom: '8px'}}>
                                    Аналіз триває
                                </p>
                                <p style={{fontSize: '16px', color: 'rgb(100, 116, 139)'}}>
                                    Очікуйте завершення обробки
                                </p>
                            </>
                        ) : (
                            <>
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '1rem',
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    backdropFilter: 'blur(40px)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 24px',
                                    border: '2px solid rgba(255, 255, 255, 0.05)',
                                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                                }}>
                                    <FileCode style={{width: '40px', height: '40px', color: 'rgb(71, 85, 105)'}}/>
                                </div>
                                <p style={{fontSize: '18px', fontWeight: '600', color: 'white', marginBottom: '8px'}}>
                                    Немає результатів
                                </p>
                                <p style={{fontSize: '16px', color: 'rgb(100, 116, 139)'}}>
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
