// API configuration
// Uses VITE_BACKEND from environment variables, falls back to empty string (relative URLs)
export const API_BASE_URL = import.meta.env.VITE_BACKEND || 'http://3.6.50.90:3000';

/**
 * Get the full API URL for an endpoint
 * @param {string} endpoint - API endpoint (e.g., '/api/analytics')
 * @returns {string} Full URL
 */
export function getApiUrl(endpoint) {
    // Remove leading slash if present to avoid double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

    if (API_BASE_URL) {
        // Ensure API_BASE_URL doesn't end with a slash
        const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
        return `${baseUrl}/${cleanEndpoint}`;
    }

    // Fallback to relative URL (for dev proxy)
    return `/${cleanEndpoint}`;
}

