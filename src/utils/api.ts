// Always use a relative API path to avoid CORS and origin mismatches
export const getApiUrl = (endpoint: string): string => `/api${endpoint}`;

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