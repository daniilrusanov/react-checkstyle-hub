/**
 * WebSocket Service
 *
 * This module manages real-time WebSocket connections using STOMP protocol
 * to receive live log messages during Checkstyle analysis.
 */

import {Client, type IMessage} from '@stomp/stompjs';
import {BACKEND_URL} from './api';
import SockJS from 'sockjs-client';

/**
 * Represents a single log entry received via WebSocket
 */
export interface LogEntry {
    /** Severity level of the log message */
    level: 'IGNORE' | 'INFO' | 'WARNING' | 'ERROR';
    /** Actual log message content */
    message: string;
}

/** Callback function type for handling incoming log messages */
export type LogCallback = (log: LogEntry) => void;

/** Callback function type for handling analysis completion */
export type CompletionCallback = () => void;

/** Singleton STOMP client instance for managing WebSocket connection */
let stompClient: Client | null = null;

/**
 * Establishes a WebSocket connection to receive real-time analysis logs
 *
 * Creates a STOMP client over SockJS and subscribes to the log topic for the
 * specified analysis request. Automatically disconnects when analysis completes
 * or an error occurs.
 *
 * @param requestId - Unique identifier for the analysis request
 * @param onLogReceived - Callback invoked for each log message received
 * @param onAnalysisComplete - Callback invoked when analysis finishes or fails
 *
 * @example
 * connectWebSocket(
 *   requestId,
 *   (log) => console.log(`[${log.level}] ${log.message}`),
 *   () => console.log('Analysis complete')
 * );
 */
export const connectWebSocket = (
    requestId: string,
    onLogReceived: LogCallback,
    onAnalysisComplete: CompletionCallback
) => {
    // Create STOMP client with SockJS for WebSocket fallback support
    stompClient = new Client({
        webSocketFactory: () => new SockJS(`${BACKEND_URL}/ws-analyzer`),
        debug: (str) => {
            console.log(new Date(), str);
        },
        onConnect: () => {
            // Notify successful connection
            onLogReceived({level: 'INFO', message: 'WebSocket з\'єднано. Очікую логи...'});

            // Subscribe to the analysis-specific log topic
            stompClient?.subscribe(`/topic/logs/${requestId}`, (message: IMessage) => {
                const logEntry = JSON.parse(message.body) as LogEntry;
                onLogReceived(logEntry);

                // Check if analysis is complete (success or error)
                if (logEntry.message.startsWith('Аналіз завершено') || logEntry.level === 'ERROR') {
                    onAnalysisComplete();
                    disconnectWebSocket();
                }
            });
        },
        onStompError: (frame) => {
            console.error('STOMP error:', frame);
            onLogReceived({level: 'ERROR', message: 'Помилка STOMP. Оновіть сторінку.'});
            onAnalysisComplete();
        },
    });

    // Activate the connection
    stompClient.activate();
};

/**
 * Closes the WebSocket connection and cleans up resources
 *
 * Should be called when analysis completes or when the component unmounts
 * to prevent memory leaks.
 */
export const disconnectWebSocket = () => {
    stompClient?.deactivate();
    stompClient = null;
    console.log('WebSocket від\'єднано.');
};
