/**
 * Configuration Service
 * 
 * This module provides an API client for managing Checkstyle configuration settings.
 * It handles fetching and updating code quality rules for Java analysis.
 */

import { BACKEND_URL } from '../config';

/** Base URL for Checkstyle configuration API endpoints */
const API_BASE_URL = `${BACKEND_URL}/api/checkstyle`;

/**
 * Complete Checkstyle configuration interface
 * 
 * Represents the full configuration object returned from the backend,
 * including metadata and all available Checkstyle rules.
 */
export interface CheckstyleConfig {
    /** Unique identifier for the configuration */
    id: number;
    /** Human-readable name of the configuration */
    configName: string;
    /** Timestamp when the configuration was created */
    createdAt: string;
    /** Timestamp when the configuration was last updated */
    updatedAt: string;
    /** Flag indicating if this configuration is currently active */
    isActive: boolean;
    
    // General settings
    /** Character encoding for analyzed files (e.g., 'UTF-8') */
    charset: string;
    /** Severity level for violations: 'ignore', 'info', 'warning', or 'error' */
    severity: string;
    /** File extensions to analyze (e.g., '.java') */
    fileExtensions: string;
    /** Maximum allowed line length in characters */
    lineLength: number;
    /** Regex pattern for lines to ignore in line length check */
    lineLengthIgnorePattern: string;
    
    // Import rules
    /** Check that star imports (import pkg.*) are not used */
    avoidStarImport: boolean;
    
    // Class design rules
    /** Ensure only one top-level class per file */
    oneTopLevelClass: boolean;
    /** Check that specific statements are not line-wrapped */
    noLineWrap: boolean;
    
    // Block rules
    /** Check for empty blocks in code */
    emptyBlock: boolean;
    /** Ensure braces are used around code blocks */
    needBraces: boolean;
    /** Check the placement of left curly braces */
    leftCurly: boolean;
    /** Check the placement of right curly braces */
    rightCurly: boolean;
    /** Check for empty statements (standalone semicolons) */
    emptyStatement: boolean;
    
    // Coding rules
    /** Check that equals() and hashCode() are overridden together */
    equalsHashCode: boolean;
    /** Check for illegal instantiations where constructors should not be called */
    illegalInstantiation: boolean;
    /** Check that switch statements have a default case */
    missingSwitchDefault: boolean;
    /** Check for overly complex boolean expressions */
    simplifyBooleanExpression: boolean;
    /** Check for overly complex boolean return statements */
    simplifyBooleanReturn: boolean;
    
    // Design rules
    /** Check that classes with only private constructors are declared as final */
    finalClass: boolean;
    /** Check that utility classes have a private constructor */
    hideUtilityClassConstructor: boolean;
    /** Check that interfaces define types, not just constants */
    interfaceIsType: boolean;
    /** Check visibility modifiers are explicitly declared */
    visibilityModifier: boolean;
    
    // Miscellaneous rules
    /** Check that outer type name matches file name */
    outerTypeFilename: boolean;
    /** Check for illegal token text patterns */
    illegalTokenText: boolean;
    /** Check that Unicode escapes are avoided when not necessary */
    avoidEscapedUnicodeCharacters: boolean;
}

/**
 * Data Transfer Object for updating configuration
 * 
 * All fields are optional to allow partial updates.
 * Only includes fields that can be modified by the user.
 */
export interface UpdateConfigDto {
    charset?: string;
    severity?: string;
    lineLength?: number;
    avoidStarImport?: boolean;
    oneTopLevelClass?: boolean;
    noLineWrap?: boolean;
    emptyBlock?: boolean;
    needBraces?: boolean;
    leftCurly?: boolean;
    rightCurly?: boolean;
    emptyStatement?: boolean;
    equalsHashCode?: boolean;
    illegalInstantiation?: boolean;
    missingSwitchDefault?: boolean;
    simplifyBooleanExpression?: boolean;
    simplifyBooleanReturn?: boolean;
    finalClass?: boolean;
    hideUtilityClassConstructor?: boolean;
    interfaceIsType?: boolean;
    visibilityModifier?: boolean;
    outerTypeFilename?: boolean;
    illegalTokenText?: boolean;
    avoidEscapedUnicodeCharacters?: boolean;
}

/**
 * Fetches the current Checkstyle configuration from the backend
 * 
 * @returns Promise resolving to the complete configuration object
 * @throws Error if the API request fails
 */
export const getConfiguration = async (): Promise<CheckstyleConfig> => {
    const response = await fetch(`${API_BASE_URL}/configuration`);
    if (!response.ok) {
        throw new Error(`Не вдалося завантажити конфігурацію: ${response.statusText}`);
    }
    return response.json();
};

/**
 * Updates the Checkstyle configuration on the backend
 * 
 * @param config - Partial configuration object with fields to update
 * @returns Promise resolving to the updated configuration object
 * @throws Error if the API request fails
 */
export const updateConfiguration = async (config: UpdateConfigDto): Promise<CheckstyleConfig> => {
    const response = await fetch(`${API_BASE_URL}/configuration`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
    });
    if (!response.ok) {
        throw new Error(`Не вдалося оновити конфігурацію: ${response.statusText}`);
    }
    return response.json();
};

