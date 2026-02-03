/**
 * Application Configuration
 * 
 * Central configuration file for the application.
 */

/**
 * Base URL for the backend API server
 * - In development (npm run dev): uses http://localhost:8000
 * - In Docker (via nginx proxy): uses empty string (relative URLs work via nginx proxy)
 * - Can be overridden with VITE_API_URL environment variable
 */
const isProduction = import.meta.env.PROD;
export const BACKEND_URL = import.meta.env.VITE_API_URL || (isProduction ? '' : 'http://localhost:8000');
