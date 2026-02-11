/**
 * Name utility functions for the frontend
 * Provides consistent name formatting with nickname support
 */

/**
 * Format a member's full name with optional nickname
 * @param {Object} member - Member object with name fields
 * @param {string} member.first_name - First name
 * @param {string} member.middle_name - Middle name (optional)
 * @param {string} member.nickname - Nickname (optional)
 * @param {string} member.last_name - Last name
 * @param {string} member.suffix - Suffix like Jr., Sr., III (optional)
 * @param {boolean} includeMiddle - Whether to include middle name (default: true)
 * @returns {string} Formatted full name
 *
 * @example
 * formatFullName({ first_name: 'Percy', nickname: 'Big Daddy', middle_name: 'Lee', last_name: 'Manning', suffix: 'Jr.' })
 * // Returns: "Percy "Big Daddy" Lee Manning Jr."
 *
 * formatFullName({ first_name: 'John', last_name: 'Doe' })
 * // Returns: "John Doe"
 */
export function formatFullName(member, includeMiddle = true) {
  if (!member) return 'Unknown Name';

  const firstName = (member.first_name || '').trim();
  const middleName = includeMiddle ? (member.middle_name || '').trim() : '';
  const nickname = (member.nickname || '').trim();
  const lastName = (member.last_name || '').trim();
  const suffix = (member.suffix || '').trim();

  // Build name parts array
  const parts = [];

  // Add first name
  if (firstName) {
    parts.push(firstName);
  }

  // Add nickname in quotes if it exists
  if (nickname) {
    parts.push(`"${nickname}"`);
  }

  // Add middle name if requested and exists
  if (includeMiddle && middleName) {
    parts.push(middleName);
  }

  // Add last name
  if (lastName) {
    parts.push(lastName);
  }

  // Add suffix (Jr., Sr., III, etc.)
  if (suffix) {
    parts.push(suffix);
  }

  // Join parts with spaces and return
  const fullName = parts.join(' ');
  return fullName || 'Unknown Name';
}

/**
 * Format a member's name without middle name
 * @param {Object} member - Member object with name fields
 * @returns {string} Formatted name without middle name
 *
 * @example
 * formatShortName({ first_name: 'Percy', nickname: 'Big Daddy', last_name: 'Manning' })
 * // Returns: "Percy "Big Daddy" Manning"
 */
export function formatShortName(member) {
  return formatFullName(member, false);
}

/**
 * Format first and last name only (no middle name, no nickname)
 * @param {Object} member - Member object with name fields
 * @returns {string} First and last name only
 *
 * @example
 * formatSimpleName({ first_name: 'Percy', nickname: 'Big Daddy', middle_name: 'Lee', last_name: 'Manning' })
 * // Returns: "Percy Manning"
 */
export function formatSimpleName(member) {
  if (!member) return 'Unknown Name';

  const firstName = (member.first_name || '').trim();
  const lastName = (member.last_name || '').trim();
  const suffix = (member.suffix || '').trim();

  const parts = [];
  if (firstName) parts.push(firstName);
  if (lastName) parts.push(lastName);
  if (suffix) parts.push(suffix);

  return parts.join(' ') || 'Unknown Name';
}

/**
 * Get member's initials (first and last name only, no nickname)
 * @param {Object} member - Member object with name fields
 * @returns {string} Member initials (e.g., "PM")
 *
 * @example
 * getInitials({ first_name: 'Percy', last_name: 'Manning' })
 * // Returns: "PM"
 */
export function getInitials(member) {
  if (!member) return '??';

  const firstName = (member.first_name || '').trim();
  const lastName = (member.last_name || '').trim();

  const firstInitial = firstName ? firstName[0].toUpperCase() : '';
  const lastInitial = lastName ? lastName[0].toUpperCase() : '';

  return `${firstInitial}${lastInitial}` || '??';
}

/**
 * Validate nickname length and content
 * @param {string} nickname - Nickname to validate
 * @returns {Object} Validation result with isValid and error message
 *
 * @example
 * validateNickname('Big Daddy')
 * // Returns: { isValid: true, error: null }
 *
 * validateNickname('A'.repeat(101))
 * // Returns: { isValid: false, error: 'Nickname is too long (max 100 characters)' }
 */
export function validateNickname(nickname) {
  if (!nickname || nickname.trim() === '') {
    return { isValid: true, error: null }; // Empty is valid (optional field)
  }

  const trimmed = nickname.trim();

  // Check length (max 100 characters based on database schema)
  if (trimmed.length > 100) {
    return {
      isValid: false,
      error: 'Nickname is too long (max 100 characters)'
    };
  }

  // All other cases are valid
  return { isValid: true, error: null };
}
