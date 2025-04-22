// Set the base URL for API calls
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 
    (import.meta.env.PROD 
        ? window.location.origin
        : 'http://localhost:3001')).replace(/\/$/, '');

// Create a utility function to form proper API URLs
export const getApiUrl = (path: string): string => {
    // Make sure path starts with a slash but doesn't add an extra one
    const formattedPath = path.startsWith('/') ? path : `/${path}`;
    // Combine and ensure no double slashes
    return `${API_BASE_URL}${formattedPath}`;
};

// Check if we're in a development environment
export const isDevelopment = import.meta.env.DEV ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'; 