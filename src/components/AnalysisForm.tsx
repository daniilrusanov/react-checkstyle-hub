/**
 * Analysis Form Component
 *
 * Provides a user interface for submitting GitHub repository URLs
 * for Checkstyle analysis. Includes input validation and loading states.
 */

import React, {useState} from 'react';
import {CheckCircle, Github, Loader2} from 'lucide-react';
import { useTheme, getThemeColors } from '../context/ThemeContext';

/**
 * Props for the AnalysisForm component
 */
interface AnalysisFormProps {
    /** Whether an analysis is currently in progress */
    isAnalyzing: boolean;
    /** Callback invoked when the form is submitted with a valid URL */
    onSubmit: (url: string) => void;
}

/**
 * Form component for initiating repository analysis
 *
 * Features:
 * - URL input field with validation
 * - Disabled state during analysis
 * - Visual feedback with loading spinner
 * - Responsive design
 */
export const AnalysisForm: React.FC<AnalysisFormProps> = ({isAnalyzing, onSubmit}) => {
    /** Current repository URL input value */
    const [repoUrl, setRepoUrl] = useState('');
    
    /** Theme context */
    const { isDark } = useTheme();
    const colors = getThemeColors(isDark);

    /**
     * Handle form submission
     * Prevents submission if already analyzing or URL is empty
     */
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isAnalyzing || !repoUrl) return;
        onSubmit(repoUrl);
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
            <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px'}}>
                    <Github style={{width: '24px', height: '24px', color: colors.accentLight}}/>
                    <label style={{fontSize: '18px', fontWeight: '600', color: colors.textPrimary}}>
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
                                <Loader2 style={{width: '24px', height: '24px'}} className="animate-spin"/>
                                <span>Аналізуємо...</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle style={{width: '24px', height: '24px'}}/>
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
        </form>
    );
};
