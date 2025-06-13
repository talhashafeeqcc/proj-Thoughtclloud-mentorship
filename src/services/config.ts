// Set the base URL for API calls
export const API_BASE_URL = (() => {

  // For production or development - we're using Netlify functions now
  // So the API base is the same as the site origin
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

// Check if we're in a development environment
export const isDevelopment =
  import.meta.env.DEV ||
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";
