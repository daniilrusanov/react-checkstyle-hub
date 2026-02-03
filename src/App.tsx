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
import { Settings, LogIn } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
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
import { startAnalysis, fetchResults, pollStatus, analyzeCode, type AnalysisResult, type AnalysisStatus } from './services/api';
import { connectWebSocket, type LogEntry } from './services/socket';
import './index.css';

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
    const [, setCurrentRequestId] = useState<string | null>(null);
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
    const loadHistoryResults = async (requestId: number) => {
        try {
            const results = await fetchResults(String(requestId));
            setResults(results);
            setLogs([{ level: 'INFO', message: `Завантажено ${results.length} результатів з історії` }]);
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
            
            await pollStatus(requestId, (status) => {
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
     */
    const handleCodeAnalysis = async (code: string, fileName?: string) => {
        if (isAnalyzing) return;

        setIsAnalyzing(true);
        setLogs([]);
        setResults([]);
        setAnalysisStatus(null);

        try {
            setLogs(prev => [...prev, { level: 'INFO', message: 'Починаю аналіз коду...' }]);
            
            if (fileName) {
                setLogs(prev => [...prev, { level: 'INFO', message: `Файл: ${fileName}` }]);
            }

            setLogs(prev => [...prev, { level: 'INFO', message: 'Перевірка компіляції...' }]);

            const result = await analyzeCode({
                code,
                fileName,
                checkCompilation: true
            });

            if (!result.success) {
                setLogs(prev => [...prev, { level: 'ERROR', message: `Помилка: ${result.errorMessage}` }]);
                setAnalysisStatus('FAILED');
                return;
            }

            // Log compilation results
            if (result.compilationSuccess !== undefined) {
                if (result.compilationSuccess) {
                    setLogs(prev => [...prev, { level: 'INFO', message: '✅ Код успішно компілюється' }]);
                } else {
                    setLogs(prev => [...prev, { level: 'WARNING', message: '❌ Код не компілюється' }]);
                    for (const error of result.compilationErrors) {
                        setLogs(prev => [...prev, { 
                            level: 'ERROR', 
                            message: `Рядок ${error.lineNumber}: ${error.message}` 
                        }]);
                    }
                }
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

            // Log quality score
            if (result.qualityScore !== undefined) {
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
                            </div>
                            <div className="custom-scrollbar" style={{ 
                                height: '500px', 
                                overflowY: results.length > 0 ? 'auto' : 'hidden',
                                overflowX: 'hidden'
                            }}>
                                <ResultsTable results={results} isAnalyzing={isAnalyzing} />
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
                        // Set URL in form (will switch to URL tab automatically)
                        setExternalRepoUrl(repoUrl);
                        // Clear after a tick to allow re-setting the same URL
                        setTimeout(() => setExternalRepoUrl(undefined), 100);
                    }}
                />
            </div>
        </>
    );
}

export default App;
