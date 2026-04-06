/**
 * Checkstyle Analyzer Application
 * 
 * Main application part that orchestrates the Checkstyle analysis workflow:
 * - Submitting repository URLs for analysis
 * - Real-time log streaming via WebSocket
 * - Displaying analysis results
 * - Managing configuration settings
 */

import { useState } from 'react';
import { Settings, LogIn, Sparkles, Loader2 } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import { AnalysisForm } from './components/AnalysisForm';
import { LogTerminal } from './components/LogTerminal';
import { ResultsTable } from './components/ResultsTable';
import { ConfigurationModal } from './components/ConfigurationModal';
import { AuthModal } from './components/AuthModal';
import { UserMenu } from './components/UserMenu';
import { HistoryModal } from './components/HistoryModal';
import { UserDashboard } from './components/UserDashboard';
import { ThemeToggle } from './components/ThemeToggle';
import { useAuth } from './context/AuthContext';
import { useTheme, getThemeColors } from './context/ThemeContext';
import { startAnalysis, fetchResults, pollStatus, analyzeCode, getGeneralSummary, type AnalysisResult, type AnalysisStatus } from './services/api';
import { connectWebSocket, type LogEntry } from './services/socket';
import './index.css';

// ─── Quality Score Ring ────────────────────────────────────────────────────────

function QualityScoreRing({ score, size = 68, isDark, colors }: {
    score: number;
    size?: number;
    isDark: boolean;
    colors: ReturnType<typeof getThemeColors>;
}) {
    const strokeWidth = 5;
    const radius = (size - strokeWidth * 2) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - Math.max(0, Math.min(100, score)) / 100);
    const ringColor = score >= 80 ? colors.success : score >= 50 ? colors.warning : colors.error;

    return (
        <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none"
                    stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}
                    strokeWidth={strokeWidth}
                />
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none"
                    stroke={ringColor}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
            </svg>
            <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1px'
            }}>
                <span style={{ fontSize: Math.round(size * 0.27), fontWeight: 'bold', color: ringColor, lineHeight: 1 }}>
                    {score}
                </span>
                <span style={{ fontSize: Math.round(size * 0.14), color: colors.textMuted, lineHeight: 1 }}>
                    /100
                </span>
            </div>
        </div>
    );
}

/**
 * Root application component
 * 
 * Manages the complete analysis lifecycle:
 * 1. User submits a GitHub repository URL
 * 2. Backend starts analysis and returns a request ID
 * 3. WebSocket connection streams real-time logs
 * 4. Upon completion, results are fetched and displayed
 */
