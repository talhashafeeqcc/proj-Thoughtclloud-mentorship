// Set the base URL for API calls
export const API_BASE_URL = (() => {
  // If VITE_API_BASE_URL is explicitly provided, use it
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');
  }

  // For production on Netlify
  if (import.meta.env.PROD) {
    // If we're accessing from the main site but need to use the server deployment
    if (window.location.hostname === 'thoughtcloud-mentorship.netlify.app') {
      return 'https://devserver-main--thoughtcloud-mentorship.netlify.app';
    }
    // Otherwise use the current origin
    return window.location.origin;
  }

  // Default for local development
  return 'http://localhost:3001';
})();

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