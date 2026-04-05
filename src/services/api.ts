/**
 * Analysis API Service
 *
 * This module provides API client functions for interacting with the Checkstyle
 * analysis backend. It handles starting code analysis and fetching results.
 */

import { BACKEND_URL } from '../config';
import { getAuthHeaders } from './auth';

// Re-export BACKEND_URL for backwards compatibility
export { BACKEND_URL };

/**
 * Request body structure for starting a new analysis
 */
export interface AnalysisRequestBody {
    /** URL of the GitHub repository to analyze */
    repoUrl: string;
}

/**
 * Initiates a new Checkstyle analysis for a GitHub repository
 *
 * Sends a POST request to the backend to start analyzing a Java repository.
 * The backend will clone the repository, run Checkstyle checks, and generate results.
 *
 * @param repoUrl - Full URL of the GitHub repository (must be public)
 * @returns Promise resolving to a unique request ID for tracking the analysis
 * @throws Error if the request fails or the server returns an error response
 *
 * @example
 * const requestId = await startAnalysis('https://github.com/user/repo');
 * console.log(`Analysis started with ID: ${requestId}`);
 */
export const startAnalysis = async (repoUrl: string): Promise<string> => {
    const response = await fetch(`${BACKEND_URL}/api/analyze`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
        },
        body: JSON.stringify({repoUrl} as AnalysisRequestBody),
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('Будь ласка, увійдіть в систему для запуску аналізу');
        }
        const errorText = await response.text();
        throw new Error(`Помилка серверу: ${response.status} ${response.statusText}. ${errorText}`);
    }

    const requestId = await response.json();
    return String(requestId);
};

/**
 * Represents a single Checkstyle violation found during analysis
 */
export interface AnalysisResult {
    /** Unique identifier for this violation */
    id: number;
    /** Relative path to the file containing the violation */
    filePath: string;
    /** Line number where the violation occurs */
    lineNumber: number;
    /** Severity level of the violation (e.g., 'ERROR', 'WARNING', 'INFO') */
    severity: string;
    /** Detailed description of the violation */
    message: string;
    /** Which analyzer produced this violation */
    analyzerType?: 'CHECKSTYLE' | 'PMD';
}

/**
 * Represents the status of an analysis request
 */
export interface AnalysisStatus {
    /** Unique identifier for the request */
    id: number;
    /** Current status of the analysis */
    status: 'PENDING' | 'CLONING' | 'ANALYZING' | 'COMPLETED' | 'FAILED';
    /** Error message if status is FAILED */
    errorMessage: string | null;
    /** Timestamp when the request was created */
    createdAt: string;
    /** Quality score (0-100) populated once analysis is COMPLETED */
    qualityScore?: number;
}

/**
 * Checks the current status of an analysis request
 *
 * @param requestId - The unique identifier returned by startAnalysis()
 * @returns Promise resolving to the current status of the analysis
 * @throws Error if the request fails
 *
 * @example
 * const status = await checkStatus(requestId);
 * console.log(`Current status: ${status.status}`);
 */
export const checkStatus = async (requestId: string): Promise<AnalysisStatus> => {
    const response = await fetch(`${BACKEND_URL}/api/status/${requestId}`);

    if (!response.ok) {
        throw new Error('Не вдалося отримати статус аналізу.');
    }

    return await response.json() as Promise<AnalysisStatus>;
};

/**
 * Polls the analysis status until it's completed or failed
 *
 * Continuously checks the status every 2 seconds until the analysis
 * reaches a terminal state (COMPLETED or FAILED).
 *
 * @param requestId - The unique identifier returned by startAnalysis()
 * @param onStatusUpdate - Optional callback invoked on each status check
 * @returns Promise resolving to the final status
 * @throws Error if the analysis fails or status check fails
 *
 * @example
 * const finalStatus = await pollStatus(requestId, (status) => {
 *   console.log(`Status: ${status.status}`);
 * });
 */
export const pollStatus = async (
    requestId: string,
    onStatusUpdate?: (status: AnalysisStatus) => void
): Promise<AnalysisStatus> => {
    while (true) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

        const status = await checkStatus(requestId);

        if (onStatusUpdate) {
            onStatusUpdate(status);
        }

        if (status.status === 'COMPLETED') {
            return status;
        }

        if (status.status === 'FAILED') {
            throw new Error(status.errorMessage || 'Аналіз завершився з помилкою');
        }

        // Continue polling for PENDING, CLONING, ANALYZING
    }
};

/**
 * Fetches the analysis results for a specific request
 *
 * Retrieves all Checkstyle violations found during the analysis.
 * This should be called after the analysis is complete (status is COMPLETED).
 *
 * @param requestId - The unique identifier returned by startAnalysis()
 * @returns Promise resolving to an array of all violations found
 * @throws Error if the request fails or results cannot be loaded
 *
 * @example
 * const results = await fetchResults(requestId);
 * console.log(`Found ${results.length} violations`);
 */
