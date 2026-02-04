/**
 * History Modal Component
 * 
 * Displays user's analysis history with statistics.
 */

import { useState, useEffect } from 'react';
import { X, History, AlertCircle, CheckCircle, Clock, ExternalLink, BarChart3 } from 'lucide-react';
import { getAnalysisHistory, getUserStatistics, type AnalysisHistoryItem, type UserStatistics } from '../services/auth';
import { useTheme, getThemeColors } from '../context/ThemeContext';

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onViewResults?: (requestId: number) => void;
}

export const HistoryModal = ({ isOpen, onClose, onViewResults }: HistoryModalProps) => {
    const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
    const [stats, setStats] = useState<UserStatistics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'history' | 'stats'>('history');
    const { isDark } = useTheme();
    const colors = getThemeColors(isDark);

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

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [historyData, statsData] = await Promise.all([
                getAnalysisHistory(),
                getUserStatistics()
            ]);
            setHistory(historyData);
            setStats(statsData);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return <CheckCircle size={18} style={{ color: 'rgb(34, 197, 94)' }} />;
            case 'FAILED':
                return <AlertCircle size={18} style={{ color: 'rgb(239, 68, 68)' }} />;
            default:
                return <Clock size={18} style={{ color: 'rgb(251, 191, 36)' }} />;
        }
    };

    const getStatusText = (status: string) => {
        const statusMap: Record<string, string> = {
            'COMPLETED': 'Завершено',
            'FAILED': 'Помилка',
            'PENDING': 'Очікування',
            'CLONING': 'Клонування',
            'ANALYZING': 'Аналіз'
        };
        return statusMap[status] || status;
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('uk-UA', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const extractRepoName = (url: string) => {
        const match = url.match(/github\.com\/([^/]+\/[^/]+)/);
        return match ? match[1] : url;
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
                maxWidth: '800px',
                maxHeight: '80vh',
                background: isDark 
                    ? 'linear-gradient(to bottom right, rgb(15, 23, 42), rgb(30, 41, 59))'
                    : 'linear-gradient(to bottom right, rgb(255, 255, 255), rgb(248, 250, 252))',
                borderRadius: '24px',
                border: `1px solid ${colors.borderSecondary}`,
                boxShadow: isDark 
                    ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    : '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{
                    padding: '24px',
                    borderBottom: `1px solid ${colors.borderSecondary}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexShrink: 0
                }}>
                    <h2 style={{ 
                        fontSize: '24px', 
                        fontWeight: 'bold', 
                        color: colors.textPrimary,
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <History size={28} style={{ color: colors.accentLight }} />
                        Мої аналізи
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
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div style={{
                    display: 'flex',
                    borderBottom: `1px solid ${colors.borderSecondary}`,
                    flexShrink: 0
                }}>
                    <button
                        onClick={() => setActiveTab('history')}
                        style={{
                            flex: 1,
                            padding: '16px',
                            background: activeTab === 'history' 
                                ? (isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)')
                                : 'transparent',
                            border: 'none',
                            borderBottom: activeTab === 'history' ? '2px solid rgb(59, 130, 246)' : '2px solid transparent',
                            color: activeTab === 'history' ? colors.accentLight : colors.textSecondary,
                            fontSize: '15px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                    >
                        <History size={18} />
                        Історія
                    </button>
                    <button
                        onClick={() => setActiveTab('stats')}
                        style={{
                            flex: 1,
                            padding: '16px',
                            background: activeTab === 'stats' 
                                ? (isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)')
                                : 'transparent',
                            border: 'none',
                            borderBottom: activeTab === 'stats' ? '2px solid rgb(59, 130, 246)' : '2px solid transparent',
                            color: activeTab === 'stats' ? colors.accentLight : colors.textSecondary,
                            fontSize: '15px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                    >
                        <BarChart3 size={18} />
                        Статистика
                    </button>
                </div>

                {/* Content */}
                <div style={{ 
                    flex: 1, 
                    overflow: 'auto',
                    padding: '24px'
                }} className="custom-scrollbar">
                    {isLoading ? (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '200px',
                            color: colors.textSecondary
                        }}>
                            <div className="animate-spin" style={{
                                width: '32px',
                                height: '32px',
                                border: '3px solid rgba(59, 130, 246, 0.2)',
                                borderTopColor: 'rgb(59, 130, 246)',
                                borderRadius: '50%'
                            }} />
                        </div>
                    ) : activeTab === 'history' ? (
                        history.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '60px 20px',
                                color: colors.textSecondary
                            }}>
                                <History size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                                <p style={{ fontSize: '18px', margin: 0 }}>
                                    Ви ще не проводили аналізів
                                </p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {history.map((item) => (
                                    <div
                                        key={item.id}
                                        style={{
                                            padding: '16px 20px',
                                            background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                                            border: `1px solid ${colors.borderPrimary}`,
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '16px',
                                            transition: 'all 0.2s',
                                            cursor: item.status === 'COMPLETED' && onViewResults ? 'pointer' : 'default'
                                        }}
                                        onClick={() => {
                                            if (item.status === 'COMPLETED' && onViewResults) {
                                                onViewResults(item.id);
                                                onClose();
                                            }
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = isDark 
                                                ? 'rgba(255, 255, 255, 0.05)'
                                                : 'rgba(0, 0, 0, 0.04)';
                                            e.currentTarget.style.borderColor = colors.borderAccent;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = isDark 
                                                ? 'rgba(255, 255, 255, 0.03)'
                                                : 'rgba(0, 0, 0, 0.02)';
                                            e.currentTarget.style.borderColor = colors.borderPrimary;
                                        }}
                                    >
                                        {getStatusIcon(item.status)}
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
                                                {extractRepoName(item.repoUrl)}
                                                <a
                                                    href={item.repoUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    style={{ color: colors.accentLight }}
                                                >
                                                    <ExternalLink size={14} />
                                                </a>
                                            </div>
                                            <div style={{
                                                fontSize: '13px',
                                                color: colors.textSecondary,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px'
                                            }}>
                                                <span>{formatDate(item.createdAt)}</span>
                                                <span style={{
                                                    padding: '2px 8px',
                                                    background: item.status === 'COMPLETED' 
                                                        ? (isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(22, 163, 74, 0.1)')
                                                        : item.status === 'FAILED' 
                                                            ? (isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(220, 38, 38, 0.1)')
                                                            : (isDark ? 'rgba(251, 191, 36, 0.1)' : 'rgba(202, 138, 4, 0.1)'),
                                                    borderRadius: '4px',
                                                    color: item.status === 'COMPLETED' 
                                                        ? colors.success 
                                                        : item.status === 'FAILED' 
                                                            ? colors.error 
                                                            : colors.warning,
                                                    fontSize: '12px'
                                                }}>
                                                    {getStatusText(item.status)}
                                                </span>
                                            </div>
                                        </div>
                                        {item.violationsCount !== null && (
                                            <div style={{
                                                padding: '8px 16px',
                                                background: isDark ? 'rgba(251, 191, 36, 0.1)' : 'rgba(202, 138, 4, 0.1)',
                                                borderRadius: '8px',
                                                color: colors.warning,
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {item.violationsCount} порушень
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        /* Statistics tab */
                        stats && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                                <div style={{
                                    padding: '24px',
                                    background: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                                    border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.25)'}`,
                                    borderRadius: '16px',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: colors.accentLight }}>
                                        {stats.totalAnalyses}
                                    </div>
                                    <div style={{ fontSize: '14px', color: colors.textSecondary, marginTop: '4px' }}>
                                        Всього аналізів
                                    </div>
                                </div>
                                <div style={{
                                    padding: '24px',
                                    background: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(22, 163, 74, 0.08)',
                                    border: `1px solid ${isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(22, 163, 74, 0.25)'}`,
                                    borderRadius: '16px',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: colors.success }}>
                                        {stats.completedAnalyses}
                                    </div>
                                    <div style={{ fontSize: '14px', color: colors.textSecondary, marginTop: '4px' }}>
                                        Успішних
                                    </div>
                                </div>
                                <div style={{
                                    padding: '24px',
                                    background: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(220, 38, 38, 0.08)',
                                    border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(220, 38, 38, 0.25)'}`,
                                    borderRadius: '16px',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: colors.error }}>
                                        {stats.failedAnalyses}
                                    </div>
                                    <div style={{ fontSize: '14px', color: colors.textSecondary, marginTop: '4px' }}>
                                        Помилок
                                    </div>
                                </div>
                                <div style={{
                                    padding: '24px',
                                    background: isDark ? 'rgba(251, 191, 36, 0.1)' : 'rgba(202, 138, 4, 0.08)',
                                    border: `1px solid ${isDark ? 'rgba(251, 191, 36, 0.2)' : 'rgba(202, 138, 4, 0.25)'}`,
                                    borderRadius: '16px',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: colors.warning }}>
                                        {stats.totalViolations}
                                    </div>
                                    <div style={{ fontSize: '14px', color: colors.textSecondary, marginTop: '4px' }}>
                                        Всього порушень
                                    </div>
                                </div>
                                <div style={{
                                    padding: '24px',
                                    background: isDark ? 'rgba(168, 85, 247, 0.1)' : 'rgba(147, 51, 234, 0.08)',
                                    border: `1px solid ${isDark ? 'rgba(168, 85, 247, 0.2)' : 'rgba(147, 51, 234, 0.25)'}`,
                                    borderRadius: '16px',
                                    textAlign: 'center',
                                    gridColumn: 'span 2'
                                }}>
                                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: isDark ? 'rgb(168, 85, 247)' : 'rgb(147, 51, 234)' }}>
                                        {stats.uniqueRepositories}
                                    </div>
                                    <div style={{ fontSize: '14px', color: colors.textSecondary, marginTop: '4px' }}>
                                        Унікальних репозиторіїв
                                    </div>
                                </div>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};
