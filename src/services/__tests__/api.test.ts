/**
 * Unit tests for API service
 * Tests critical business logic: analysis start, status polling, and result fetching
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    startAnalysis,
    checkStatus,
    pollStatus,
    fetchResults,
    type AnalysisStatus,
    type AnalysisResult,
    BACKEND_URL,
} from '../api';

// Mock fetch globally
global.fetch = vi.fn() as typeof fetch;

describe('API Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('startAnalysis', () => {
        it('should start analysis and return request ID', async () => {
            const mockRequestId = 'test-request-123';
            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockRequestId),
            } as Response);

            const result = await startAnalysis('https://github.com/user/repo');

            expect(result).toBe(mockRequestId);
            expect(global.fetch).toHaveBeenCalledWith(
                `${BACKEND_URL}/api/analyze`,
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ repoUrl: 'https://github.com/user/repo' }),
                })
            );
        });

        it('should throw error when request fails', async () => {
            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                text: () => Promise.resolve('Server error'),
            } as Response);

            await expect(startAnalysis('https://github.com/user/repo')).rejects.toThrow(
                'Помилка серверу'
            );
        });

        it('should handle network errors', async () => {
            vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

            await expect(startAnalysis('https://github.com/user/repo')).rejects.toThrow(
                'Network error'
            );
        });
    });

    describe('checkStatus', () => {
        it('should fetch analysis status successfully', async () => {
            const mockStatus: AnalysisStatus = {
                id: 1,
                status: 'ANALYZING',
                errorMessage: null,
                createdAt: '2025-11-17T10:00:00',
            };

            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockStatus),
            } as Response);

            const result = await checkStatus('test-id');

            expect(result).toEqual(mockStatus);
            expect(global.fetch).toHaveBeenCalledWith(`${BACKEND_URL}/api/status/test-id`);
        });

        it('should throw error when status request fails', async () => {
            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: false,
                status: 404,
            } as Response);

            await expect(checkStatus('invalid-id')).rejects.toThrow(
                'Не вдалося отримати статус аналізу.'
            );
        });
    });

    describe('pollStatus', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should poll status until COMPLETED', async () => {
            const mockStatuses: AnalysisStatus[] = [
                { id: 1, status: 'PENDING', errorMessage: null, createdAt: '2025-11-17' },
                { id: 1, status: 'CLONING', errorMessage: null, createdAt: '2025-11-17' },
                { id: 1, status: 'ANALYZING', errorMessage: null, createdAt: '2025-11-17' },
                { id: 1, status: 'COMPLETED', errorMessage: null, createdAt: '2025-11-17' },
            ];

            let callCount = 0;
            vi.mocked(global.fetch).mockImplementation(() => {
                const status = mockStatuses[callCount++];
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(status),
                } as Response);
            });

            const statusUpdates: string[] = [];
            const pollPromise = pollStatus('test-id', (status) => {
                statusUpdates.push(status.status);
            });

            // Simulate polling intervals
            for (let i = 0; i < 4; i++) {
                await vi.advanceTimersByTimeAsync(2000);
            }

            const result = await pollPromise;

            expect(result.status).toBe('COMPLETED');
            expect(statusUpdates).toEqual(['PENDING', 'CLONING', 'ANALYZING', 'COMPLETED']);
            expect(global.fetch).toHaveBeenCalledTimes(4);
        });

        it('should throw error when status is FAILED', async () => {
            const failedStatus: AnalysisStatus = {
                id: 1,
                status: 'FAILED',
                errorMessage: 'Repository not found',
                createdAt: '2025-11-17',
            };

            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(failedStatus),
            } as Response);

            // Start polling and immediately set up expectation
            const pollPromise = expect(pollStatus('test-id')).rejects.toThrow('Repository not found');
            
            // Advance timer to trigger the rejection
            await vi.advanceTimersByTimeAsync(2000);
            
            // Wait for the expectation to complete
            await pollPromise;
        });

        it('should handle FAILED status without error message', async () => {
            const failedStatus: AnalysisStatus = {
                id: 1,
                status: 'FAILED',
                errorMessage: null,
                createdAt: '2025-11-17',
            };

            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(failedStatus),
            } as Response);

            // Start polling and immediately set up expectation
            const pollPromise = expect(pollStatus('test-id')).rejects.toThrow('Аналіз завершився з помилкою');
            
            // Advance timer to trigger the rejection
            await vi.advanceTimersByTimeAsync(2000);
            
            // Wait for the expectation to complete
            await pollPromise;
        });

        it('should call onStatusUpdate callback on each poll', async () => {
            const mockStatuses: AnalysisStatus[] = [
                { id: 1, status: 'PENDING', errorMessage: null, createdAt: '2025-11-17' },
                { id: 1, status: 'COMPLETED', errorMessage: null, createdAt: '2025-11-17' },
            ];

            let callCount = 0;
            vi.mocked(global.fetch).mockImplementation(() => {
                const status = mockStatuses[callCount++];
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(status),
                } as Response);
            });

            const callback = vi.fn();
            const pollPromise = pollStatus('test-id', callback);

            await vi.advanceTimersByTimeAsync(2000);
            await vi.advanceTimersByTimeAsync(2000);
            await pollPromise;

            expect(callback).toHaveBeenCalledTimes(2);
            expect(callback).toHaveBeenNthCalledWith(1, mockStatuses[0]);
            expect(callback).toHaveBeenNthCalledWith(2, mockStatuses[1]);
        });

        it('should continue polling for PENDING, CLONING, ANALYZING statuses', async () => {
            const mockStatuses: AnalysisStatus[] = [
                { id: 1, status: 'PENDING', errorMessage: null, createdAt: '2025-11-17' },
                { id: 1, status: 'CLONING', errorMessage: null, createdAt: '2025-11-17' },
                { id: 1, status: 'COMPLETED', errorMessage: null, createdAt: '2025-11-17' },
            ];

            let callCount = 0;
            vi.mocked(global.fetch).mockImplementation(() => {
                const status = mockStatuses[callCount++];
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(status),
                } as Response);
            });

            const pollPromise = pollStatus('test-id');

            for (let i = 0; i < 3; i++) {
                await vi.advanceTimersByTimeAsync(2000);
            }

            await pollPromise;

            expect(global.fetch).toHaveBeenCalledTimes(3);
        });
    });

    describe('fetchResults', () => {
        it('should fetch analysis results successfully', async () => {
            const mockResults: AnalysisResult[] = [
                {
                    id: 1,
                    filePath: 'src/Main.java',
                    lineNumber: 42,
                    severity: 'ERROR',
                    message: 'Line is too long',
                },
                {
                    id: 2,
                    filePath: 'src/Utils.java',
                    lineNumber: 15,
                    severity: 'WARNING',
                    message: 'Missing javadoc',
                },
            ];

            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResults),
            } as Response);

            const result = await fetchResults('test-id');

            expect(result).toEqual(mockResults);
            expect(result).toHaveLength(2);
            expect(global.fetch).toHaveBeenCalledWith(`${BACKEND_URL}/api/results/test-id`);
        });

        it('should return empty array when no violations found', async () => {
            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve([]),
            } as Response);

            const result = await fetchResults('test-id');

            expect(result).toEqual([]);
            expect(result).toHaveLength(0);
        });

        it('should throw error when results request fails', async () => {
            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: false,
                status: 404,
            } as Response);

            await expect(fetchResults('invalid-id')).rejects.toThrow(
                'Не вдалося завантажити результати.'
            );
        });
    });

    describe('Integration: Full analysis flow', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should complete full analysis workflow', async () => {
            // 1. Start analysis
            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve('request-123'),
            } as Response);

            const requestId = await startAnalysis('https://github.com/user/repo');
            expect(requestId).toBe('request-123');

            // 2. Poll status
            const mockStatuses: AnalysisStatus[] = [
                { id: 1, status: 'PENDING', errorMessage: null, createdAt: '2025-11-17' },
                { id: 1, status: 'COMPLETED', errorMessage: null, createdAt: '2025-11-17' },
            ];

            let statusCallCount = 0;
            vi.mocked(global.fetch).mockImplementation(() => {
                const status = mockStatuses[statusCallCount++];
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(status),
                } as Response);
            });

            const pollPromise = pollStatus(requestId);
            await vi.advanceTimersByTimeAsync(2000);
            await vi.advanceTimersByTimeAsync(2000);
            await pollPromise;

            // 3. Fetch results
            const mockResults: AnalysisResult[] = [
                {
                    id: 1,
                    filePath: 'src/Main.java',
                    lineNumber: 10,
                    severity: 'ERROR',
                    message: 'Test violation',
                },
            ];

            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResults),
            } as Response);

            const results = await fetchResults(requestId);

            expect(results).toEqual(mockResults);
            expect(results).toHaveLength(1);
        });
    });
});

