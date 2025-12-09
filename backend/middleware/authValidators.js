/**
 * Authentication Input Validation using express-validator
 */

const { body, validationResult } = require('express-validator');

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => err.msg)
    });
  }
  next();
};

/**
 * Validation rules for user registration
 */
const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens')
    .escape(),

  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email must be less than 255 characters'),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  body('role')
    .optional()
    .isIn(['admin', 'editor', 'viewer'])
    .withMessage('Role must be admin, editor, or viewer'),

  handleValidationErrors
];

/**
 * Validation rules for user login
 */
const validateLogin = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ max: 50 })
    .withMessage('Username is too long')
    .escape(),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ max: 255 })
    .withMessage('Password is too long'),

  handleValidationErrors
];

/**
 * Validation rules for story creation/update
 */
const validateStory = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Story title is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters')
    .escape(),

  body('content')
    .trim()
    .notEmpty()
    .withMessage('Story content is required')
    .isLength({ min: 1, max: 50000 })
    .withMessage('Content must be between 1 and 50,000 characters'),

  body('author_name')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Author name must be less than 255 characters')
    .escape(),

  body('story_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),

  body('member_ids')
    .optional()
    .isArray()
    .withMessage('member_ids must be an array'),

  body('member_ids.*')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Each member_id must be a positive integer'),

  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validateStory,
  handleValidationErrors
};
