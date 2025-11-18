/**
 * Log Terminal Component
 *
 * Displays real-time log messages received during code analysis.
 * Provides color-coded visualization based on log severity levels
 * with automatic scrolling to show the latest messages.
 */

import React, {useEffect, useRef} from 'react';
import {AlertTriangle, CheckCircle, Info, Terminal, XCircle} from 'lucide-react';
import type {LogEntry} from '../services/socket';

/**
 * Props for the LogTerminal component
 */
interface LogTerminalProps {
    /** Array of log entries to display */
    logs: LogEntry[];
}

/**
 * Configuration object mapping log levels to visual properties
 * Defines icons and colors for each severity level
 */
const levelConfig: Record<LogEntry['level'], {
    icon: React.ReactNode;
    color: string;
}> = {
    IGNORE: {
        icon: <Info style={{width: '20px', height: '20px', flexShrink: 0}}/>,
        color: 'rgb(148, 163, 184)',
    },
    INFO: {
        icon: <CheckCircle style={{width: '20px', height: '20px', flexShrink: 0}}/>,
        color: 'rgb(52, 211, 153)',
    },
    WARNING: {
        icon: <AlertTriangle style={{width: '20px', height: '20px', flexShrink: 0}}/>,
        color: 'rgb(251, 191, 36)',
    },
    ERROR: {
        icon: <XCircle style={{width: '20px', height: '20px', flexShrink: 0}}/>,
        color: 'rgb(248, 113, 113)',
    },
};

/**
 * Individual log entry component
 *
 * Renders a single log message with the appropriate icon, color, and animation.
 * Supports hover effects for better UX.
 *
 * @param log - The log entry to display
 * @param index - Position in the log array (used for staggered animations)
 */
const LogEntryComponent: React.FC<{ log: LogEntry; index: number }> = ({log, index}) => {
    // Get configuration for this log level, fallback to INFO if not found
    const config = levelConfig[log.level] ?? levelConfig.INFO;

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
                padding: '16px 32px',
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
            <div style={{color: config.color}}>
                {config.icon}
            </div>
            <div style={{flexGrow: 1, minWidth: 0}}>
                <span style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: config.color,
                    marginRight: '12px'
                }}>
                    {log.level}
                </span>
                <span style={{fontSize: '16px', color: 'white', fontWeight: '500'}}>
                    {log.message}
                </span>
            </div>
        </div>
    );
};

/**
 * Main log terminal component
 *
 * Features:
 * - Auto-scrolling to the latest message- * Empty state with helpful instructions
 * - Staggered entry animations
 * - Responsive scrollable container
 */
export const LogTerminal: React.FC<LogTerminalProps> = ({logs}) => {
    /** Reference to the bottom of the log list for auto-scrolling */
    const logsEndRef = useRef<HTMLDivElement>(null);

    /**
     * Auto-scroll to the latest log entry whenever logs update
     */
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({behavior: 'smooth'});
    }, [logs]);

    return (
        <div className="custom-scrollbar" style={{
            height: '100%',
            display: logs.length > 0 ? 'block' : 'flex',
            flexDirection: 'column'
        }}>
            {logs.length > 0 ? (
                <>
                    {logs.map((log, index) => (
                        <LogEntryComponent key={index} log={log} index={index}/>
                    ))}
                    <div ref={logsEndRef}/>
                </>
            ) : (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 1,
                    minHeight: 0
                }}>
                    <div style={{textAlign: 'center'}}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '1rem',
                            background: 'rgba(255, 255, 255, 0.02)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px',
                            border: '2px solid rgba(255, 255, 255, 0.05)'
                        }}>
                            <Terminal style={{width: '40px', height: '40px', color: 'rgb(71, 85, 105)'}}/>
                        </div>
                        <p style={{fontSize: '18px', fontWeight: '600', color: 'white', marginBottom: '8px'}}>
                            Очікування на запуск аналізу
                        </p>
                        <p style={{fontSize: '16px', color: 'rgb(100, 116, 139)'}}>
                            Введіть URL репозиторію і натисніть "Аналізувати"
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
