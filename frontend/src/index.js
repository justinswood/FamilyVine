import './index.css';

// Core Fonts - optimized for FamilyVine
// Note: Removed unused Archivo and Figtree fonts (saved ~200KB)
import '@fontsource/playfair-display/400.css';  // Headers
import '@fontsource/playfair-display/600.css';
import '@fontsource/playfair-display/700.css';
import '@fontsource/inter/400.css';             // Body text
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/spectral/400.css';          // Story content
import '@fontsource/spectral/500.css';
import '@fontsource/dancing-script/400.css';    // Handwritten accents
import '@fontsource/dancing-script/700.css';

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

// Helper to clear auth and redirect to login
const handleSessionExpired = () => {
  // Prevent multiple redirects
  if (window.location.pathname === '/login') return;

  localStorage.removeItem('familyVine_token');
  localStorage.removeItem('familyVine_user');
  localStorage.removeItem('familyVine_loggedIn');
  localStorage.removeItem('familyVine_lastVerified');

  // Redirect with session expired flag
  window.location.href = '/login?session=expired';
};

// Response interceptor to handle 401/403 errors (expired or invalid token)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      handleSessionExpired();
    }
    return Promise.reject(error);
  }
);

// Global fetch interceptor to automatically include JWT token and handle 401s
const originalFetch = window.fetch;
window.fetch = async function(...args) {
  let [url, options = {}] = args;

  // Only add token to API requests (not external resources)
  const apiUrl = process.env.REACT_APP_API ?? '';
  if (url.includes('/api/') || url.startsWith(apiUrl)) {
    const token = localStorage.getItem('familyVine_token');

    if (token) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      };
    }
  }

  const response = await originalFetch(url, options);

  // Handle 401/403 responses for API calls (expired or invalid token)
  if ((response.status === 401 || response.status === 403) && (url.includes('/api/') || url.startsWith(apiUrl))) {
    handleSessionExpired();
  }

  return response;
};

// Verify token when user returns to the tab after being away
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'visible') {
    const token = localStorage.getItem('familyVine_token');
    const lastVerified = localStorage.getItem('familyVine_lastVerified');

    // Only check if we have a token and it's been more than 5 minutes since last verification
    if (token && lastVerified) {
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      if ((now - parseInt(lastVerified)) > fiveMinutes) {
        try {
          const apiUrl = process.env.REACT_APP_API ?? '';
          const response = await originalFetch(`${apiUrl}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (response.ok) {
            localStorage.setItem('familyVine_lastVerified', now.toString());
          } else if (response.status === 401 || response.status === 403) {
            handleSessionExpired();
          }
        } catch (error) {
          // Network error - don't log out, just skip verification
          console.warn('Token verification failed due to network error');
        }
      }
    }
  }
});

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
