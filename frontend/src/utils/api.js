/**
 * API Utility - Centralized fetch wrapper with automatic JWT token inclusion
 */

const API_URL = process.env.REACT_APP_API || 'http://localhost:5050';

/**
 * Get the auth token from localStorage
 */
const getToken = () => {
  return localStorage.getItem('familyVine_token');
};

/**
 * Fetch wrapper that automatically includes Authorization header
 * @param {string} endpoint - API endpoint (e.g., '/api/members')
 * @param {object} options - fetch options (method, headers, body, etc.)
 */
export const apiFetch = async (endpoint, options = {}) => {
  const token = getToken();
  
  // Build headers with token
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Build full URL
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  
  // Make request
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  // Handle 401 Unauthorized - token expired or invalid
  if (response.status === 401) {
    // Clear auth state and redirect to login
    localStorage.removeItem('familyVine_token');
    localStorage.removeItem('familyVine_user');
    localStorage.removeItem('familyVine_loggedIn');
    window.location.href = '/login';
    throw new Error('Authentication required');
  }
  
  return response;
};

/**
 * Convenience method for GET requests
 */
export const apiGet = (endpoint) => {
  return apiFetch(endpoint, { method: 'GET' });
};

/**
 * Convenience method for POST requests
 */
export const apiPost = (endpoint, data) => {
  return apiFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

/**
 * Convenience method for PUT requests
 */
export const apiPut = (endpoint, data) => {
  return apiFetch(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

/**
 * Convenience method for DELETE requests
 */
export const apiDelete = (endpoint) => {
  return apiFetch(endpoint, { method: 'DELETE' });
};

export default apiFetch;
