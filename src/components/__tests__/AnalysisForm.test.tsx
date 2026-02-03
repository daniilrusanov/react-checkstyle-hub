/**
 * Unit tests for AnalysisForm component
 * Tests form rendering, user interactions, and validation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnalysisForm } from '../AnalysisForm';
import { ThemeProvider } from '../../context/ThemeContext';

// Helper to render with ThemeProvider
const renderWithTheme = (ui: React.ReactElement) => {
    return render(<ThemeProvider>{ui}</ThemeProvider>);
};

describe('AnalysisForm', () => {
    const mockOnSubmit = vi.fn();
    const mockOnCodeSubmit = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render form with all elements', () => {
            renderWithTheme(<AnalysisForm isAnalyzing={false} onSubmit={mockOnSubmit} />);

            expect(screen.getByText('GitHub Repository URL')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('https://github.com/username/repository')).toBeInTheDocument();
            expect(screen.getByText('Аналізувати')).toBeInTheDocument();
            expect(screen.getByText(/Підтримуються тільки публічні Java репозиторії/i)).toBeInTheDocument();
        });

        it('should render with "Аналізувати" button text when not analyzing', () => {
            renderWithTheme(<AnalysisForm isAnalyzing={false} onSubmit={mockOnSubmit} />);

            // Find the submit button by its text content
            expect(screen.getByText('Аналізувати')).toBeInTheDocument();
        });

        it('should render with "Аналізуємо..." button text when analyzing', () => {
            renderWithTheme(<AnalysisForm isAnalyzing={true} onSubmit={mockOnSubmit} />);

            expect(screen.getByText('Аналізуємо...')).toBeInTheDocument();
        });

        it('should render mode tabs', () => {
            renderWithTheme(<AnalysisForm isAnalyzing={false} onSubmit={mockOnSubmit} />);

            expect(screen.getByText('GitHub URL')).toBeInTheDocument();
            expect(screen.getByText('Вставити код')).toBeInTheDocument();
        });
    });

    describe('Input handling', () => {
        it('should update input value when user types', async () => {
            const user = userEvent.setup();
            renderWithTheme(<AnalysisForm isAnalyzing={false} onSubmit={mockOnSubmit} />);

            const input = screen.getByPlaceholderText('https://github.com/username/repository');

            await user.type(input, 'https://github.com/user/repo');

            expect(input).toHaveValue('https://github.com/user/repo');
        });

        it('should clear input value', async () => {
            const user = userEvent.setup();
            renderWithTheme(<AnalysisForm isAnalyzing={false} onSubmit={mockOnSubmit} />);

            const input = screen.getByPlaceholderText('https://github.com/username/repository') as HTMLInputElement;

            await user.type(input, 'https://github.com/user/repo');
            expect(input).toHaveValue('https://github.com/user/repo');

            await user.clear(input);
            expect(input).toHaveValue('');
        });
    });

    describe('Form submission', () => {
        it('should call onSubmit with URL when form is submitted', async () => {
            const user = userEvent.setup();
            renderWithTheme(<AnalysisForm isAnalyzing={false} onSubmit={mockOnSubmit} />);

            const input = screen.getByPlaceholderText('https://github.com/username/repository');
            const submitButton = screen.getByRole('button', { name: /аналізувати$/i });

            await user.type(input, 'https://github.com/user/test-repo');
            await user.click(submitButton);

            expect(mockOnSubmit).toHaveBeenCalledWith('https://github.com/user/test-repo');
            expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        });

        it('should submit form on Enter key', async () => {
            const user = userEvent.setup();
            renderWithTheme(<AnalysisForm isAnalyzing={false} onSubmit={mockOnSubmit} />);

            const input = screen.getByPlaceholderText('https://github.com/username/repository');

            await user.type(input, 'https://github.com/user/repo');
            await user.keyboard('{Enter}');

            expect(mockOnSubmit).toHaveBeenCalledWith('https://github.com/user/repo');
        });

        it('should not submit when URL is empty', async () => {
            const user = userEvent.setup();
            renderWithTheme(<AnalysisForm isAnalyzing={false} onSubmit={mockOnSubmit} />);

            const submitButton = screen.getByRole('button', { name: /аналізувати$/i });
            await user.click(submitButton);

            expect(mockOnSubmit).not.toHaveBeenCalled();
        });

        it('should not submit when only whitespace is entered', async () => {
            const user = userEvent.setup();
            renderWithTheme(<AnalysisForm isAnalyzing={false} onSubmit={mockOnSubmit} />);

            const input = screen.getByPlaceholderText('https://github.com/username/repository');
            const submitButton = screen.getByRole('button', { name: /аналізувати$/i });

            await user.type(input, '   ');
            await user.click(submitButton);

            expect(mockOnSubmit).not.toHaveBeenCalled();
        });
    });

    describe('Disabled state', () => {
        it('should disable input when analyzing', () => {
            renderWithTheme(<AnalysisForm isAnalyzing={true} onSubmit={mockOnSubmit} />);

            const input = screen.getByPlaceholderText('https://github.com/username/repository');
            expect(input).toBeDisabled();
        });

        it('should disable submit button when analyzing', () => {
            renderWithTheme(<AnalysisForm isAnalyzing={true} onSubmit={mockOnSubmit} />);

            const submitButton = screen.getByRole('button', { name: /аналізуємо/i });
            expect(submitButton).toBeDisabled();
        });

        it('should disable submit button when URL is empty', () => {
            renderWithTheme(<AnalysisForm isAnalyzing={false} onSubmit={mockOnSubmit} />);

            const submitButton = screen.getByRole('button', { name: /аналізувати$/i });
            expect(submitButton).toBeDisabled();
        });

        it('should enable submit button when URL is provided and not analyzing', async () => {
            const user = userEvent.setup();
            renderWithTheme(<AnalysisForm isAnalyzing={false} onSubmit={mockOnSubmit} />);

            const input = screen.getByPlaceholderText('https://github.com/username/repository');
            const submitButton = screen.getByRole('button', { name: /аналізувати$/i });

            expect(submitButton).toBeDisabled();

            await user.type(input, 'https://github.com/user/repo');

            expect(submitButton).not.toBeDisabled();
        });

        it('should not submit when analyzing', async () => {
            const user = userEvent.setup();
            renderWithTheme(<AnalysisForm isAnalyzing={true} onSubmit={mockOnSubmit} />);

            const submitButton = screen.getByRole('button', { name: /аналізуємо/i });
            await user.click(submitButton);

            expect(mockOnSubmit).not.toHaveBeenCalled();
        });
    });

    describe('Form validation', () => {
        it('should accept valid GitHub URLs', async () => {
            const user = userEvent.setup();
            const validUrls = [
                'https://github.com/user/repo',
                'https://github.com/organization/project-name',
                'https://github.com/user-123/repo_name',
            ];

            for (const url of validUrls) {
                const { unmount } = renderWithTheme(<AnalysisForm isAnalyzing={false} onSubmit={mockOnSubmit} />);

                const input = screen.getByPlaceholderText('https://github.com/username/repository');
                const submitButton = screen.getByRole('button', { name: /аналізувати$/i });

                await user.type(input, url);
                await user.click(submitButton);

                expect(mockOnSubmit).toHaveBeenCalledWith(url);

                unmount();
                vi.clearAllMocks();
            }
        });
    });

    describe('Accessibility', () => {
        it('should have proper input type', () => {
            renderWithTheme(<AnalysisForm isAnalyzing={false} onSubmit={mockOnSubmit} />);

            const input = screen.getByPlaceholderText('https://github.com/username/repository');
            expect(input).toHaveAttribute('type', 'url');
        });

        it('should have submit button type', () => {
            renderWithTheme(<AnalysisForm isAnalyzing={false} onSubmit={mockOnSubmit} />);

            const submitButton = screen.getByRole('button', { name: /аналізувати$/i });
            expect(submitButton).toHaveAttribute('type', 'submit');
        });

        it('should have label for input field', () => {
            renderWithTheme(<AnalysisForm isAnalyzing={false} onSubmit={mockOnSubmit} />);

            expect(screen.getByText('GitHub Repository URL')).toBeInTheDocument();
        });
    });

    describe('Edge cases', () => {
        it('should handle rapid form submissions', async () => {
            const user = userEvent.setup();
            renderWithTheme(<AnalysisForm isAnalyzing={false} onSubmit={mockOnSubmit} />);

            const input = screen.getByPlaceholderText('https://github.com/username/repository');
            const submitButton = screen.getByRole('button', { name: /аналізувати$/i });

            await user.type(input, 'https://github.com/user/repo');

            // Try to submit multiple times quickly
            await user.click(submitButton);
            await user.click(submitButton);
            await user.click(submitButton);

            // Should submit multiple times since button is not disabled after first click
            expect(mockOnSubmit).toHaveBeenCalledTimes(3);
        });

        it('should preserve input value during analysis', async () => {
            const user = userEvent.setup();
            const { rerender } = renderWithTheme(<AnalysisForm isAnalyzing={false} onSubmit={mockOnSubmit} />);

            const input = screen.getByPlaceholderText('https://github.com/username/repository');
            await user.type(input, 'https://github.com/user/repo');

            // Start analyzing - use rerender with ThemeProvider wrapper
            rerender(
                <ThemeProvider>
                    <AnalysisForm isAnalyzing={true} onSubmit={mockOnSubmit} />
                </ThemeProvider>
            );

            expect(input).toHaveValue('https://github.com/user/repo');
        });
    });

    describe('Code Mode', () => {
        it('should switch to code mode when tab is clicked', async () => {
            const user = userEvent.setup();
            renderWithTheme(
                <AnalysisForm 
                    isAnalyzing={false} 
                    onSubmit={mockOnSubmit} 
                    onCodeSubmit={mockOnCodeSubmit} 
                />
            );

            const codeTab = screen.getByText('Вставити код');
            await user.click(codeTab);

            expect(screen.getByText('Java Code')).toBeInTheDocument();
            expect(screen.getByPlaceholderText(/public class Main/)).toBeInTheDocument();
        });

        it('should disable code tab when onCodeSubmit is not provided', () => {
            renderWithTheme(<AnalysisForm isAnalyzing={false} onSubmit={mockOnSubmit} />);

            const codeTab = screen.getByText('Вставити код');
            expect(codeTab).toBeDisabled();
        });

        it('should call onCodeSubmit when code is submitted', async () => {
            const user = userEvent.setup();
            renderWithTheme(
                <AnalysisForm 
                    isAnalyzing={false} 
                    onSubmit={mockOnSubmit} 
                    onCodeSubmit={mockOnCodeSubmit} 
                />
            );

            // Switch to code mode
            await user.click(screen.getByText('Вставити код'));

            // Type code (without special characters to avoid userEvent parsing issues)
            const textarea = screen.getByPlaceholderText(/public class Main/) as HTMLTextAreaElement;
            await user.type(textarea, 'public class Test');

            // Submit
            const submitButton = screen.getByRole('button', { name: /аналізувати код$/i });
            await user.click(submitButton);

            expect(mockOnCodeSubmit).toHaveBeenCalledWith('public class Test', undefined);
        });
    });

    describe('External URL', () => {
        it('should set URL from externalUrl prop', () => {
            renderWithTheme(
                <AnalysisForm 
                    isAnalyzing={false} 
                    onSubmit={mockOnSubmit}
                    externalUrl="https://github.com/external/repo"
                />
            );

            const input = screen.getByPlaceholderText('https://github.com/username/repository');
            expect(input).toHaveValue('https://github.com/external/repo');
        });
    });
});
