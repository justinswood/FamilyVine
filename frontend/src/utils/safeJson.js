/**
 * Safe JSON Parsing Utilities
 * Prevents crashes from corrupted localStorage or malformed JSON
 */

/**
 * Safely parse JSON string with fallback
 * @param {string} jsonString - JSON string to parse
 * @param {any} defaultValue - Value to return if parsing fails
 * @returns {any} Parsed object or default value
 */
export function safeJsonParse(jsonString, defaultValue = null) {
  if (!jsonString || typeof jsonString !== 'string') {
    return defaultValue;
  }

  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('JSON parse error:', error.message);
    return defaultValue;
  }
}

/**
 * Safely stringify object to JSON
 * @param {any} obj - Object to stringify
 * @param {string} defaultValue - Value to return if stringify fails
 * @returns {string} JSON string or default value
 */
export function safeJsonStringify(obj, defaultValue = '{}') {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    console.warn('JSON stringify error:', error.message);
    return defaultValue;
  }
}

/**
 * Safely get and parse JSON from localStorage
 * @param {string} key - localStorage key
 * @param {any} defaultValue - Value to return if not found or parse fails
 * @returns {any} Parsed value or default
 */
export function getLocalStorageJson(key, defaultValue = null) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return defaultValue;
  }

  try {
    const item = window.localStorage.getItem(key);
    return item ? safeJsonParse(item, defaultValue) : defaultValue;
  } catch (error) {
    console.warn(`Error reading localStorage key "${key}":`, error.message);
    return defaultValue;
  }
}

/**
 * Safely set JSON in localStorage
 * @param {string} key - localStorage key
 * @param {any} value - Value to store
 * @returns {boolean} True if successful
 */
export function setLocalStorageJson(key, value) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  try {
    const jsonString = safeJsonStringify(value);
    window.localStorage.setItem(key, jsonString);
    return true;
  } catch (error) {
    console.warn(`Error writing localStorage key "${key}":`, error.message);
    return false;
  }
}

/**
 * Remove item from localStorage safely
 * @param {string} key - localStorage key
 * @returns {boolean} True if successful
 */
export function removeLocalStorage(key) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Error removing localStorage key "${key}":`, error.message);
    return false;
  }
}

export default {
  safeJsonParse,
  safeJsonStringify,
  getLocalStorageJson,
  setLocalStorageJson,
  removeLocalStorage
};
