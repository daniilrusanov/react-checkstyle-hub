/**
 * Analysis API Service
 *
 * This module provides API client functions for interacting with the Checkstyle
 * analysis backend. It handles starting code analysis and fetching results.
 */

/** Base URL for the backend API server */
export const BACKEND_URL = 'http://localhost:8000';

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
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({repoUrl} as AnalysisRequestBody),
    });

    if (!response.ok) {
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