export const fetchResults = async (requestId: string): Promise<AnalysisResult[]> => {
    const response = await fetch(`${BACKEND_URL}/api/results/${requestId}`);

    if (!response.ok) {
        throw new Error('Не вдалося завантажити результати.');
    }

    return await response.json() as Promise<AnalysisResult[]>;
};

/**
 * Compilation error from the Java compiler
 */
export interface CompilationError {
    lineNumber: number;
    columnNumber: number;
    message: string;
    kind: string;
}

/**
 * Response from direct code analysis
 */
export interface CodeAnalysisResponse {
    success: boolean;
    errorMessage?: string;
    compilationSuccess?: boolean;
    compilationErrors: CompilationError[];
    violations: AnalysisResult[];
    violationCount: number;
    qualityScore?: number;
}

/**
 * Request body for direct code analysis
 */
export interface CodeAnalysisRequest {
    code: string;
    fileName?: string;
    checkCompilation?: boolean;
    checkstyleConfig?: string;
}

/**
 * Analyzes Java code directly without requiring a GitHub repository
 * 
 * Ideal for students and quick code checks. Supports compilation
 * checking and returns a quality score.
 *
 * @param request - The code analysis request
 * @returns Promise resolving to analysis results
 * @throws Error if the request fails
 *
 * @example
 * const result = await analyzeCode({
 *   code: 'public class Main { public static void main(String[] args) {} }',
 *   checkCompilation: true
 * });
 */
export const analyzeCode = async (request: CodeAnalysisRequest): Promise<CodeAnalysisResponse> => {
    const response = await fetch(`${BACKEND_URL}/api/analyze/code`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
        },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Помилка серверу: ${response.status}. ${errorText}`);
    }

    return await response.json() as CodeAnalysisResponse;
};

/**
 * Requests an AI-generated explanation for a single analysis violation.
 *
 * Calls `POST /api/ai/explain/{resultId}` on the backend. The backend uses
 * the authenticated user's experience level to tailor the prompt (STUDENT /
 * JUNIOR / ADVANCED) and returns a Markdown-formatted string produced by the
 * local Ollama LLM.
 *
 * If an explanation was already generated for this result it is returned from
 * the backend cache without calling the LLM again.
 *
 * @param resultId - The ID of the {@link AnalysisResult} to explain
 * @returns Promise resolving to a Markdown string with the AI explanation
 * @throws Error if not authenticated, the result is not found, or the LLM call fails
 */
export const getAiExplanation = async (resultId: number): Promise<string> => {
    const response = await fetch(`${BACKEND_URL}/api/ai/explain/${resultId}`, {
        method: 'POST',
        headers: {
            ...getAuthHeaders(),
        },
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('Будь ласка, увійдіть в систему для отримання AI пояснень');
        }
        if (response.status === 404) {
            throw new Error('Результат аналізу не знайдено');
        }
        // Try to extract a clean message from the JSON error body
        let message: string;
        try {
            const body = await response.json() as { message?: string; error?: string };
            message = body.message ?? body.error ?? response.statusText;
        } catch {
            message = await response.text().catch(() => response.statusText);
        }
        if (response.status === 503) {
            throw new Error(message);
        }
        throw new Error(`Помилка серверу (${response.status}): ${message}`);
    }

    return await response.text();
};

/**
 * FRS06 — Requests a general AI-generated summary of the most frequent violations
 * found in a completed analysis request.
 *
 * Calls `GET /api/ai/summary/{requestId}`. The backend aggregates the top-5
 * most frequent violation messages and sends them to the local Ollama LLM,
 * which returns a Markdown-formatted summary tailored to the user's experience level.
 *
 * @param requestId - The ID of the completed analysis request
 * @returns Promise resolving to a Markdown string with improvement advice
 * @throws Error if not authenticated, the request is not found, or the LLM call fails
 */
export const getGeneralSummary = async (requestId: string): Promise<string> => {
    const response = await fetch(`${BACKEND_URL}/api/ai/summary/${requestId}`, {
        method: 'GET',
        headers: {
            ...getAuthHeaders(),
        },
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('Будь ласка, увійдіть в систему для отримання AI висновку');
        }
        if (response.status === 404) {
            throw new Error('Запит на аналіз не знайдено');
        }
        let message: string;
        try {
            const body = await response.json() as { message?: string; error?: string };
            message = body.message ?? body.error ?? response.statusText;
        } catch {
            message = await response.text().catch(() => response.statusText);
        }
        if (response.status === 503) {
            throw new Error(message);
        }
        throw new Error(`Помилка серверу (${response.status}): ${message}`);
    }

    return await response.text();
};
