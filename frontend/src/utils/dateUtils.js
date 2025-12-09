/**
 * Date utility functions for the frontend
 * Provides consistent date formatting and parsing across the application
 */

/**
 * Format a date string to a localized date
 * @param {string|Date} dateStr - Date string or Date object
 * @param {string} locale - Locale for formatting (default: 'en-US')
 * @returns {string|null} Formatted date string or null
 */
export function formatDate(dateStr, locale = 'en-US') {
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
    console.warn('Could not format date:', dateStr);
    return null;
  }
}

/**
 * Format a date to short format (MM/DD/YYYY)
 * @param {string|Date} dateStr - Date string or Date object
 * @returns {string|null} Formatted date string or null
 */
export function formatDateShort(dateStr) {
  if (!dateStr) return null;

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;

    return date.toLocaleDateString('en-US');
  } catch (e) {
    console.warn('Could not format date:', dateStr);
    return null;
  }
}

/**
 * Get year from date string
 * @param {string|Date} dateStr - Date string or Date object
 * @returns {number|null} Year or null
 */
export function getYear(dateStr) {
  if (!dateStr) return null;

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.getFullYear();
  } catch (e) {
    console.warn('Could not get year from date:', dateStr);
    return null;
  }
}

/**
 * Calculate age from birth date
 * @param {string} birthDate - Birth date string
 * @param {string} deathDate - Optional death date for deceased persons
 * @returns {number|null} Age in years or null
 */
export function calculateAge(birthDate, deathDate = null) {
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
    console.warn('Could not calculate age:', birthDate);
    return null;
  }
}

/**
 * Create a Date object from year, month, day
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @param {number} day - Day
 * @returns {Date|null} Date object or null if invalid
 */
export function createDate(year, month, day) {
  if (!year || !month || !day) return null;

  try {
    // JavaScript months are 0-indexed
    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) return null;
    return date;
  } catch (e) {
    console.warn('Could not create date:', year, month, day);
    return null;
  }
}

/**
 * Parse date string to YYYY-MM-DD format
 * @param {string|Date} dateStr - Date string or Date object
 * @returns {string|null} Date in YYYY-MM-DD format or null
 */
export function parseDateToISO(dateStr) {
  if (!dateStr) return null;

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  } catch (e) {
    console.warn('Could not parse date to ISO:', dateStr);
    return null;
  }
}

/**
 * Check if a date is valid
 * @param {string|Date} dateStr - Date string or Date object
 * @returns {boolean} True if valid date
 */
export function isValidDate(dateStr) {
  if (!dateStr) return false;

  try {
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  } catch (e) {
    return false;
  }
}

/**
 * Get days in a month
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @returns {number} Number of days in month
 */
export function getDaysInMonth(year, month) {
  // JavaScript months are 0-indexed, so month + 1 - 1 = month
  return new Date(year, month, 0).getDate();
}

/**
 * Get first day of month (0 = Sunday, 6 = Saturday)
 * @param {number} year - Year
 * @param {number} month - Month (0-11, JavaScript convention)
 * @returns {number} Day of week (0-6)
 */
export function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

/**
 * Format date for display with birth/death notation
 * @param {string} birthDate - Birth date
 * @param {string} deathDate - Death date (optional)
 * @param {boolean} isAlive - Whether person is alive
 * @returns {string} Formatted life span
 */
export function formatLifeSpan(birthDate, deathDate, isAlive = true) {
  const birthYear = birthDate ? getYear(birthDate) : '?';

  if (!isAlive && deathDate) {
    const deathYear = getYear(deathDate);
    return `${birthYear} - ${deathYear}`;
  } else if (!isAlive && !deathDate) {
    return `${birthYear} - ?`;
  } else {
    return `b. ${birthYear}`;
  }
}

/**
 * Check if date is in the future
 * @param {string|Date} dateStr - Date to check
 * @returns {boolean} True if date is in the future
 */
export function isFutureDate(dateStr) {
  if (!dateStr) return false;

  try {
    const date = new Date(dateStr);
    const now = new Date();
    return date > now;
  } catch (e) {
    return false;
  }
}

/**
 * Check if date is within N days from now
 * @param {string|Date} dateStr - Date to check
 * @param {number} days - Number of days
 * @returns {boolean} True if within N days
 */
export function isWithinDays(dateStr, days) {
  if (!dateStr || !days) return false;

  try {
    const date = new Date(dateStr);
    const now = new Date();
    const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));

    return date >= now && date <= futureDate;
  } catch (e) {
    return false;
  }
}

/**
 * Get month name from number
 * @param {number} month - Month number (1-12)
 * @returns {string} Month name
 */
export function getMonthName(month) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return months[month - 1] || '';
}

/**
 * Format relative time (e.g., "2 days ago", "in 3 weeks")
 * @param {string|Date} dateStr - Date to format
 * @returns {string} Relative time string
 */
export function formatRelativeTime(dateStr) {
  if (!dateStr) return '';

  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date - now;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 0 && diffDays < 7) return `In ${diffDays} days`;
    if (diffDays < 0 && diffDays > -7) return `${Math.abs(diffDays)} days ago`;
    if (diffDays >= 7 && diffDays < 14) return 'Next week';
    if (diffDays <= -7 && diffDays > -14) return 'Last week';

    return formatDateShort(dateStr);
  } catch (e) {
    return '';
  }
}
