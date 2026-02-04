/**
 * Analysis Form Component
 *
 * Provides a user interface for submitting code for Checkstyle analysis.
 * Supports two modes:
 * - GitHub repository URL analysis
 * - Direct code input (paste or file upload)
 */

import React, { useState, useRef, useEffect, type DragEvent } from 'react';
import { CheckCircle, Github, Loader2, Code, Upload, FileCode, X } from 'lucide-react';
import { useTheme, getThemeColors } from '../context/ThemeContext';

/** Analysis input mode */
type InputMode = 'url' | 'code';

/**
 * Props for the AnalysisForm component
 */
interface AnalysisFormProps {
    /** Whether an analysis is currently in progress */
    isAnalyzing: boolean;
    /** Callback invoked when a URL is submitted */
    onSubmit: (url: string) => void;
    /** Callback invoked when code is submitted directly */
    onCodeSubmit?: (code: string, fileName?: string, checkCompilation?: boolean) => void;
    /** External URL to set (e.g., from history) - will switch to URL mode */
    externalUrl?: string;
}

/**
 * Form component for initiating code analysis
 *
 * Features:
 * - Tab switching between URL and Code modes
 * - URL input with validation
 * - Code textarea with syntax highlighting support
 * - File drag & drop zone
 * - Visual feedback and loading states
 */
