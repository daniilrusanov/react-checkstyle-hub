/**
 * User Dashboard Component
 * 
 * Comprehensive dashboard for authenticated users with tabs:
 * - Overview: Statistics and charts
 * - History: Analysis history
 * - Repositories: Saved repositories for quick access
 */

import React, { useState, useEffect } from 'react';
import { 
    X, 
    BarChart3, 
    History, 
    FolderGit2, 
    TrendingUp,
    TrendingDown,
    CheckCircle,
    AlertTriangle,
    Loader2,
    ExternalLink,
    RefreshCw,
    Clock,
    Target,
    Award,
    Zap,
    Calendar
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    Legend
} from 'recharts';
import { useTheme, getThemeColors } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { BACKEND_URL } from '../config';
import { getAuthHeaders, type AnalysisHistoryItem } from '../services/auth';

type TabType = 'overview' | 'history' | 'repositories';

interface UserDashboardProps {
    isOpen: boolean;
    onClose: () => void;
    onViewResults?: (requestId: number, repoUrl?: string) => void;
    onAnalyzeRepo?: (repoUrl: string) => void;
}

interface UserStatistics {
    totalAnalyses: number;
    completedAnalyses: number;
    failedAnalyses: number;
    totalViolations: number;
    uniqueRepositories: number;
}

interface SavedRepository {
    id: number;
    repoUrl: string;
    name: string;
    lastAnalyzedAt: string | null;
    analysisCount: number;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
    isOpen,
    onClose,
    onViewResults,
    onAnalyzeRepo
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [isLoading, setIsLoading] = useState(true);
    const [statistics, setStatistics] = useState<UserStatistics | null>(null);
    const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
    const [savedRepos, setSavedRepos] = useState<SavedRepository[]>([]);
    
    const { isDark } = useTheme();
    const colors = getThemeColors(isDark);
    const { isAuthenticated } = useAuth();

    // Disable body scroll when modal is open
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

    // Load data when dashboard opens
    useEffect(() => {
        if (isOpen && isAuthenticated) {
            loadData();
        }
    }, [isOpen, isAuthenticated]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [statsRes, historyRes] = await Promise.all([
                fetch(`${BACKEND_URL}/api/user/statistics`, { headers: getAuthHeaders() }),
                fetch(`${BACKEND_URL}/api/user/history`, { headers: getAuthHeaders() })
            ]);

            if (statsRes.ok) {
                const stats = await statsRes.json();
                setStatistics(stats);
            }

            if (historyRes.ok) {
                const historyData = await historyRes.json();
                setHistory(historyData);
                
                // Extract unique repositories from history
                const repoMap = new Map<string, SavedRepository>();
                historyData.forEach((item: AnalysisHistoryItem, index: number) => {
                    const url = item.repoUrl;
                    if (!repoMap.has(url)) {
                        repoMap.set(url, {
                            id: index,
                            repoUrl: url,
                            name: extractRepoName(url),
                            lastAnalyzedAt: item.createdAt,
                            analysisCount: 1
                        });
                    } else {
                        const existing = repoMap.get(url)!;
                        existing.analysisCount++;
                    }
                });
                setSavedRepos(Array.from(repoMap.values()));
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const extractRepoName = (url: string): string => {
        try {
            const parts = url.replace('https://github.com/', '').split('/');
            return parts.slice(0, 2).join('/');
        } catch {
            return url;
        }
    };

    const formatDate = (dateString: string | null): string => {
        if (!dateString) return 'Ніколи';
        return new Date(dateString).toLocaleDateString('uk-UA', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Prepare chart data
    const getAnalysisOverTimeData = () => {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            return date.toISOString().split('T')[0];
        });

        return last7Days.map(date => {
            const dayAnalyses = history.filter(h => 
                h.createdAt.split('T')[0] === date
            );
            return {
                date: new Date(date).toLocaleDateString('uk-UA', { weekday: 'short', day: 'numeric' }),
                analyses: dayAnalyses.length,
                violations: dayAnalyses.reduce((sum, h) => sum + (h.violationsCount || 0), 0)
            };
        });
    };

    const getViolationsOverTimeData = () => {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            return date.toISOString().split('T')[0];
        });

        return last7Days.map(date => {
            const dayAnalyses = history.filter(h => 
                h.createdAt.split('T')[0] === date && h.status === 'COMPLETED'
            );
            const totalViolations = dayAnalyses.reduce((sum, h) => sum + (h.violationsCount || 0), 0);
            return {
                date: new Date(date).toLocaleDateString('uk-UA', { weekday: 'short', day: 'numeric' }),
                violations: totalViolations,
                avgViolations: dayAnalyses.length > 0 ? Math.round(totalViolations / dayAnalyses.length) : 0
            };
        });
    };

