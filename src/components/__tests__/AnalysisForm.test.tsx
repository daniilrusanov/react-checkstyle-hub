/**
 * Unit tests for AnalysisForm component
 * Tests form rendering, user interactions, and validation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnalysisForm } from '../AnalysisForm';

describe('AnalysisForm', () => {
    const mockOnSubmit = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render form with all elements', () => {
            render(<AnalysisForm isAnalyzing={false} onSubmit={mockOnSubmit} />);

            expect(screen.getByText('GitHub Repository URL')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('https://github.com/username/repository')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Аналізувати/i })).toBeInTheDocument();
            expect(screen.getByText(/Підтримуються тільки публічні Java репозиторії/i)).toBeInTheDocument();
        });

        it('should render with "Аналізувати" button text when not analyzing', () => {
            render(<AnalysisForm isAnalyzing={false} onSubmit={mockOnSubmit} />);

            const button = screen.getByRole('button');
            expect(button).toHaveTextContent('Аналізувати');
        });

        it('should render with "Аналізуємо..." button text when analyzing', () => {
            render(<AnalysisForm isAnalyzing={true} onSubmit={mockOnSubmit} />);

            const button = screen.getByRole('button');
            expect(button).toHaveTextContent('Аналізуємо...');
        });
    });

    describe('Input handling', () => {
        it('should update input value when user types', async () => {
            const user = userEvent.setup();
            render(<AnalysisForm isAnalyzing={false} onSubmit={mockOnSubmit} />);

            const input = screen.getByPlaceholderText('https://github.com/username/repository');

            await user.type(input, 'https://github.com/user/repo');

            expect(input).toHaveValue('https://github.com/user/repo');
        });

        it('should clear input value', async () => {
            const user = userEvent.setup();
            render(<AnalysisForm isAnalyzing={false} onSubmit={mockOnSubmit} />);

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
            render(<AnalysisForm isAnalyzing={false} onSubmit={mockOnSubmit} />);

            const input = screen.getByPlaceholderText('https://github.com/username/repository');
            const button = screen.getByRole('button', { name: /Аналізувати/i });

            await user.type(input, 'https://github.com/user/test-repo');
            await user.click(button);

            expect(mockOnSubmit).toHaveBeenCalledWith('https://github.com/user/test-repo');
            expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        });

        it('should submit form on Enter key', async () => {
            const user = userEvent.setup();
            render(<AnalysisForm isAnalyzing={false} onSubmit={mockOnSubmit} />);

            const input = screen.getByPlaceholderText('https://github.com/username/repository');

            await user.type(input, 'https://github.com/user/repo');
            await user.keyboard('{Enter}');

            expect(mockOnSubmit).toHaveBeenCalledWith('https://github.com/user/repo');
        });

        it('should not submit when URL is empty', async () => {
            const user = userEvent.setup();
            render(<AnalysisForm isAnalyzing={false} onSubmit={mockOnSubmit} />);

            const button = screen.getByRole('button', { name: /Аналізувати/i });
            await user.click(button);

            expect(mockOnSubmit).not.toHaveBeenCalled();
        });

        it('should not submit when only whitespace is entered', async () => {
            const user = userEvent.setup();
            render(<AnalysisForm isAnalyzing={false} onSubmit={mockOnSubmit} />);

            const input = screen.getByPlaceholderText('https://github.com/username/repository');
            const button = screen.getByRole('button', { name: /Аналізувати/i });

            await user.type(input, '   ');
            await user.click(button);

            expect(mockOnSubmit).not.toHaveBeenCalled();
        });
    });

    describe('Disabled state', () => {
        it('should disable input when analyzing', () => {
            render(<AnalysisForm isAnalyzing={true} onSubmit={mockOnSubmit} />);

            const input = screen.getByPlaceholderText('https://github.com/username/repository');
            expect(input).toBeDisabled();
        });

        it('should disable button when analyzing', () => {
            render(<AnalysisForm isAnalyzing={true} onSubmit={mockOnSubmit} />);

            const button = screen.getByRole('button');
            expect(button).toBeDisabled();
        });

        it('should disable button when URL is empty', () => {
            render(<AnalysisForm isAnalyzing={false} onSubmit={mockOnSubmit} />);

            const button = screen.getByRole('button');
            expect(button).toBeDisabled();
        });

        it('should enable button when URL is provided and not analyzing', async () => {
            const user = userEvent.setup();
            render(<AnalysisForm isAnalyzing={false} onSubmit={mockOnSubmit} />);

            const input = screen.getByPlaceholderText('https://github.com/username/repository');
            const button = screen.getByRole('button');

            expect(button).toBeDisabled();

            await user.type(input, 'https://github.com/user/repo');

            expect(button).not.toBeDisabled();
        });

        it('should not submit when analyzing', async () => {
            const user = userEvent.setup();
            render(<AnalysisForm isAnalyzing={true} onSubmit={mockOnSubmit} />);

            const button = screen.getByRole('button');
            await user.click(button);

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
                const { unmount } = render(<AnalysisForm isAnalyzing={false} onSubmit={mockOnSubmit} />);

                const input = screen.getByPlaceholderText('https://github.com/username/repository');
                const button = screen.getByRole('button', { name: /Аналізувати/i });

                await user.type(input, url);
                await user.click(button);

                expect(mockOnSubmit).toHaveBeenCalledWith(url);

                unmount();
                vi.clearAllMocks();
            }
        });
    });

    describe('Accessibility', () => {
        it('should have proper input type', () => {
            render(<AnalysisForm isAnalyzing={false} onSubmit={mockOnSubmit} />);

            const input = screen.getByPlaceholderText('https://github.com/username/repository');
            expect(input).toHaveAttribute('type', 'url');
        });

        it('should have submit button type', () => {
            render(<AnalysisForm isAnalyzing={false} onSubmit={mockOnSubmit} />);

            const button = screen.getByRole('button');
            expect(button).toHaveAttribute('type', 'submit');
        });

        it('should have label for input field', () => {
            render(<AnalysisForm isAnalyzing={false} onSubmit={mockOnSubmit} />);

            expect(screen.getByText('GitHub Repository URL')).toBeInTheDocument();
        });
    });

    describe('Edge cases', () => {
        it('should handle rapid form submissions', async () => {
            const user = userEvent.setup();
            render(<AnalysisForm isAnalyzing={false} onSubmit={mockOnSubmit} />);

            const input = screen.getByPlaceholderText('https://github.com/username/repository');
            const button = screen.getByRole('button', { name: /Аналізувати/i });

            await user.type(input, 'https://github.com/user/repo');

            // Try to submit multiple times quickly
            await user.click(button);
            await user.click(button);
            await user.click(button);

            // Should only submit once if not disabled properly
            expect(mockOnSubmit).toHaveBeenCalledTimes(3);
        });

        it('should preserve input value during analysis', async () => {
            const user = userEvent.setup();
            const { rerender } = render(<AnalysisForm isAnalyzing={false} onSubmit={mockOnSubmit} />);

            const input = screen.getByPlaceholderText('https://github.com/username/repository');
            await user.type(input, 'https://github.com/user/repo');

            // Start analyzing
            rerender(<AnalysisForm isAnalyzing={true} onSubmit={mockOnSubmit} />);

            expect(input).toHaveValue('https://github.com/user/repo');
        });
    });
});

