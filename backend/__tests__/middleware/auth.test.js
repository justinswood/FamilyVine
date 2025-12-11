/**
 * Unit tests for authentication middleware
 */

const jwt = require('jsonwebtoken');

// Mock dependencies before requiring the module
jest.mock('../../config/database');
jest.mock('../../config/env', () => ({
  getEnvVar: jest.fn(() => 'test-secret-key')
}));
jest.mock('jsonwebtoken');

const { authenticateToken, requireRole } = require('../../middleware/auth');

describe('auth middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should call next() with valid token', () => {
      const mockUser = { id: 1, email: 'test@example.com', role: 'viewer' };
      const token = 'valid-token';

      req.headers['authorization'] = `Bearer ${token}`;
      jwt.verify.mockReturnValue(mockUser);

      authenticateToken(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith(token, 'test-secret-key');
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 401 when no token provided', () => {
      req.headers['authorization'] = null;

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Access token required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when token is malformed (no Bearer prefix)', () => {
      req.headers['authorization'] = 'invalid-format-token';

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Access token required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 when token is invalid', () => {
      req.headers['authorization'] = 'Bearer invalid-token';
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 when token is expired', () => {
      req.headers['authorization'] = 'Bearer expired-token';
      const expiredError = new Error('Token expired');
      expiredError.name = 'TokenExpiredError';
      jwt.verify.mockImplementation(() => {
        throw expiredError;
      });

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('should allow access when user has required role', () => {
      req.user = { id: 1, role: 'admin' };
      const middleware = requireRole('admin');

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow access when user has editor role for editor requirement', () => {
      req.user = { id: 1, role: 'editor' };
      const middleware = requireRole('editor');

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should allow access when user has role in roles array', () => {
      req.user = { id: 1, role: 'viewer', roles: ['editor', 'viewer'] };
      const middleware = requireRole('editor');

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should deny access when user lacks required role', () => {
      req.user = { id: 1, role: 'viewer' };
      const middleware = requireRole('editor');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'editor role required'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny access when user has no role', () => {
      req.user = { id: 1 }; // No role property
      const middleware = requireRole('editor');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'editor role required'
      });
    });

    it('should deny access when no user in request', () => {
      req.user = undefined;
      const middleware = requireRole('editor');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required'
      });
    });

    it('should handle multiple roles correctly', () => {
      // Viewer should not access admin routes
      req.user = { id: 1, role: 'viewer' };
      const adminMiddleware = requireRole('admin');

      adminMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'admin role required'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
