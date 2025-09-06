import './index.css'; // 👈 Add this line first
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

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