export const AnalysisForm: React.FC<AnalysisFormProps> = ({ 
    isAnalyzing, 
    onSubmit, 
    onCodeSubmit,
    externalUrl
}) => {
    /** Current input mode */
    const [mode, setMode] = useState<InputMode>('url');
    /** Repository URL input value */
    const [repoUrl, setRepoUrl] = useState('');
    
    // Handle external URL changes (e.g., from history re-analysis)
    useEffect(() => {
        if (externalUrl) {
            setMode('url');
            setRepoUrl(externalUrl);
        }
    }, [externalUrl]);
    /** Direct code input value */
    const [code, setCode] = useState('');
    /** Uploaded file name */
    const [fileName, setFileName] = useState<string | null>(null);
    /** Whether file is being dragged over */
    const [isDragging, setIsDragging] = useState(false);
    /** Whether to check compilation (disabled by default for code with external dependencies) */
    const [checkCompilation, setCheckCompilation] = useState(false);
    
    /** File input ref for programmatic access */
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    /** Theme context */
    const { isDark } = useTheme();
    const colors = getThemeColors(isDark);

    /**
     * Handle form submission based on current mode
     */
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isAnalyzing) return;
        
        if (mode === 'url') {
            if (!repoUrl.trim()) return;
            onSubmit(repoUrl);
        } else {
            if (!code.trim()) return;
            onCodeSubmit?.(code, fileName || undefined, checkCompilation);
        }
    };

    /**
     * Handle file selection via input or drag & drop
     */
    const handleFileSelect = async (file: File) => {
        if (!file.name.endsWith('.java')) {
            alert('Будь ласка, виберіть файл з розширенням .java');
            return;
        }
        
        try {
            const text = await file.text();
            setCode(text);
            setFileName(file.name);
        } catch {
            alert('Не вдалося прочитати файл');
        }
    };

    /**
     * Handle file input change
     */
    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    /**
     * Handle drag over event
     */
    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    /**
     * Handle drag leave event
     */
    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    /**
     * Handle file drop
     */
    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        
        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    /**
     * Clear the code input
     */
    const clearCode = () => {
        setCode('');
        setFileName(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{
            background: colors.bgCard,
            backdropFilter: 'blur(40px)',
            border: `1px solid ${colors.borderPrimary}`,
            borderRadius: '1rem',
            boxShadow: isDark 
                ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                : '0 10px 25px rgba(0, 0, 0, 0.08)',
            padding: '32px',
            transition: 'all 0.3s ease'
        }}>
            {/* Mode Tabs */}
            <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '24px',
                background: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)',
                padding: '6px',
                borderRadius: '12px',
                width: 'fit-content'
            }}>
                <button
                    type="button"
                    onClick={() => setMode('url')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 20px',
                        background: mode === 'url' 
                            ? (isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)')
                            : 'transparent',
                        border: mode === 'url'
                            ? `1px solid ${isDark ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.3)'}`
                            : '1px solid transparent',
                        borderRadius: '8px',
                        color: mode === 'url' ? colors.accentLight : colors.textSecondary,
                        fontSize: '15px',
                        fontWeight: mode === 'url' ? '600' : '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    <Github style={{ width: '18px', height: '18px' }} />
                    GitHub URL
                </button>
                <button
                    type="button"
                    onClick={() => setMode('code')}
                    disabled={!onCodeSubmit}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 20px',
                        background: mode === 'code'
                            ? (isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(22, 163, 74, 0.15)')
                            : 'transparent',
                        border: mode === 'code'
                            ? `1px solid ${isDark ? 'rgba(34, 197, 94, 0.4)' : 'rgba(22, 163, 74, 0.3)'}`
                            : '1px solid transparent',
                        borderRadius: '8px',
                        color: mode === 'code' ? colors.success : colors.textSecondary,
                        fontSize: '15px',
                        fontWeight: mode === 'code' ? '600' : '500',
                        cursor: onCodeSubmit ? 'pointer' : 'not-allowed',
                        opacity: onCodeSubmit ? 1 : 0.5,
                        transition: 'all 0.2s'
                    }}
                >
                    <Code style={{ width: '18px', height: '18px' }} />
                    Вставити код
                </button>
            </div>

            {/* URL Input Mode */}
            {mode === 'url' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <Github style={{ width: '24px', height: '24px', color: colors.accentLight }} />
                        <label style={{ fontSize: '18px', fontWeight: '600', color: colors.textPrimary }}>
                            GitHub Repository URL
                        </label>
                    </div>

                    <div style={{
                        display: 'flex',
                        flexDirection: window.innerWidth < 1024 ? 'column' : 'row',
                        gap: '16px'
                    }}>
                        <input
                            type="url"
                            value={repoUrl}
                            onChange={(e) => setRepoUrl(e.target.value)}
                            placeholder="https://github.com/username/repository"
                            disabled={isAnalyzing}
                            style={{
                                flex: 3,
                                padding: '24px 32px',
                                fontSize: '20px',
                                background: colors.bgInput,
                                border: `2px solid ${colors.borderSecondary}`,
                                borderRadius: '1rem',
                                color: colors.textPrimary,
                                outline: 'none',
                                transition: 'all 0.2s',
                                opacity: isAnalyzing ? 0.5 : 1,
                                cursor: isAnalyzing ? 'not-allowed' : 'text'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = colors.accent;
                                e.target.style.boxShadow = `0 0 0 4px ${isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)'}`;
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = colors.borderSecondary;
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                        <button
                            type="submit"
                            disabled={isAnalyzing || !repoUrl.trim()}
                            style={{
                                flex: 1,
                                padding: '24px 48px',
                                fontSize: '20px',
                                fontWeight: 'bold',
                                background: 'linear-gradient(to right, rgb(37, 99, 235), rgb(6, 182, 212))',
                                border: 'none',
                                borderRadius: '1rem',
                                color: 'white',
                                boxShadow: isDark 
                                    ? '0 20px 25px -5px rgba(59, 130, 246, 0.25)'
                                    : '0 10px 20px rgba(59, 130, 246, 0.2)',
                                cursor: (isAnalyzing || !repoUrl.trim()) ? 'not-allowed' : 'pointer',
                                opacity: (isAnalyzing || !repoUrl.trim()) ? 0.5 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                if (!isAnalyzing && repoUrl.trim()) {
                                    e.currentTarget.style.transform = 'scale(1.02)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                        >
                            {isAnalyzing ? (
                                <>
                                    <Loader2 style={{ width: '24px', height: '24px' }} className="animate-spin" />
                                    <span>Аналізуємо...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle style={{ width: '24px', height: '24px' }} />
                                    <span>Аналізувати</span>
                                </>
                            )}
                        </button>
                    </div>

                    <p style={{
                        fontSize: '14px',
                        color: colors.textMuted,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span style={{
                            width: '6px',
                            height: '6px',
                            background: colors.textMuted,
                            borderRadius: '50%'
                        }}></span>
                        Підтримуються тільки публічні Java репозиторії
                    </p>
                </div>
            )}

            {/* Code Input Mode */}
            {mode === 'code' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        marginBottom: '8px' 
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <FileCode style={{ width: '24px', height: '24px', color: colors.success }} />
                            <label style={{ fontSize: '18px', fontWeight: '600', color: colors.textPrimary }}>
                                Java Code
                            </label>
                            {fileName && (
                                <span style={{
                                    padding: '4px 12px',
                                    background: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(22, 163, 74, 0.15)',
                                    border: `1px solid ${isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(22, 163, 74, 0.25)'}`,
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    color: colors.success,
                                    fontWeight: '500'
                                }}>
                                    {fileName}
                                </span>
                            )}
                        </div>
                        {code && (
                            <button
                                type="button"
                                onClick={clearCode}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '8px 12px',
                                    background: 'transparent',
                                    border: `1px solid ${colors.borderSecondary}`,
                                    borderRadius: '6px',
                                    color: colors.textSecondary,
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = colors.error;
                                    e.currentTarget.style.color = colors.error;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = colors.borderSecondary;
                                    e.currentTarget.style.color = colors.textSecondary;
                                }}
                            >
                                <X style={{ width: '14px', height: '14px' }} />
                                Очистити
                            </button>
                        )}
                    </div>

                    {/* File Drop Zone */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            padding: '24px',
                            border: `2px dashed ${isDragging ? colors.success : colors.borderSecondary}`,
                            borderRadius: '12px',
                            background: isDragging 
                                ? (isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(22, 163, 74, 0.08)')
                                : 'transparent',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            textAlign: 'center'
                        }}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".java"
                            onChange={handleFileInputChange}
                            style={{ display: 'none' }}
                        />
                        <Upload style={{ 
                            width: '32px', 
                            height: '32px', 
                            color: isDragging ? colors.success : colors.textSecondary,
                            margin: '0 auto 12px',
                            transition: 'color 0.2s'
                        }} />
                        <p style={{ 
                            fontSize: '15px', 
                            color: isDragging ? colors.success : colors.textSecondary,
                            margin: 0 
                        }}>
                            Перетягніть .java файл сюди або натисніть для вибору
                        </p>
                    </div>

                    {/* Code Textarea */}
                    <textarea
                        value={code}
                        onChange={(e) => {
                            setCode(e.target.value);
                            if (fileName && e.target.value !== code) {
                                setFileName(null); // Clear filename if user edits
                            }
                        }}
                        placeholder={`public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`}
                        disabled={isAnalyzing}
                        spellCheck={false}
                        style={{
                            width: '100%',
                            minHeight: '300px',
                            padding: '20px',
                            fontSize: '14px',
                            fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
                            background: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.03)',
                            border: `2px solid ${colors.borderSecondary}`,
                            borderRadius: '12px',
                            color: colors.textPrimary,
                            outline: 'none',
                            resize: 'vertical',
                            transition: 'all 0.2s',
                            lineHeight: '1.6',
                            tabSize: 4
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = colors.success;
                            e.target.style.boxShadow = `0 0 0 4px ${isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(22, 163, 74, 0.1)'}`;
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = colors.borderSecondary;
                            e.target.style.boxShadow = 'none';
                        }}
                    />

                    {/* Code Stats */}
                    {code && (
                        <div style={{
                            display: 'flex',
                            gap: '24px',
                            fontSize: '13px',
                            color: colors.textMuted
                        }}>
                            <span>{code.split('\n').length} рядків</span>
                            <span>{code.length} символів</span>
                        </div>
                    )}

                    {/* Compilation Check Option */}
                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '14px 16px',
                        background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                        border: `1px solid ${checkCompilation ? colors.accent : colors.borderSecondary}`,
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}>
                        <input
                            type="checkbox"
                            checked={checkCompilation}
                            onChange={(e) => setCheckCompilation(e.target.checked)}
                            style={{
                                width: '18px',
                                height: '18px',
                                cursor: 'pointer',
                                accentColor: colors.accent
                            }}
                        />
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: '500', color: colors.textPrimary }}>
                                Перевіряти компіляцію
                            </div>
                            <div style={{ fontSize: '12px', color: colors.textMuted, marginTop: '2px' }}>
                                Вимкніть для коду із зовнішніми залежностями (Spring, бібліотеки тощо)
                            </div>
                        </div>
                    </label>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isAnalyzing || !code.trim()}
                        style={{
                            padding: '20px 48px',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            background: `linear-gradient(to right, ${colors.success}, rgb(6, 182, 212))`,
                            border: 'none',
                            borderRadius: '12px',
                            color: 'white',
                            boxShadow: isDark 
                                ? '0 15px 25px -5px rgba(34, 197, 94, 0.25)'
                                : '0 10px 20px rgba(22, 163, 74, 0.2)',
                            cursor: (isAnalyzing || !code.trim()) ? 'not-allowed' : 'pointer',
                            opacity: (isAnalyzing || !code.trim()) ? 0.5 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            transition: 'all 0.2s',
                            alignSelf: 'flex-start'
                        }}
                        onMouseEnter={(e) => {
                            if (!isAnalyzing && code.trim()) {
                                e.currentTarget.style.transform = 'scale(1.02)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 style={{ width: '22px', height: '22px' }} className="animate-spin" />
                                <span>Аналізуємо...</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle style={{ width: '22px', height: '22px' }} />
                                <span>Аналізувати код</span>
                            </>
                        )}
                    </button>

                    <p style={{
                        fontSize: '14px',
                        color: colors.textMuted,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span style={{
                            width: '6px',
                            height: '6px',
                            background: colors.success,
                            borderRadius: '50%'
                        }}></span>
                        {checkCompilation 
                            ? 'Код буде перевірено на компіляцію та стиль'
                            : 'Код буде перевірено тільки на стиль (Checkstyle)'
                        }
                    </p>
                </div>
            )}
        </form>
    );
};
