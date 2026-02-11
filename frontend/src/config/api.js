/**
 * API Configuration
 * Uses the Nginx reverse proxy — all API calls are same-origin relative URLs.
 * REACT_APP_API is set to "" at build time; Nginx proxies /api and /uploads to the backend.
 */

export const getApiUrl = () => process.env.REACT_APP_API ?? '';

export const API_URL = getApiUrl();

export default {
  API_URL,
  getApiUrl
};
