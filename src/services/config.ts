// Set the base URL for API calls
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
    (import.meta.env.PROD 
        ? window.location.origin
        : 'http://localhost:3001');

// Check if we're in a development environment
export const isDevelopment = import.meta.env.DEV ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'; 