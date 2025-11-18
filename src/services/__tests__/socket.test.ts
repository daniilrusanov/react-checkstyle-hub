/**
 * Unit tests for WebSocket service
 * Tests real-time log streaming functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { connectWebSocket, disconnectWebSocket, type LogEntry } from '../socket';
import { Client } from '@stomp/stompjs';

// Mock @stomp/stompjs
vi.mock('@stomp/stompjs', () => ({
    Client: vi.fn(),
}));

// Mock sockjs-client
vi.mock('sockjs-client', () => ({
    default: vi.fn(),
}));

interface MockClient {
    subscribe: ReturnType<typeof vi.fn>;
    activate: ReturnType<typeof vi.fn>;
    deactivate: ReturnType<typeof vi.fn>;
    onConnect?: () => void;
    onStompError?: (frame: { command: string; headers: Record<string, string>; body: string }) => void;
}

interface ClientConfig {
    webSocketFactory?: () => unknown;
    debug?: (str: string) => void;
    onConnect?: () => void;
    onStompError?: (frame: { command: string; headers: Record<string, string>; body: string }) => void;
}

describe('WebSocket Service', () => {
    let mockClient: MockClient;
    let mockSubscribe: ReturnType<typeof vi.fn>;
    let mockActivate: ReturnType<typeof vi.fn>;
    let mockDeactivate: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        mockSubscribe = vi.fn();
        mockActivate = vi.fn();
        mockDeactivate = vi.fn();

        mockClient = {
            subscribe: mockSubscribe,
            activate: mockActivate,
            deactivate: mockDeactivate,
        };

        vi.mocked(Client).mockImplementation((config?: unknown) => {
            // Store config for later trigger
            const typedConfig = config as ClientConfig | undefined;
            if (typedConfig) {
                mockClient.onConnect = typedConfig.onConnect;
                mockClient.onStompError = typedConfig.onStompError;
            }
            return mockClient as unknown as Client;
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('connectWebSocket', () => {
        it('should create STOMP client and activate connection', () => {
            const onLogReceived = vi.fn();
            const onAnalysisComplete = vi.fn();

            connectWebSocket('test-request-id', onLogReceived, onAnalysisComplete);

            expect(Client).toHaveBeenCalled();
            expect(mockActivate).toHaveBeenCalled();
        });

        it('should subscribe to correct topic on connection', () => {
            const onLogReceived = vi.fn();
            const onAnalysisComplete = vi.fn();

            connectWebSocket('test-request-id', onLogReceived, onAnalysisComplete);

            // Trigger onConnect callback
            mockClient.onConnect?.();

            expect(mockSubscribe).toHaveBeenCalledWith(
                '/topic/logs/test-request-id',
                expect.any(Function)
            );
        });

        it('should send connection confirmation log', () => {
            const onLogReceived = vi.fn();
            const onAnalysisComplete = vi.fn();

            connectWebSocket('test-request-id', onLogReceived, onAnalysisComplete);

            // Trigger onConnect callback
            mockClient.onConnect?.();

            expect(onLogReceived).toHaveBeenCalledWith({
                level: 'INFO',
                message: 'WebSocket з\'єднано. Очікую логи...',
            });
        });

        it('should handle incoming log messages', () => {
            const onLogReceived = vi.fn();
            const onAnalysisComplete = vi.fn();
            let messageHandler: ((message: { body: string }) => void) | undefined;

            mockSubscribe.mockImplementation((_topic: string, handler: (message: { body: string }) => void) => {
                messageHandler = handler;
            });

            connectWebSocket('test-request-id', onLogReceived, onAnalysisComplete);
            mockClient.onConnect?.();

            // Simulate receiving a log message
            const mockMessage = {
                body: JSON.stringify({
                    level: 'INFO',
                    message: 'Клонування репозиторія...',
                }),
            };

            messageHandler!(mockMessage);

            expect(onLogReceived).toHaveBeenCalledWith({
                level: 'INFO',
                message: 'Клонування репозиторія...',
            });
        });

        it('should call onAnalysisComplete when analysis finishes', () => {
            const onLogReceived = vi.fn();
            const onAnalysisComplete = vi.fn();
            let messageHandler: ((message: { body: string }) => void) | undefined;

            mockSubscribe.mockImplementation((_topic: string, handler: (message: { body: string }) => void) => {
                messageHandler = handler;
            });

            connectWebSocket('test-request-id', onLogReceived, onAnalysisComplete);
            mockClient.onConnect?.();

            // Simulate completion message
            const completionMessage = {
                body: JSON.stringify({
                    level: 'INFO',
                    message: 'Аналіз завершено. Знайдено 5 порушень',
                }),
            };

            messageHandler!(completionMessage);

            expect(onAnalysisComplete).toHaveBeenCalled();
        });

        it('should call onAnalysisComplete on ERROR log', () => {
            const onLogReceived = vi.fn();
            const onAnalysisComplete = vi.fn();
            let messageHandler: ((message: { body: string }) => void) | undefined;

            mockSubscribe.mockImplementation((_topic: string, handler: (message: { body: string }) => void) => {
                messageHandler = handler;
            });

            connectWebSocket('test-request-id', onLogReceived, onAnalysisComplete);
            mockClient.onConnect?.();

            // Simulate error message
            const errorMessage = {
                body: JSON.stringify({
                    level: 'ERROR',
                    message: 'Не вдалося клонувати репозиторій',
                }),
            };

            messageHandler!(errorMessage);

            expect(onAnalysisComplete).toHaveBeenCalled();
        });

        it('should handle STOMP errors', () => {
            const onLogReceived = vi.fn();
            const onAnalysisComplete = vi.fn();

            connectWebSocket('test-request-id', onLogReceived, onAnalysisComplete);

            // Trigger onStompError callback
            const errorFrame = { command: 'ERROR', headers: {}, body: 'Connection failed' };
            mockClient.onStompError?.(errorFrame);

            expect(onLogReceived).toHaveBeenCalledWith({
                level: 'ERROR',
                message: 'Помилка STOMP. Оновіть сторінку.',
            });
            expect(onAnalysisComplete).toHaveBeenCalled();
        });

        it('should not call onAnalysisComplete for regular INFO logs', () => {
            const onLogReceived = vi.fn();
            const onAnalysisComplete = vi.fn();
            let messageHandler: ((message: { body: string }) => void) | undefined;

            mockSubscribe.mockImplementation((_topic: string, handler: (message: { body: string }) => void) => {
                messageHandler = handler;
            });

            connectWebSocket('test-request-id', onLogReceived, onAnalysisComplete);
            mockClient.onConnect?.();

            // Simulate regular log message
            const regularMessage = {
                body: JSON.stringify({
                    level: 'INFO',
                    message: 'Обробка файлу Main.java...',
                }),
            };

            messageHandler!(regularMessage);

            expect(onLogReceived).toHaveBeenCalled();
            expect(onAnalysisComplete).not.toHaveBeenCalled();
        });
    });

    describe('disconnectWebSocket', () => {
        it('should deactivate STOMP client', () => {
            const onLogReceived = vi.fn();
            const onAnalysisComplete = vi.fn();

            connectWebSocket('test-request-id', onLogReceived, onAnalysisComplete);
            disconnectWebSocket();

            expect(mockDeactivate).toHaveBeenCalled();
        });

        it('should handle disconnect when no client exists', () => {
            expect(() => {
                disconnectWebSocket();
            }).not.toThrow();
        });

        it('should clear client reference after disconnect', () => {
            const onLogReceived = vi.fn();
            const onAnalysisComplete = vi.fn();

            connectWebSocket('test-request-id', onLogReceived, onAnalysisComplete);
            disconnectWebSocket();

            // Subsequent disconnect should not fail
            expect(() => {
                disconnectWebSocket();
            }).not.toThrow();
        });
    });

    describe('Multiple log messages flow', () => {
        it('should handle sequence of log messages correctly', () => {
            const onLogReceived = vi.fn();
            const onAnalysisComplete = vi.fn();
            let messageHandler: ((message: { body: string }) => void) | undefined;

            mockSubscribe.mockImplementation((_topic: string, handler: (message: { body: string }) => void) => {
                messageHandler = handler;
            });

            connectWebSocket('test-request-id', onLogReceived, onAnalysisComplete);
            mockClient.onConnect?.();

            // Simulate a sequence of log messages
            const messages: LogEntry[] = [
                { level: 'INFO', message: 'Починаю клонування...' },
                { level: 'INFO', message: 'Клонування завершено' },
                { level: 'INFO', message: 'Знайдено 10 Java файлів' },
                { level: 'INFO', message: 'Запускаю аналіз...' },
            ];

            messages.forEach((log) => {
                messageHandler!({
                    body: JSON.stringify(log),
                });
            });

            // +1 for initial connection message "WebSocket з'єднано. Очікую логи..."
            expect(onLogReceived).toHaveBeenCalledTimes(messages.length + 1);
            expect(onAnalysisComplete).not.toHaveBeenCalled();
        });
    });
});

