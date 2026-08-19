import axios from 'axios';

/**
 * Pre-configured Axios instance for Worldwide Hotel Search API requests
 */
export const apiClient = axios.create({
  baseURL: 'https://delivero-62hy.onrender.com',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
  timeout: 30000, // 30 second timeout for availability searches
});

// Response interceptor to handle parsing strings or logging helpful error tracebacks
apiClient.interceptors.response.use(
  (response) => {
    // Automatically parse response if server returns JSON string
    if (typeof response.data === 'string') {
      try {
        response.data = JSON.parse(response.data);
      } catch (e) {
        // Leave as string if not valid JSON
      }
    }
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(
        `API Error ${error.response.status} from ${error.config?.url}:`,
        error.response.data || error.message
      );
    } else if (error.request) {
      console.error('API Network Error (No response received):', error.message);
    } else {
      console.error('API Request Configuration Error:', error.message);
    }
    return Promise.reject(error);
  }
);