    const getStatusDistribution = () => {
        if (!statistics) return [];
        return [
            { name: 'Успішні', value: statistics.completedAnalyses, color: colors.success },
            { name: 'Невдалі', value: statistics.failedAnalyses, color: colors.error }
        ].filter(item => item.value > 0);
    };

    const getSuccessRate = (): number => {
        if (!statistics || statistics.totalAnalyses === 0) return 0;
        return Math.round((statistics.completedAnalyses / statistics.totalAnalyses) * 100);
    };

    const getAvgViolationsPerAnalysis = (): number => {
        if (!statistics || statistics.completedAnalyses === 0) return 0;
        return Math.round(statistics.totalViolations / statistics.completedAnalyses);
    };

    const getTopRepositories = () => {
        return savedRepos
            .sort((a, b) => b.analysisCount - a.analysisCount)
            .slice(0, 5);
    };

    const getRecentAnalyses = () => {
        return history.slice(0, 5);
    };

    const getViolationsTrend = (): 'up' | 'down' | 'stable' => {
        const data = getViolationsOverTimeData();
        if (data.length < 2) return 'stable';
        const recent = data.slice(-3).reduce((sum, d) => sum + d.violations, 0);
        const older = data.slice(0, 3).reduce((sum, d) => sum + d.violations, 0);
        if (recent < older * 0.8) return 'down';
        if (recent > older * 1.2) return 'up';
        return 'stable';
    };

    if (!isOpen) return null;

