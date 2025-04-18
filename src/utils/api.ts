// API URL configuration
const API_URL = import.meta.env.VITE_API_URL || '';

// Function to get the correct API URL based on environment
export const getApiUrl = (endpoint: string): string => {
  // In development, we use relative URLs that get proxied by Vite
  // In production, we use the full URL from environment variables
  if (import.meta.env.DEV) {
    return `/api${endpoint}`;
  }
  
  // In production, use the API URL from environment variables
  return `${API_URL}/api${endpoint}`;
};

// Example usage:
// const paymentIntentUrl = getApiUrl('/create-payment-intent');

export const fetchFromApi = async <T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> => {
  const url = getApiUrl(endpoint);
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  
  return response.json();
};

export default {
  getApiUrl,
  fetchFromApi,
}; 