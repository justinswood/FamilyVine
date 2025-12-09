import './index.css'; // 👈 Add this line first
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import axios from 'axios';

// Global axios interceptor to automatically include JWT token
axios.interceptors.request.use(
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

// Response interceptor to handle 401 errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth and redirect to login
      localStorage.removeItem('familyVine_token');
      localStorage.removeItem('familyVine_user');
      localStorage.removeItem('familyVine_loggedIn');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Global fetch interceptor to automatically include JWT token
const originalFetch = window.fetch;
window.fetch = function(...args) {
  let [url, options = {}] = args;

  // Only add token to API requests (not external resources)
  const apiUrl = process.env.REACT_APP_API || 'http://localhost:5050';
  if (url.includes('/api/') || url.startsWith(apiUrl)) {
    const token = localStorage.getItem('familyVine_token');

    if (token) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      };
    }
  }

  return originalFetch(url, options);
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register Service Worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('FamilyVine SW: Registration successful', registration.scope);
      })
      .catch((error) => {
        console.log('FamilyVine SW: Registration failed', error);
      });
  });
}