function App() {
    /** Array of log messages received during analysis */
    const [logs, setLogs] = useState<LogEntry[]>([]);
    /** Array of Checkstyle violations found */
    const [results, setResults] = useState<AnalysisResult[]>([]);
    /** Whether an analysis is currently in progress */
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    /** ID of the current/last analysis request */
    const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
    /** Controls configuration modal visibility */
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    /** Current status of the analysis */
    const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus['status'] | null>(null);
    /** Controls auth modal visibility */
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    /** Auth modal initial tab */
    const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
    /** Controls history modal visibility */
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    /** Controls user dashboard visibility */
    const [isDashboardOpen, setIsDashboardOpen] = useState(false);
    /** External URL for form (set from history/dashboard) */
    const [externalRepoUrl, setExternalRepoUrl] = useState<string | undefined>(undefined);
    /** Quality score (0–100) from the last completed analysis */
    const [qualityScore, setQualityScore] = useState<number | null>(null);
    /** Source code from the last direct (paste) analysis — used for stateless AI explanations */
    const [directAnalysisRawCode, setDirectAnalysisRawCode] = useState<string | null>(null);

    /** General AI summary text (FRS06) */
    const [summaryText, setSummaryText] = useState<string | null>(null);
    /** Whether the general AI summary is being fetched */
    const [summaryLoading, setSummaryLoading] = useState(false);
    /** Error message from the general AI summary fetch */
    const [summaryError, setSummaryError] = useState<string | null>(null);
    
    /** Auth context */
    const { isAuthenticated } = useAuth();
    
    /** Theme context */
    const { isDark } = useTheme();
    const colors = getThemeColors(isDark);
    
    /**
     * Opens the auth modal with specified tab
     */
    const openAuthModal = (tab: 'login' | 'register') => {
        setAuthModalTab(tab);
        setIsAuthModalOpen(true);
    };

    /**
     * Load results from a previous analysis
     */
    const loadHistoryResults = async (requestId: number, repoUrl?: string) => {
        try {
            setDirectAnalysisRawCode(null);
            const results = await fetchResults(String(requestId));
            setResults(results);
            setLogs([{ level: 'INFO', message: `Завантажено ${results.length} результатів з історії` }]);
            
            // Set the repo URL in the form and switch to URL mode
            if (repoUrl) {
                setExternalRepoUrl(repoUrl);
                // Clear after a tick to allow re-setting the same URL later
                setTimeout(() => setExternalRepoUrl(undefined), 100);
            }
        } catch (error) {
            console.error('Failed to load results:', error);
        }
    };

    /**
     * Gets a user-friendly status message for display
     */
    const getStatusMessage = (status: AnalysisStatus['status']): string => {
        const statusMessages = {
            'PENDING': '⏳ Очікування початку аналізу...',
            'CLONING': '📥 Клонування репозиторію...',
            'ANALYZING': '🔍 Аналіз Java файлів...',
            'COMPLETED': '✅ Аналіз завершено',
            'FAILED': '❌ Помилка аналізу'
        };
        return statusMessages[status] || status;
    };

    /**
     * Initiates a new analysis for the given repository URL
     * 
     * Workflow:
     * 1. Clears previous logs and results
     * 2. Calls backend API to start analysis
     * 3. Establishes WebSocket connection for log streaming
     * 4. Polls status until completion
     * 5. Fetches results when analysis is complete
     * 
     * @param url - GitHub repository URL to analyze
     */
    const handleAnalysisStart = async (url: string) => {
        if (isAnalyzing) return;

        setIsAnalyzing(true);
        setLogs([]);
        setResults([]);
        setCurrentRequestId(null);
        setAnalysisStatus(null);
        setQualityScore(null);
        setSummaryText(null);
        setSummaryError(null);
        setDirectAnalysisRawCode(null);

        try {
            setLogs(prev => [...prev, { level: 'INFO', message: 'Надсилаю запит на аналіз...' }]);

            const requestId = await startAnalysis(url);
            setCurrentRequestId(requestId);

            setLogs(prev => [...prev, { level: 'INFO', message: `Запит створено. ID: ${requestId}. Підключаюсь до логів...` }]);

            // Connect to WebSocket for real-time logs
            connectWebSocket(
                requestId,
                (logEntry) => {
                    setLogs(prev => [...prev, logEntry]);
                },
                () => {
                    // WebSocket disconnected - this doesn't mean analysis is complete
                    setLogs(prev => [...prev, { level: 'INFO', message: 'З\'єднання WebSocket закрито.' }]);
                }
            );

            // Poll status until completion
            setLogs(prev => [...prev, { level: 'INFO', message: 'Перевіряю статус аналізу...' }]);
            
            const finalStatus = await pollStatus(requestId, (status) => {
                setAnalysisStatus(status.status);
                const statusMsg = getStatusMessage(status.status);
                setLogs(prev => {
                    // Avoid duplicate status messages
                    const lastLog = prev[prev.length - 1];
                    if (lastLog && lastLog.message === statusMsg) {
                        return prev;
                    }
                    return [...prev, { level: 'INFO', message: statusMsg }];
                });
            });

            if (finalStatus.qualityScore != null) {
                setQualityScore(finalStatus.qualityScore);
            }

            // Analysis completed - fetch results
            setLogs(prev => [...prev, { level: 'INFO', message: 'Завантажую результати...' }]);
            
            const analysisResults = await fetchResults(requestId);
            setResults(analysisResults);
            
            setLogs(prev => [...prev, { 
                level: 'INFO', 
                message: `Знайдено ${analysisResults.length} порушень` 
            }]);

        } catch (error) {
            const errorMessage = (error instanceof Error) ? error.message : 'Невідома помилка';
            setLogs(prev => [...prev, { level: 'ERROR', message: `Помилка: ${errorMessage}` }]);
            setAnalysisStatus('FAILED');
        } finally {
            setIsAnalyzing(false);
        }
    };

    /**
     * Handles direct code analysis submission
     * 
     * @param code - Java source code to analyze
     * @param fileName - Optional filename for the code
     * @param checkCompilation - Whether to check if code compiles
     */
    const handleCodeAnalysis = async (code: string, fileName?: string, checkCompilation: boolean = false) => {
        if (isAnalyzing) return;

        setIsAnalyzing(true);
        setLogs([]);
        setResults([]);
        setAnalysisStatus(null);
        setQualityScore(null);
        setSummaryText(null);
        setSummaryError(null);
        setDirectAnalysisRawCode(null);

        try {
            setLogs(prev => [...prev, { level: 'INFO', message: 'Починаю аналіз коду...' }]);
            
            if (fileName) {
                setLogs(prev => [...prev, { level: 'INFO', message: `Файл: ${fileName}` }]);
            }

            if (checkCompilation) {
                setLogs(prev => [...prev, { level: 'INFO', message: 'Перевірка компіляції...' }]);
            }

            const result = await analyzeCode({
                code,
                fileName,
                checkCompilation
            });

            if (!result.success) {
                setLogs(prev => [...prev, { level: 'ERROR', message: `Помилка: ${result.errorMessage}` }]);
                setAnalysisStatus('FAILED');
                return;
            }

            // Log compilation results (only if checkCompilation was enabled)
            if (checkCompilation && result.compilationSuccess !== undefined) {
                if (result.compilationSuccess) {
                    setLogs(prev => [...prev, { level: 'INFO', message: '✅ Код успішно компілюється' }]);
                } else {
                    setLogs(prev => [...prev, { level: 'WARNING', message: '❌ Код не компілюється' }]);
                    for (const error of result.compilationErrors || []) {
                        setLogs(prev => [...prev, { 
                            level: 'ERROR', 
                            message: `Рядок ${error.lineNumber}: ${error.message}` 
                        }]);
                    }
                }
            }

            // If compilation check was enabled and failed, don't show Checkstyle results
            const compilationFailed = checkCompilation && result.compilationSuccess === false;
            
            if (compilationFailed) {
                setLogs(prev => [...prev, { 
                    level: 'WARNING', 
                    message: 'Аналіз Checkstyle пропущено через помилки компіляції' 
                }]);
                setAnalysisStatus('FAILED');
                return;
            }

            // Log Checkstyle analysis
            setLogs(prev => [...prev, { level: 'INFO', message: 'Запуск аналізу Checkstyle...' }]);

            // Convert violations to results format
            const analysisResults: AnalysisResult[] = result.violations.map((v, index) => ({
                id: index,
                filePath: v.filePath,
                lineNumber: v.lineNumber,
                severity: v.severity,
                message: v.message
            }));

            setResults(analysisResults);
            setDirectAnalysisRawCode(code);

            // Log quality score
            if (result.qualityScore !== undefined) {
                setQualityScore(result.qualityScore);
                const scoreEmoji = result.qualityScore >= 80 ? '🌟' : result.qualityScore >= 60 ? '👍' : '⚠️';
                setLogs(prev => [...prev, { 
                    level: 'INFO', 
                    message: `${scoreEmoji} Оцінка якості коду: ${result.qualityScore}/100` 
                }]);
            }

            setLogs(prev => [...prev, { 
                level: 'INFO', 
                message: `Аналіз завершено. Знайдено ${result.violationCount} порушень.` 
            }]);

            setAnalysisStatus('COMPLETED');

        } catch (error) {
            const errorMessage = (error instanceof Error) ? error.message : 'Невідома помилка';
            setLogs(prev => [...prev, { level: 'ERROR', message: `Помилка: ${errorMessage}` }]);
            setAnalysisStatus('FAILED');
        } finally {
            setIsAnalyzing(false);
        }
    };

    /** FRS06 — fetches the general AI summary for the current request. */
    const handleGetSummary = async () => {
        if (!isAuthenticated || !currentRequestId || summaryLoading) return;
        setSummaryLoading(true);
        setSummaryError(null);
        setSummaryText(null);
        try {
            const text = await getGeneralSummary(currentRequestId);
            setSummaryText(text);
        } catch (err) {
            setSummaryError(err instanceof Error ? err.message : 'Помилка отримання висновку');
        } finally {
            setSummaryLoading(false);
        }
    };

    /** Themed ReactMarkdown component map for the summary card. */
    const buildSummaryMarkdownComponents = (): Components => ({
        p: ({ children }) => (
            <p style={{ color: colors.textPrimary, fontSize: '15px', lineHeight: '1.8', marginBottom: '12px', marginTop: 0 }}>
                {children}
            </p>
        ),
        h1: ({ children }) => (
            <h1 style={{ color: colors.textPrimary, fontSize: '18px', fontWeight: '700', marginTop: '20px', marginBottom: '10px' }}>
                {children}
            </h1>
        ),
        h2: ({ children }) => (
            <h2 style={{ color: colors.textPrimary, fontSize: '16px', fontWeight: '700', marginTop: '18px', marginBottom: '8px' }}>
                {children}
            </h2>
        ),
        h3: ({ children }) => (
            <h3 style={{ color: isDark ? 'rgb(196, 181, 253)' : 'rgb(109, 40, 217)', fontSize: '15px', fontWeight: '600', marginTop: '14px', marginBottom: '6px' }}>
                {children}
            </h3>
        ),
        strong: ({ children }) => (
            <strong style={{ color: isDark ? 'rgb(216, 180, 254)' : 'rgb(109, 40, 217)', fontWeight: '600' }}>
                {children}
            </strong>
        ),
        ul: ({ children }) => (
            <ul style={{ color: colors.textPrimary, fontSize: '15px', lineHeight: '1.8', paddingLeft: '20px', marginBottom: '12px' }}>
                {children}
            </ul>
        ),
        ol: ({ children }) => (
            <ol style={{ color: colors.textPrimary, fontSize: '15px', lineHeight: '1.8', paddingLeft: '20px', marginBottom: '12px' }}>
                {children}
            </ol>
        ),
        li: ({ children }) => (
            <li style={{ marginBottom: '4px' }}>{children}</li>
        ),
        code: ({ children, className }) => {
            const isBlock = className?.startsWith('language-');
            return isBlock ? (
                <code style={{
                    display: 'block',
                    background: isDark ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.04)',
                    borderRadius: '6px',
                    padding: '12px 16px',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    color: colors.textPrimary,
                    overflowX: 'auto',
                    border: `1px solid ${isDark ? 'rgba(139,92,246,0.25)' : 'rgba(139,92,246,0.18)'}`,
                }}>
                    {children}
                </code>
            ) : (
                <code style={{
                    background: isDark ? 'rgba(139,92,246,0.18)' : 'rgba(139,92,246,0.1)',
                    borderRadius: '4px',
                    padding: '2px 6px',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    color: isDark ? 'rgb(216,180,254)' : 'rgb(109,40,217)',
                }}>
                    {children}
                </code>
            );
        },
        pre: ({ children }) => (
            <pre style={{ margin: '10px 0', borderRadius: '8px', overflow: 'hidden' }}>{children}</pre>
        ),
    });

    return (
        <>
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: isDark ? 'rgb(15, 15, 25)' : 'rgb(255, 255, 255)',
                        color: colors.textPrimary,
                        border: `1px solid ${colors.borderAccent}`,
                        padding: '16px',
                        fontSize: '15px',
                        boxShadow: isDark 
                            ? '0 10px 25px rgba(0, 0, 0, 0.5)' 
                            : '0 10px 25px rgba(0, 0, 0, 0.15)',
                    },
                }}
            />
            
            <div style={{
                minHeight: '100vh',
                background: isDark 
                    ? 'linear-gradient(to bottom right, rgb(2, 6, 23), rgb(15, 23, 42), rgb(2, 6, 23))'
                    : 'linear-gradient(to bottom right, rgb(248, 250, 252), rgb(241, 245, 249), rgb(248, 250, 252))',
                position: 'relative',
                transition: 'background 0.3s ease'
            }}>
                {/* Grid pattern overlay */}
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    opacity: colors.gridOpacity,
                    pointerEvents: 'none'
                }}>
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `linear-gradient(${colors.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${colors.gridColor} 1px, transparent 1px)`,
                        backgroundSize: '64px 64px'
                    }} />
                </div>
                
                {/* Decorative gradient blurs */}
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    pointerEvents: 'none',
                    overflow: 'hidden'
                }}>
                    {/* Top-left gradient blob */}
                    <div style={{
                        position: 'absolute',
                        top: '-20%',
                        left: '-10%',
                        width: '50%',
                        height: '50%',
                        background: isDark 
                            ? 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)'
                            : 'radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, transparent 70%)',
                        filter: 'blur(60px)',
                        borderRadius: '50%'
                    }} />
                    
                    {/* Bottom-right gradient blob */}
                    <div style={{
                        position: 'absolute',
                        bottom: '-20%',
                        right: '-10%',
                        width: '50%',
                        height: '50%',
                        background: isDark 
                            ? 'radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, transparent 70%)'
                            : 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%)',
                        filter: 'blur(60px)',
                        borderRadius: '50%'
                    }} />
                    
                    {/* Center accent */}
                    <div style={{
                        position: 'absolute',
                        top: '30%',
                        right: '20%',
                        width: '30%',
                        height: '30%',
                        background: isDark 
                            ? 'radial-gradient(circle, rgba(168, 85, 247, 0.08) 0%, transparent 70%)'
                            : 'radial-gradient(circle, rgba(147, 51, 234, 0.06) 0%, transparent 70%)',
                        filter: 'blur(80px)',
                        borderRadius: '50%'
                    }} />
                </div>

                <div style={{
                    position: 'relative',
                    maxWidth: '1400px',
                    margin: '0 auto',
                    padding: '40px 24px'
                }}>
                    <header style={{
                        marginBottom: '40px',
                        animation: 'fadeIn 0.3s ease-out'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: '24px',
                            marginBottom: '32px'
                        }}>
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '10px 32px',
                                    background: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                                    border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.25)'}`,
                                    borderRadius: '9999px',
                                    marginBottom: '20px'
                                }}>
                                    <div className="animate-pulse" style={{
                                        width: '8px',
                                        height: '8px',
                                        background: colors.accent,
                                        borderRadius: '50%'
                                    }}></div>
                                    <span style={{
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: colors.accentLight,
                                        letterSpacing: '0.05em',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        JAVA CODE QUALITY
                                    </span>
                                </div>
                                <h1 style={{
                                    fontSize: '60px',
                                    fontWeight: 'bold',
                                    color: colors.textPrimary,
                                    marginBottom: '16px',
                                    letterSpacing: '-0.025em',
                                    transition: 'color 0.3s ease'
                                }}>
                                    Checkstyle Analyzer
                                </h1>
                                <p style={{
                                    fontSize: '20px',
                                    color: colors.textSecondary,
                                    maxWidth: '768px',
                                    lineHeight: '1.6',
                                    transition: 'color 0.3s ease'
                                }}>
                                    Професійний аналіз якості Java-коду за допомогою Checkstyle
                                </p>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {/* Theme toggle button */}
                                <ThemeToggle />
                                
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setIsConfigModalOpen(true);
                                    }}
                                    type="button"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '16px 24px',
                                        background: colors.bgCard,
                                        backdropFilter: 'blur(40px)',
                                        border: `1px solid ${colors.borderPrimary}`,
                                        borderRadius: '1rem',
                                        boxShadow: isDark 
                                            ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                                            : '0 10px 25px rgba(0, 0, 0, 0.1)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        flexShrink: 0
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = colors.bgCardHover;
                                        e.currentTarget.style.borderColor = colors.borderAccent;
                                        e.currentTarget.style.transform = 'scale(1.02)';
                                        const icon = e.currentTarget.querySelector('svg');
                                        if (icon) {
                                            (icon as SVGSVGElement).style.color = colors.accentLight;
                                            (icon as SVGSVGElement).style.transform = 'rotate(90deg)';
                                        }
                                        const span = e.currentTarget.querySelector('span');
                                        if (span) {
                                            (span as HTMLElement).style.color = colors.accentLighter;
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = colors.bgCard;
                                        e.currentTarget.style.borderColor = colors.borderPrimary;
                                        e.currentTarget.style.transform = 'scale(1)';
                                        const icon = e.currentTarget.querySelector('svg');
                                        if (icon) {
                                            (icon as SVGSVGElement).style.color = colors.textSecondary;
                                            (icon as SVGSVGElement).style.transform = 'rotate(0deg)';
                                        }
                                        const span = e.currentTarget.querySelector('span');
                                        if (span) {
                                            (span as HTMLElement).style.color = colors.textPrimary;
                                        }
                                    }}
                                    onMouseDown={(e) => {
                                        e.currentTarget.style.transform = 'scale(0.98)';
                                    }}
                                    onMouseUp={(e) => {
                                        e.currentTarget.style.transform = 'scale(1.02)';
                                    }}
                                >
                                    <Settings style={{ 
                                        width: '24px', 
                                        height: '24px', 
                                        color: colors.textSecondary,
                                        transition: 'all 0.3s'
                                    }} />
                                    <span style={{ 
                                        fontSize: '18px', 
                                        fontWeight: '600', 
                                        color: colors.textPrimary,
                                        transition: 'all 0.2s'
                                    }}>
                                        Налаштування
                                    </span>
                                </button>
                                
                                {/* Auth section */}
                                {isAuthenticated ? (
                                    <UserMenu 
                                        onShowHistory={() => setIsDashboardOpen(true)}
                                    />
                                ) : (
                                    <button
                                        onClick={() => openAuthModal('login')}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            padding: '16px 24px',
                                            background: 'linear-gradient(135deg, rgb(59, 130, 246), rgb(37, 99, 235))',
                                            border: 'none',
                                            borderRadius: '1rem',
                                            boxShadow: '0 10px 20px rgba(59, 130, 246, 0.2)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            flexShrink: 0
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 15px 30px rgba(59, 130, 246, 0.3)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 10px 20px rgba(59, 130, 246, 0.2)';
                                        }}
                                    >
                                        <LogIn style={{ width: '20px', height: '20px', color: 'white' }} />
                                        <span style={{ 
                                            fontSize: '16px', 
                                            fontWeight: '600', 
                                            color: 'white'
                                        }}>
                                            Увійти
                                        </span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </header>

                    <div style={{
                        marginBottom: '32px',
                        animation: 'fadeIn 0.3s ease-out',
                        animationDelay: '0.1s',
                        animationFillMode: 'both'
                    }}>
                        <AnalysisForm 
                            isAnalyzing={isAnalyzing} 
                            onSubmit={handleAnalysisStart} 
                            onCodeSubmit={handleCodeAnalysis}
                            externalUrl={externalRepoUrl}
                        />
                        
                        {/* Status indicator */}
                        {analysisStatus && isAnalyzing && (
                            <div style={{
                                marginTop: '20px',
                                padding: '16px 24px',
                                background: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                                backdropFilter: 'blur(40px)',
                                border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.25)'}`,
                                borderRadius: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                animation: 'fadeIn 0.3s ease-out'
                            }}>
                                <div className="animate-pulse" style={{
                                    width: '12px',
                                    height: '12px',
                                    background: colors.accent,
                                    borderRadius: '50%',
                                    boxShadow: `0 0 10px ${isDark ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.3)'}`
                                }}></div>
                                <span style={{
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    color: colors.accentLighter
                                }}>
                                    {getStatusMessage(analysisStatus)}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* ── FRS06: General AI Summary ─────────────────────────────────────── */}
                    {analysisStatus === 'COMPLETED' && results.length > 0 && currentRequestId !== null && (
                        <div style={{
                            marginBottom: '32px',
                            animation: 'fadeIn 0.4s ease-out',
                            animationFillMode: 'both'
                        }}>
                            <div style={{
                                background: isDark
                                    ? 'rgba(139, 92, 246, 0.07)'
                                    : 'rgba(139, 92, 246, 0.05)',
                                backdropFilter: 'blur(40px)',
                                border: `1.5px solid ${isDark ? 'rgba(139, 92, 246, 0.35)' : 'rgba(139, 92, 246, 0.3)'}`,
                                borderRadius: '1rem',
                                boxShadow: isDark
                                    ? '0 8px 32px rgba(139, 92, 246, 0.12)'
                                    : '0 4px 20px rgba(139, 92, 246, 0.08)',
                                overflow: 'hidden',
                                transition: 'all 0.3s ease'
                            }}>
                                {/* Header row */}
                                <div style={{
                                    padding: '20px 28px',
                                    borderBottom: summaryText || summaryLoading || summaryError
                                        ? `1px solid ${isDark ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.18)'}`
                                        : 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '16px',
                                    flexWrap: 'wrap'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '4px',
                                            height: '32px',
                                            background: 'linear-gradient(to bottom, rgb(139, 92, 246), rgb(168, 85, 247))',
                                            borderRadius: '9999px'
                                        }} />
                                        <h2 style={{
                                            fontSize: '20px',
                                            fontWeight: '700',
                                            color: isDark ? 'rgb(196, 181, 253)' : 'rgb(109, 40, 217)',
                                            margin: 0
                                        }}>
                                            Загальний висновок ШІ
                                        </h2>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleGetSummary}
                                        disabled={!isAuthenticated || summaryLoading}
                                        title={!isAuthenticated ? 'Авторизуйтесь, щоб використовувати ШІ' : ''}
                                        className={!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            padding: '12px 24px',
                                            background: summaryLoading
                                                ? (isDark ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.12)')
                                                : 'linear-gradient(135deg, rgb(139, 92, 246), rgb(109, 40, 217))',
                                            border: 'none',
                                            borderRadius: '10px',
                                            boxShadow: summaryLoading ? 'none' : '0 6px 20px rgba(139, 92, 246, 0.35)',
                                            cursor: !isAuthenticated ? 'not-allowed' : (summaryLoading ? 'not-allowed' : 'pointer'),
                                            transition: 'all 0.2s',
                                            opacity: !isAuthenticated ? undefined : (summaryLoading ? 0.7 : 1),
                                            flexShrink: 0
                                        }}
                                        onMouseEnter={(e) => {
                                            if (isAuthenticated && !summaryLoading) {
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = '0 10px 28px rgba(139, 92, 246, 0.45)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = summaryLoading ? 'none' : '0 6px 20px rgba(139, 92, 246, 0.35)';
                                        }}
                                    >
                                        {summaryLoading
                                            ? <Loader2 style={{ width: '18px', height: '18px', color: isDark ? 'rgb(196,181,253)' : 'rgb(109,40,217)', animation: 'spin 1s linear infinite' }} />
                                            : <Sparkles style={{ width: '18px', height: '18px', color: 'white' }} />
                                        }
                                        <span style={{
                                            fontSize: '15px',
                                            fontWeight: '600',
                                            color: summaryLoading ? (isDark ? 'rgb(196,181,253)' : 'rgb(109,40,217)') : 'white'
                                        }}>
                                            {summaryLoading ? 'Генерую висновок...' : (summaryText ? 'Оновити висновок' : 'Отримати загальний висновок ШІ')}
                                        </span>
                                    </button>
                                </div>

                                {/* Loading skeleton */}
                                {summaryLoading && (
                                    <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {[100, 85, 92, 70, 88].map((w, i) => (
                                            <div
                                                key={i}
                                                className="animate-pulse"
                                                style={{
                                                    height: '14px',
                                                    width: `${w}%`,
                                                    borderRadius: '6px',
                                                    background: isDark ? 'rgba(139,92,246,0.18)' : 'rgba(139,92,246,0.1)',
                                                    animationDelay: `${i * 80}ms`
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Error state */}
                                {!summaryLoading && summaryError && (
                                    <div style={{
                                        padding: '20px 28px',
                                        color: isDark ? 'rgb(248,113,113)' : 'rgb(185,28,28)',
                                        fontSize: '14px',
                                        lineHeight: '1.6'
                                    }}>
                                        {summaryError}
                                    </div>
                                )}

                                {/* Markdown result */}
                                {!summaryLoading && summaryText && (
                                    <div style={{ padding: '24px 28px' }}>
                                        <ReactMarkdown components={buildSummaryMarkdownComponents()}>
                                            {summaryText}
                                        </ReactMarkdown>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: window.innerWidth < 1024 ? '1fr' : '1fr 2fr',
                        gap: '32px'
                    }}>
                        <section style={{
                            background: colors.bgCard,
                            backdropFilter: 'blur(40px)',
                            border: `1px solid ${colors.borderPrimary}`,
                            borderRadius: '1rem',
                            boxShadow: isDark 
                                ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                                : '0 10px 25px rgba(0, 0, 0, 0.08)',
                            overflow: 'hidden',
                            animation: 'fadeIn 0.3s ease-out',
                            animationDelay: '0.2s',
                            animationFillMode: 'both',
                            transition: 'all 0.3s ease'
                        }}>
                            <div style={{
                                padding: '24px 32px',
                                borderBottom: `1px solid ${colors.borderPrimary}`
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '4px',
                                        height: '32px',
                                        background: 'linear-gradient(to bottom, rgb(59, 130, 246), rgb(6, 182, 212))',
                                        borderRadius: '9999px'
                                    }}></div>
                                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.textPrimary }}>
                                        Лог-повідомлення
                                    </h2>
                                </div>
                            </div>
                            <div className="custom-scrollbar" style={{ 
                                height: '500px', 
                                overflowY: logs.length > 0 ? 'auto' : 'hidden',
                                overflowX: 'hidden'
                            }}>
                                <LogTerminal logs={logs} />
                            </div>
                        </section>

                        <section style={{
                            background: colors.bgCard,
                            backdropFilter: 'blur(40px)',
                            border: `1px solid ${colors.borderPrimary}`,
                            borderRadius: '1rem',
                            boxShadow: isDark 
                                ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                                : '0 10px 25px rgba(0, 0, 0, 0.08)',
                            overflow: 'hidden',
                            animation: 'fadeIn 0.3s ease-out',
                            animationDelay: '0.3s',
                            animationFillMode: 'both',
                            transition: 'all 0.3s ease'
                        }}>
                            <div style={{
                                padding: '24px 32px',
                                borderBottom: `1px solid ${colors.borderPrimary}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '4px',
                                        height: '32px',
                                        background: 'linear-gradient(to bottom, rgb(59, 130, 246), rgb(6, 182, 212))',
                                        borderRadius: '9999px'
                                    }}></div>
                                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.textPrimary }}>
                                        Результати
                                    </h2>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {results.length > 0 && (
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '10px 24px',
                                            borderRadius: '12px',
                                            background: isDark ? 'rgba(251, 191, 36, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                                            border: `1px solid ${isDark ? 'rgba(251, 191, 36, 0.2)' : 'rgba(234, 179, 8, 0.25)'}`
                                        }}>
                                            <div className="animate-pulse" style={{
                                                width: '10px',
                                                height: '10px',
                                                background: colors.warning,
                                                borderRadius: '50%'
                                            }}></div>
                                            <span style={{
                                                fontSize: '16px',
                                                fontWeight: 'bold',
                                                color: colors.warning,
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {results.length} {results.length === 1 ? 'порушення' : 'порушень'}
                                            </span>
                                        </div>
                                    )}
                                    {qualityScore !== null && (
                                        <QualityScoreRing
                                            score={qualityScore}
                                            size={68}
                                            isDark={isDark}
                                            colors={colors}
                                        />
                                    )}
                                </div>
                            </div>
                            <div className="custom-scrollbar" style={{ 
                                height: '500px', 
                                overflowY: results.length > 0 ? 'auto' : 'hidden',
                                overflowX: 'hidden'
                            }}>
                                <ResultsTable
                                    results={results}
                                    isAnalyzing={isAnalyzing}
                                    rawCode={directAnalysisRawCode ?? undefined}
                                />
                            </div>
                        </section>
                    </div>
                </div>

                <ConfigurationModal 
                    isOpen={isConfigModalOpen} 
                    onClose={() => setIsConfigModalOpen(false)} 
                />
                
                <AuthModal
                    isOpen={isAuthModalOpen}
                    onClose={() => setIsAuthModalOpen(false)}
                    initialTab={authModalTab}
                />

                <HistoryModal
                    isOpen={isHistoryModalOpen}
                    onClose={() => setIsHistoryModalOpen(false)}
                    onViewResults={loadHistoryResults}
                />
                
                <UserDashboard
                    isOpen={isDashboardOpen}
                    onClose={() => setIsDashboardOpen(false)}
                    onViewResults={loadHistoryResults}
                    onAnalyzeRepo={(repoUrl) => {
                        setIsDashboardOpen(false);
                        // Set URL in form and start analysis
                        setExternalRepoUrl(repoUrl);
                        // Start analysis automatically
                        handleAnalysisStart(repoUrl);
                        // Clear after a tick to allow re-setting the same URL
                        setTimeout(() => setExternalRepoUrl(undefined), 100);
                    }}
                />
            </div>
        </>
    );
}

export default App;
