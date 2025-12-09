/**
 * Date utility functions for consistent date handling across the application
 * Fixes timezone issues and provides standard date formatting
 */

/**
 * Parse date string to YYYY-MM-DD format, handling various input formats
 * @param {string|Date} dateStr - Date string or Date object to parse
 * @returns {string|null} Date in YYYY-MM-DD format, or null if invalid
 */
function parseDate(dateStr) {
  if (!dateStr || dateStr === 'null' || dateStr === 'undefined') return null;

  // Handle various input formats
  let dateInput = dateStr.toString();

  // If the input contains 'T' (ISO format), strip the time part
  if (dateInput.includes('T')) {
    dateInput = dateInput.split('T')[0];
  }

  // If the input contains 'Z' or timezone info, handle it
  if (dateInput.includes('Z') || dateInput.match(/[+-]\d{2}:\d{2}$/)) {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  }

  // Check if it's already in YYYY-MM-DD format
  if (dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateInput;
  }

  // Try to parse as date and format
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (e) {
    console.warn(`Could not parse date: ${dateStr}`);
  }

  return null;
}

/**
 * Format a date to a human-readable string
 * @param {string|Date} dateStr - Date to format
 * @param {string} locale - Locale for formatting (default: 'en-US')
 * @returns {string|null} Formatted date string or null
 */
function formatDate(dateStr, locale = 'en-US') {
  if (!dateStr) return null;

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;

    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    console.warn(`Could not format date: ${dateStr}`);
    return null;
  }
}

/**
 * Check if a date string is valid
 * @param {string} dateStr - Date string to validate
 * @returns {boolean} True if valid date
 */
function isValidDate(dateStr) {
  if (!dateStr) return false;
  const parsed = parseDate(dateStr);
  return parsed !== null;
}

/**
 * Calculate age from birth date
 * @param {string} birthDate - Birth date in YYYY-MM-DD format
 * @param {string} deathDate - Optional death date for deceased persons
 * @returns {number|null} Age in years or null if invalid
 */
function calculateAge(birthDate, deathDate = null) {
  if (!birthDate) return null;

  try {
    const birth = new Date(birthDate);
    const endDate = deathDate ? new Date(deathDate) : new Date();

    if (isNaN(birth.getTime()) || isNaN(endDate.getTime())) return null;

    let age = endDate.getFullYear() - birth.getFullYear();
    const monthDiff = endDate.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && endDate.getDate() < birth.getDate())) {
      age--;
    }

    return age >= 0 ? age : null;
  } catch (e) {
    console.warn(`Could not calculate age: ${birthDate}`);
    return null;
  }
}

module.exports = {
  parseDate,
  formatDate,
  isValidDate,
  calculateAge
};