    const tabs = [
        { id: 'overview' as TabType, label: 'Огляд', icon: BarChart3 },
        { id: 'history' as TabType, label: 'Історія', icon: History },
        { id: 'repositories' as TabType, label: 'Репозиторії', icon: FolderGit2 }
    ];

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 50,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
                background: colors.bgOverlay,
                backdropFilter: 'blur(8px)',
                animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                style={{
                    background: colors.bgModal,
                    border: `1px solid ${colors.borderPrimary}`,
                    borderRadius: '16px',
                    width: '100%',
                    maxWidth: '1000px',
                    maxHeight: '85vh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: isDark 
                        ? '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                        : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    animation: 'slideIn 0.3s ease-out'
                }}
            >
                {/* Header */}
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
                            <BarChart3 style={{ width: '24px', height: '24px', color: 'white' }} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.textPrimary, margin: 0 }}>
                                Панель користувача
                            </h2>
                            <p style={{ fontSize: '14px', color: colors.textSecondary, margin: 0 }}>
                                Статистика та історія ваших аналізів
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px',
                            background: 'transparent',
                            border: 'none',
                            borderRadius: '8px',
                            color: colors.textSecondary,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
                            e.currentTarget.style.color = colors.textPrimary;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = colors.textSecondary;
                        }}
                    >
                        <X style={{ width: '24px', height: '24px' }} />
                    </button>
                </div>

                {/* Tabs */}
                <div style={{
                    padding: '16px 32px',
                    borderBottom: `1px solid ${colors.borderPrimary}`,
                    display: 'flex',
                    gap: '8px'
                }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 20px',
                                background: activeTab === tab.id
                                    ? (isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)')
                                    : 'transparent',
                                border: `1px solid ${activeTab === tab.id ? colors.borderAccent : 'transparent'}`,
                                borderRadius: '10px',
                                color: activeTab === tab.id ? colors.accentLight : colors.textSecondary,
                                fontSize: '15px',
                                fontWeight: activeTab === tab.id ? '600' : '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <tab.icon style={{ width: '18px', height: '18px' }} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: '24px 32px'
                }} className="custom-scrollbar">
                    {isLoading ? (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '64px 0'
                        }}>
                            <Loader2 
                                className="animate-spin" 
                                style={{ width: '48px', height: '48px', color: colors.accentLight, marginBottom: '16px' }} 
                            />
                            <p style={{ fontSize: '16px', color: colors.textSecondary }}>
                                Завантаження даних...
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Overview Tab */}
                            {activeTab === 'overview' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    {/* Main Stats Cards */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                                        gap: '16px'
                                    }}>
                                        <StatCard
                                            icon={BarChart3}
                                            label="Всього аналізів"
                                            value={statistics?.totalAnalyses || 0}
                                            color={colors.accent}
                                            isDark={isDark}
                                            colors={colors}
                                        />
                                        <StatCard
                                            icon={CheckCircle}
                                            label="Успішних"
                                            value={statistics?.completedAnalyses || 0}
                                            color={colors.success}
                                            isDark={isDark}
                                            colors={colors}
                                        />
                                        <StatCard
                                            icon={AlertTriangle}
                                            label="Всього порушень"
                                            value={statistics?.totalViolations || 0}
                                            color={colors.warning}
                                            isDark={isDark}
                                            colors={colors}
                                        />
                                        <StatCard
                                            icon={FolderGit2}
                                            label="Репозиторії"
                                            value={statistics?.uniqueRepositories || 0}
                                            color={isDark ? 'rgb(168, 85, 247)' : 'rgb(147, 51, 234)'}
                                            isDark={isDark}
                                            colors={colors}
                                        />
                                    </div>

                                    {/* Key Metrics Row */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                                        gap: '16px'
                                    }}>
                                        {/* Success Rate Widget */}
                                        <div style={{
                                            padding: '24px',
                                            background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                                            border: `1px solid ${colors.borderPrimary}`,
                                            borderRadius: '16px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '10px',
                                                background: `${colors.success}20`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginBottom: '12px'
                                            }}>
                                                <Target style={{ width: '20px', height: '20px', color: colors.success }} />
                                            </div>
                                            <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '8px' }}>
                                                Успішність
                                            </div>
                                            <div style={{ fontSize: '32px', fontWeight: 'bold', color: colors.textPrimary, marginBottom: '16px' }}>
                                                {getSuccessRate()}%
                                            </div>
                                            {/* Progress Bar */}
                                            <div style={{
                                                width: '100%',
                                                height: '8px',
                                                background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                                                borderRadius: '4px',
                                                overflow: 'hidden'
                                            }}>
                                                <div style={{
                                                    height: '100%',
                                                    width: `${getSuccessRate()}%`,
                                                    background: `linear-gradient(90deg, ${colors.success}, ${isDark ? 'rgb(74, 222, 128)' : 'rgb(34, 197, 94)'})`,
                                                    borderRadius: '4px',
                                                    transition: 'width 0.5s ease'
                                                }} />
                                            </div>
                                            <div style={{ 
                                                fontSize: '12px', 
                                                color: colors.textMuted, 
                                                marginTop: '12px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                width: '100%'
                                            }}>
                                                <span>{statistics?.completedAnalyses || 0} успішних</span>
                                                <span>{statistics?.failedAnalyses || 0} невдалих</span>
                                            </div>
                                        </div>

                                        {/* Avg Violations Widget */}
                                        <div style={{
                                            padding: '24px',
                                            background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                                            border: `1px solid ${colors.borderPrimary}`,
                                            borderRadius: '16px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '10px',
                                                background: `${colors.warning}20`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginBottom: '12px'
                                            }}>
                                                <Zap style={{ width: '20px', height: '20px', color: colors.warning }} />
                                            </div>
                                            <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '8px' }}>
                                                Середнє порушень
                                            </div>
                                            <div style={{ fontSize: '32px', fontWeight: 'bold', color: colors.textPrimary, marginBottom: '16px' }}>
                                                {getAvgViolationsPerAnalysis()}
                                            </div>
                                            <div style={{ 
                                                display: 'flex', 
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                fontSize: '13px'
                                            }}>
                                                {getViolationsTrend() === 'down' ? (
                                                    <>
                                                        <TrendingDown style={{ width: '16px', height: '16px', color: colors.success }} />
                                                        <span style={{ color: colors.success }}>Тренд покращується</span>
                                                    </>
                                                ) : getViolationsTrend() === 'up' ? (
                                                    <>
                                                        <TrendingUp style={{ width: '16px', height: '16px', color: colors.error }} />
                                                        <span style={{ color: colors.error }}>Тренд погіршується</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Target style={{ width: '16px', height: '16px', color: colors.textMuted }} />
                                                        <span style={{ color: colors.textMuted }}>Стабільно</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Last Analysis Widget */}
                                        {history.length > 0 && (
                                            <div style={{
                                                padding: '24px',
                                                background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                                                border: `1px solid ${colors.borderPrimary}`,
                                                borderRadius: '16px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                textAlign: 'center'
                                            }}>
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '10px',
                                                    background: `${colors.accent}20`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    marginBottom: '12px'
                                                }}>
                                                    <Clock style={{ width: '20px', height: '20px', color: colors.accent }} />
                                                </div>
                                                <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '8px' }}>
                                                    Останній аналіз
                                                </div>
                                                <div style={{ fontSize: '18px', fontWeight: '600', color: colors.textPrimary, marginBottom: '12px' }}>
                                                    {formatDate(history[0].createdAt)}
                                                </div>
                                                <div style={{
                                                    fontSize: '13px',
                                                    color: colors.textSecondary,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    maxWidth: '100%'
                                                }}>
                                                    {extractRepoName(history[0].repoUrl)}
                                                </div>
                                                {history[0].violationsCount !== null && (
                                                    <div style={{
                                                        marginTop: '12px',
                                                        padding: '6px 12px',
                                                        background: `${colors.warning}15`,
                                                        borderRadius: '6px',
                                                        fontSize: '12px',
                                                        color: colors.warning,
                                                        fontWeight: '500'
                                                    }}>
                                                        {history[0].violationsCount} порушень
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Charts Row */}
                                    {history.length > 0 && (
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                                            gap: '24px'
                                        }}>
                                            {/* Activity Chart */}
                                            <div style={{
                                                padding: '24px',
                                                background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                                                border: `1px solid ${colors.borderPrimary}`,
                                                borderRadius: '16px'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
                                                    <Calendar style={{ width: '18px', height: '18px', color: colors.accent }} />
                                                    <h3 style={{ 
                                                        fontSize: '16px', 
                                                        fontWeight: '600', 
                                                        color: colors.textPrimary,
                                                        margin: 0
                                                    }}>
                                                        Активність за тиждень
                                                    </h3>
                                                </div>
                                                <ResponsiveContainer width="100%" height={200}>
                                                    <AreaChart data={getAnalysisOverTimeData()}>
                                                        <defs>
                                                            <linearGradient id="colorAnalyses" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor={colors.accent} stopOpacity={0.3}/>
                                                                <stop offset="95%" stopColor={colors.accent} stopOpacity={0}/>
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" stroke={colors.borderPrimary} />
                                                        <XAxis 
                                                            dataKey="date" 
                                                            tick={{ fill: colors.textSecondary, fontSize: 11 }}
                                                            axisLine={{ stroke: colors.borderPrimary }}
                                                        />
                                                        <YAxis 
                                                            tick={{ fill: colors.textSecondary, fontSize: 11 }}
                                                            axisLine={{ stroke: colors.borderPrimary }}
                                                            width={30}
                                                        />
                                                        <Tooltip 
                                                            contentStyle={{
                                                                background: colors.bgModal,
                                                                border: `1px solid ${colors.borderPrimary}`,
                                                                borderRadius: '8px',
                                                                color: colors.textPrimary,
                                                                fontSize: '13px'
                                                            }}
                                                        />
                                                        <Area 
                                                            type="monotone" 
                                                            dataKey="analyses" 
                                                            stroke={colors.accent}
                                                            fillOpacity={1}
                                                            fill="url(#colorAnalyses)"
                                                            name="Аналізи"
                                                        />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>

                                            {/* Violations Trend Chart */}
                                            <div style={{
                                                padding: '24px',
                                                background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                                                border: `1px solid ${colors.borderPrimary}`,
                                                borderRadius: '16px'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
                                                    <AlertTriangle style={{ width: '18px', height: '18px', color: colors.warning }} />
                                                    <h3 style={{ 
                                                        fontSize: '16px', 
                                                        fontWeight: '600', 
                                                        color: colors.textPrimary,
                                                        margin: 0
                                                    }}>
                                                        Порушення за тиждень
                                                    </h3>
                                                </div>
                                                <ResponsiveContainer width="100%" height={200}>
                                                    <BarChart data={getViolationsOverTimeData()}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke={colors.borderPrimary} />
                                                        <XAxis 
                                                            dataKey="date" 
                                                            tick={{ fill: colors.textSecondary, fontSize: 11 }}
                                                            axisLine={{ stroke: colors.borderPrimary }}
                                                        />
                                                        <YAxis 
                                                            tick={{ fill: colors.textSecondary, fontSize: 11 }}
                                                            axisLine={{ stroke: colors.borderPrimary }}
                                                            width={30}
                                                        />
                                                        <Tooltip 
                                                            contentStyle={{
                                                                background: colors.bgModal,
                                                                border: `1px solid ${colors.borderPrimary}`,
                                                                borderRadius: '8px',
                                                                color: colors.textPrimary,
                                                                fontSize: '13px'
                                                            }}
                                                        />
                                                        <Bar 
                                                            dataKey="violations" 
                                                            fill={colors.warning}
                                                            radius={[4, 4, 0, 0]}
                                                            name="Порушення"
                                                        />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    )}

                                    {/* Bottom Row - Recent & Top Repos */}
                                    {history.length > 0 && (
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                                            gap: '24px'
                                        }}>
                                            {/* Recent Analyses */}
                                            <div style={{
                                                padding: '24px',
                                                background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                                                border: `1px solid ${colors.borderPrimary}`,
                                                borderRadius: '16px'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
                                                    <History style={{ width: '18px', height: '18px', color: colors.accentLight }} />
                                                    <h3 style={{ 
                                                        fontSize: '16px', 
                                                        fontWeight: '600', 
                                                        color: colors.textPrimary,
                                                        margin: 0
                                                    }}>
                                                        Останні аналізи
                                                    </h3>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                    {getRecentAnalyses().map((item) => (
                                                        <div
                                                            key={item.id}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between',
                                                                padding: '10px 12px',
                                                                background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                                                                borderRadius: '8px',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s'
                                                            }}
                                                            onClick={() => {
                                                                if (item.status === 'COMPLETED' && onViewResults) {
                                                                    onViewResults(item.id, item.repoUrl);
                                                                    onClose();
                                                                }
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';
                                                            }}
                                                        >
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                                                                <div style={{
                                                                    width: '8px',
                                                                    height: '8px',
                                                                    borderRadius: '50%',
                                                                    background: item.status === 'COMPLETED' ? colors.success : 
                                                                               item.status === 'FAILED' ? colors.error : colors.accent,
                                                                    flexShrink: 0
                                                                }} />
                                                                <span style={{
                                                                    fontSize: '13px',
                                                                    color: colors.textPrimary,
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap'
                                                                }}>
                                                                    {extractRepoName(item.repoUrl)}
                                                                </span>
                                                            </div>
                                                            {item.violationsCount !== null && (
                                                                <span style={{
                                                                    fontSize: '12px',
                                                                    color: colors.warning,
                                                                    fontWeight: '600',
                                                                    flexShrink: 0
                                                                }}>
                                                                    {item.violationsCount}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Top Repositories */}
                                            {getTopRepositories().length > 0 && (
                                                <div style={{
                                                    padding: '24px',
                                                    background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                                                    border: `1px solid ${colors.borderPrimary}`,
                                                    borderRadius: '16px'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
                                                        <Award style={{ width: '18px', height: '18px', color: isDark ? 'rgb(168, 85, 247)' : 'rgb(147, 51, 234)' }} />
                                                        <h3 style={{ 
                                                            fontSize: '16px', 
                                                            fontWeight: '600', 
                                                            color: colors.textPrimary,
                                                            margin: 0
                                                        }}>
                                                            Топ репозиторії
                                                        </h3>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                        {getTopRepositories().map((repo, index) => (
                                                            <div
                                                                key={repo.id}
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'space-between',
                                                                    padding: '10px 12px',
                                                                    background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                                                                    borderRadius: '8px'
                                                                }}
                                                            >
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                                                                    <span style={{
                                                                        width: '20px',
                                                                        height: '20px',
                                                                        borderRadius: '50%',
                                                                        background: index === 0 ? 'linear-gradient(135deg, #FFD700, #FFA500)' :
                                                                                   index === 1 ? 'linear-gradient(135deg, #C0C0C0, #A8A8A8)' :
                                                                                   index === 2 ? 'linear-gradient(135deg, #CD7F32, #8B4513)' :
                                                                                   colors.borderSecondary,
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        fontSize: '11px',
                                                                        fontWeight: 'bold',
                                                                        color: index < 3 ? 'white' : colors.textSecondary,
                                                                        flexShrink: 0
                                                                    }}>
                                                                        {index + 1}
                                                                    </span>
                                                                    <span style={{
                                                                        fontSize: '13px',
                                                                        color: colors.textPrimary,
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis',
                                                                        whiteSpace: 'nowrap'
                                                                    }}>
                                                                        {repo.name}
                                                                    </span>
                                                                </div>
                                                                <span style={{
                                                                    fontSize: '12px',
                                                                    color: colors.textSecondary,
                                                                    flexShrink: 0
                                                                }}>
                                                                    {repo.analysisCount} аналізів
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Status Distribution Pie */}
                                            {getStatusDistribution().length > 0 && (
                                                <div style={{
                                                    padding: '24px',
                                                    background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                                                    border: `1px solid ${colors.borderPrimary}`,
                                                    borderRadius: '16px'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
                                                        <CheckCircle style={{ width: '18px', height: '18px', color: colors.success }} />
                                                        <h3 style={{ 
                                                            fontSize: '16px', 
                                                            fontWeight: '600', 
                                                            color: colors.textPrimary,
                                                            margin: 0
                                                        }}>
                                                            Розподіл статусів
                                                        </h3>
                                                    </div>
                                                    <ResponsiveContainer width="100%" height={160}>
                                                        <PieChart>
                                                            <Pie
                                                                data={getStatusDistribution()}
                                                                cx="50%"
                                                                cy="50%"
                                                                innerRadius={40}
                                                                outerRadius={65}
                                                                paddingAngle={5}
                                                                dataKey="value"
                                                            >
                                                                {getStatusDistribution().map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip 
                                                                contentStyle={{
                                                                    background: colors.bgModal,
                                                                    border: `1px solid ${colors.borderPrimary}`,
                                                                    borderRadius: '8px',
                                                                    color: colors.textPrimary,
                                                                    fontSize: '13px'
                                                                }}
                                                            />
                                                            <Legend 
                                                                formatter={(value) => (
                                                                    <span style={{ color: colors.textSecondary, fontSize: '12px' }}>{value}</span>
                                                                )}
                                                            />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {history.length === 0 && (
                                        <div style={{
                                            textAlign: 'center',
                                            padding: '48px',
                                            color: colors.textSecondary
                                        }}>
                                            <BarChart3 style={{ width: '48px', height: '48px', margin: '0 auto 16px', opacity: 0.5 }} />
                                            <p>Поки немає даних для відображення</p>
                                            <p style={{ fontSize: '14px', marginTop: '8px' }}>
                                                Виконайте перший аналіз, щоб побачити статистику
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* History Tab */}
                            {activeTab === 'history' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {history.length === 0 ? (
                                        <div style={{
                                            textAlign: 'center',
                                            padding: '48px',
                                            color: colors.textSecondary
                                        }}>
                                            <History style={{ width: '48px', height: '48px', margin: '0 auto 16px', opacity: 0.5 }} />
                                            <p>Історія аналізів порожня</p>
                                        </div>
                                    ) : (
                                        history.map((item) => (
                                            <div
                                                key={item.id}
                                                style={{
                                                    padding: '20px',
                                                    background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                                                    border: `1px solid ${colors.borderPrimary}`,
                                                    borderRadius: '12px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    gap: '16px',
                                                    transition: 'all 0.2s',
                                                    cursor: item.status === 'COMPLETED' ? 'pointer' : 'default'
                                                }}
                                                onClick={() => {
                                                    // For completed analyses, show results; otherwise do nothing
                                                    if (item.status === 'COMPLETED' && onViewResults) {
                                                        onViewResults(item.id, item.repoUrl);
                                                        onClose();
                                                    }
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (item.status === 'COMPLETED') {
                                                        e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
                                                        e.currentTarget.style.borderColor = colors.borderAccent;
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';
                                                    e.currentTarget.style.borderColor = colors.borderPrimary;
                                                }}
                                            >
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ 
                                                        fontSize: '15px', 
                                                        fontWeight: '600', 
                                                        color: colors.textPrimary,
                                                        marginBottom: '4px',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {extractRepoName(item.repoUrl)}
                                                    </div>
                                                    <div style={{ fontSize: '13px', color: colors.textMuted }}>
                                                        {formatDate(item.createdAt)}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    {item.violationsCount !== null && item.violationsCount !== undefined && (
                                                        <span style={{
                                                            padding: '4px 12px',
                                                            background: isDark ? 'rgba(251, 191, 36, 0.15)' : 'rgba(234, 179, 8, 0.12)',
                                                            border: `1px solid ${isDark ? 'rgba(251, 191, 36, 0.3)' : 'rgba(234, 179, 8, 0.25)'}`,
                                                            borderRadius: '6px',
                                                            fontSize: '13px',
                                                            fontWeight: '600',
                                                            color: colors.warning
                                                        }}>
                                                            {item.violationsCount} порушень
                                                        </span>
                                                    )}
                                                    <span style={{
                                                        padding: '4px 12px',
                                                        borderRadius: '6px',
                                                        fontSize: '12px',
                                                        fontWeight: '600',
                                                        background: item.status === 'COMPLETED'
                                                            ? (isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(22, 163, 74, 0.12)')
                                                            : item.status === 'FAILED'
                                                                ? (isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(220, 38, 38, 0.12)')
                                                                : (isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.12)'),
                                                        color: item.status === 'COMPLETED'
                                                            ? colors.success
                                                            : item.status === 'FAILED'
                                                                ? colors.error
                                                                : colors.accent,
                                                        border: `1px solid ${item.status === 'COMPLETED'
                                                            ? (isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(22, 163, 74, 0.25)')
                                                            : item.status === 'FAILED'
                                                                ? (isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(220, 38, 38, 0.25)')
                                                                : (isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.25)')}`
                                                    }}>
                                                        {item.status === 'COMPLETED' ? 'Успішно' : 
                                                         item.status === 'FAILED' ? 'Помилка' : item.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* Repositories Tab */}
                            {activeTab === 'repositories' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {savedRepos.length === 0 ? (
                                        <div style={{
                                            textAlign: 'center',
                                            padding: '48px',
                                            color: colors.textSecondary
                                        }}>
                                            <FolderGit2 style={{ width: '48px', height: '48px', margin: '0 auto 16px', opacity: 0.5 }} />
                                            <p>Немає збережених репозиторіїв</p>
                                            <p style={{ fontSize: '14px', marginTop: '8px' }}>
                                                Проаналізуйте репозиторій, щоб він з'явився тут
                                            </p>
                                        </div>
                                    ) : (
                                        savedRepos.map((repo) => (
                                            <div
                                                key={repo.id}
                                                style={{
                                                    padding: '20px',
                                                    background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                                                    border: `1px solid ${colors.borderPrimary}`,
                                                    borderRadius: '12px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    gap: '16px'
                                                }}
                                            >
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ 
                                                        fontSize: '15px', 
                                                        fontWeight: '600', 
                                                        color: colors.textPrimary,
                                                        marginBottom: '4px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px'
                                                    }}>
                                                        <FolderGit2 style={{ width: '16px', height: '16px', color: colors.accentLight, flexShrink: 0 }} />
                                                        {repo.name}
                                                    </div>
                                                    <div style={{ fontSize: '13px', color: colors.textMuted, marginLeft: '24px' }}>
                                                        {repo.analysisCount} {repo.analysisCount === 1 ? 'аналіз' : 'аналізів'} • 
                                                        Останній: {formatDate(repo.lastAnalyzedAt)}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        onClick={() => {
                                                            if (onAnalyzeRepo) {
                                                                onAnalyzeRepo(repo.repoUrl);
                                                                onClose();
                                                            }
                                                        }}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            padding: '10px 16px',
                                                            background: `linear-gradient(135deg, ${colors.accent}, ${isDark ? 'rgb(6, 182, 212)' : 'rgb(14, 165, 233)'})`,
                                                            border: 'none',
                                                            borderRadius: '8px',
                                                            color: 'white',
                                                            fontSize: '13px',
                                                            fontWeight: '600',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.transform = 'scale(1.02)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.transform = 'scale(1)';
                                                        }}
                                                    >
                                                        <RefreshCw style={{ width: '14px', height: '14px' }} />
                                                        Аналізувати
                                                    </button>
                                                    <a
                                                        href={repo.repoUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            padding: '10px',
                                                            background: 'transparent',
                                                            border: `1px solid ${colors.borderSecondary}`,
                                                            borderRadius: '8px',
                                                            color: colors.textSecondary,
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s',
                                                            textDecoration: 'none'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.borderColor = colors.accent;
                                                            e.currentTarget.style.color = colors.accent;
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.borderColor = colors.borderSecondary;
                                                            e.currentTarget.style.color = colors.textSecondary;
                                                        }}
                                                    >
                                                        <ExternalLink style={{ width: '16px', height: '16px' }} />
                                                    </a>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// Stat Card Component
interface StatCardProps {
    icon: React.ComponentType<{ style?: React.CSSProperties }>;
    label: string;
    value: number;
    color: string;
    isDark: boolean;
    colors: ReturnType<typeof getThemeColors>;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, color, isDark, colors }) => (
    <div style={{
        padding: '20px',
        background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
        border: `1px solid ${colors.borderPrimary}`,
        borderRadius: '12px',
        transition: 'all 0.2s',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        minHeight: '160px'
    }}>
        {/* Icon at top */}
        <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: `${color}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <Icon style={{ width: '20px', height: '20px', color }} />
        </div>
        {/* Value centered vertically */}
        <div style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            color: colors.textPrimary,
            marginTop: 'auto',
            marginBottom: 'auto',
            lineHeight: 1
        }}>
            {value.toLocaleString()}
        </div>
        {/* Label at bottom */}
        <div style={{ fontSize: '13px', color: colors.textSecondary }}>
            {label}
        </div>
    </div>
);
