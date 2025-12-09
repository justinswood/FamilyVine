/**
 * Authentication Middleware
 *
 * JWT-based authentication for protecting routes
 */

const jwt = require('jsonwebtoken');
const { getEnvVar } = require('../config/env');

// Load JWT secret - will fail if not set
const JWT_SECRET = getEnvVar('JWT_SECRET');

/**
 * Verify JWT token from Authorization header
 * Usage: Add as middleware to protected routes
 * Example: router.get('/api/members', authenticateToken, async (req, res) => { ... })
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user; // Attach user info to request
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Optional authentication - adds user info if token exists, but doesn't require it
 * Useful for routes that behave differently for logged-in users
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const user = jwt.verify(token, JWT_SECRET);
      req.user = user;
    } catch (error) {
      // Invalid token, but continue without user info
      req.user = null;
    }
  }

  next();
};

/**
 * Role-based authorization middleware
 * Checks if user has required role after authentication
 * Usage: router.delete('/api/members/:id', authenticateToken, requireRole('admin'), async (req, res) => { ... })
 */
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== role && !req.user.roles?.includes(role)) {
      return res.status(403).json({ error: `${role} role required` });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireRole
};
