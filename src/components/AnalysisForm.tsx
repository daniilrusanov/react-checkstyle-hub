/**
 * Analysis Form Component
 *
 * Provides a user interface for submitting GitHub repository URLs
 * for Checkstyle analysis. Includes input validation and loading states.
 */

import React, {useState} from 'react';
import {CheckCircle, Github, Loader2} from 'lucide-react';

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
            background: 'rgba(255, 255, 255, 0.02)',
            backdropFilter: 'blur(40px)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '1rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            padding: '32px'
        }}>
            <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px'}}>
                    <Github style={{width: '24px', height: '24px', color: 'rgb(96, 165, 250)'}}/>
                    <label style={{fontSize: '18px', fontWeight: '600', color: 'white'}}>
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
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '2px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '1rem',
                            color: 'white',
                            outline: 'none',
                            transition: 'all 0.2s',
                            opacity: isAnalyzing ? 0.5 : 1,
                            cursor: isAnalyzing ? 'not-allowed' : 'text'
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = 'rgb(59, 130, 246)';
                            e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.2)';
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
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
                            boxShadow: '0 20px 25px -5px rgba(59, 130, 246, 0.25)',
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
                    color: 'rgb(100, 116, 139)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <span style={{
                        width: '6px',
                        height: '6px',
                        background: 'rgb(100, 116, 139)',
                        borderRadius: '50%'
                    }}></span>
                    Підтримуються тільки публічні Java репозиторії
                </p>
            </div>
        </form>
    );
};
