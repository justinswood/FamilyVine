/**
 * Input Validation Middleware
 *
 * NOTE: This provides basic validation structure.
 * For production, consider using: npm install joi or express-validator
 *
 * Usage:
 * const { validateMember } = require('../middleware/validators');
 * router.post('/api/members', validateMember, async (req, res) => { ... });
 */

/**
 * Validation helper - checks if value matches pattern
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return !email || emailRegex.test(email);
};

const isValidPhone = (phone) => {
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
  return !phone || phoneRegex.test(phone);
};

const isValidDate = (date) => {
  if (!date) return true;
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
};

/**
 * Validate member data
 */
const validateMember = (req, res, next) => {
  const { first_name, last_name, email, phone, birth_date, death_date } = req.body;

  const errors = [];

  // Required fields
  if (!first_name || first_name.trim().length === 0) {
    errors.push('First name is required');
  }
  if (!last_name || last_name.trim().length === 0) {
    errors.push('Last name is required');
  }

  // String length validations
  if (first_name && first_name.length > 255) {
    errors.push('First name must be less than 255 characters');
  }
  if (last_name && last_name.length > 255) {
    errors.push('Last name must be less than 255 characters');
  }

  // Email validation
  if (email && !isValidEmail(email)) {
    errors.push('Invalid email format');
  }

  // Phone validation
  if (phone && !isValidPhone(phone)) {
    errors.push('Invalid phone format');
  }

  // Date validations
  if (birth_date && !isValidDate(birth_date)) {
    errors.push('Invalid birth date');
  }
  if (death_date && !isValidDate(death_date)) {
    errors.push('Invalid death date');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

/**
 * Validate ID parameter
 */
const validateId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];

    if (!id || isNaN(parseInt(id, 10)) || parseInt(id, 10) <= 0) {
      return res.status(400).json({
        error: `Invalid ${paramName}`,
        details: [`${paramName} must be a positive integer`]
      });
    }

    next();
  };
};

/**
 * Validate album data
 */
const validateAlbum = (req, res, next) => {
  const { title } = req.body;

  const errors = [];

  if (!title || title.trim().length === 0) {
    errors.push('Album title is required');
  }

  if (title && title.length > 255) {
    errors.push('Album title must be less than 255 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

/**
 * Validate relationship data
 */
const validateRelationship = (req, res, next) => {
  const { member1_id, member2_id, relationship_type } = req.body;

  const errors = [];

  if (!member1_id || isNaN(parseInt(member1_id, 10))) {
    errors.push('member1_id must be a valid integer');
  }

  if (!member2_id || isNaN(parseInt(member2_id, 10))) {
    errors.push('member2_id must be a valid integer');
  }

  if (!relationship_type || relationship_type.trim().length === 0) {
    errors.push('relationship_type is required');
  }

  if (member1_id && member2_id && member1_id === member2_id) {
    errors.push('Cannot create relationship with self');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

/**
 * Sanitize search query to prevent injection
 */
const validateSearchQuery = (req, res, next) => {
  const { q } = req.query;

  if (q) {
    // Remove potentially dangerous characters
    const sanitized = q.replace(/[<>\"'%;()&+]/g, '');

    // Limit length
    if (sanitized.length > 100) {
      return res.status(400).json({
        error: 'Search query too long',
        details: ['Search query must be less than 100 characters']
      });
    }

    req.query.q = sanitized;
  }

  next();
};

module.exports = {
  validateMember,
  validateId,
  validateAlbum,
  validateRelationship,
  validateSearchQuery,
  // Export helpers for custom validations
  isValidEmail,
  isValidPhone,
  isValidDate
};
