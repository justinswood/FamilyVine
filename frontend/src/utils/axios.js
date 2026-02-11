import axios from 'axios';

// Create axios instance with base configuration
const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API ?? '',
});

// Request interceptor to add JWT token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('familyVine_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401/403 errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle both 401 (no token) and 403 (invalid/expired token)
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token expired or invalid - clear auth and redirect to login
      localStorage.removeItem('familyVine_token');
      localStorage.removeItem('familyVine_user');
      localStorage.removeItem('familyVine_loggedIn');
      localStorage.removeItem('familyVine_lastVerified');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
