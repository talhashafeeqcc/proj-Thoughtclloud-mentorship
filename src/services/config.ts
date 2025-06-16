// Check if we're in a development environment
export const isDevelopment =
  import.meta.env.DEV ||
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

// Set the base URL for API calls
export const API_BASE_URL = (() => {
  // Check if we're running in Netlify Dev environment
  const isNetlifyDev = window.location.port === '8888' || 
                       window.location.hostname.includes('netlify') ||
                       process.env.NETLIFY === 'true';
  
  if (isNetlifyDev) {
    // Netlify Dev handles API routing internally
    console.log("Using Netlify Dev for API requests:", window.location.origin);
    return window.location.origin;
  }
  
  // For other development environments, might need different setup
  if (isDevelopment && window.location.port === '5173') {
    // Regular Vite dev server - proxy should handle API calls
    console.log("Using Vite dev server with proxy for API requests:", window.location.origin);
    return window.location.origin;
  }
  
  // For production or other environments
  console.log("Using current origin for API requests:", window.location.origin);
  return window.location.origin;
})();

// Create a utility function to form proper API URLs
export const getApiUrl = (path: string): string => {
  // Make sure path starts with a slash but doesn't add an extra one
  const formattedPath = path.startsWith("/") ? path : `/${path}`;
  // Combine and ensure no double slashes
  const url = `${API_BASE_URL}${formattedPath}`;
  console.log(`Generated API URL: ${url}`);
  return url;
};
