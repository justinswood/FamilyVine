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

  describe('requireRole (with hierarchy)', () => {
    // Role hierarchy: viewer (1) < editor (2) < admin (3)

    it('should allow admin access to admin routes', () => {
      req.user = { id: 1, role: 'admin' };
      const middleware = requireRole('admin');

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow admin access to editor routes (hierarchy)', () => {
      req.user = { id: 1, role: 'admin' };
      const middleware = requireRole('editor');

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should allow admin access to viewer routes (hierarchy)', () => {
      req.user = { id: 1, role: 'admin' };
      const middleware = requireRole('viewer');

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should allow editor access to editor routes', () => {
      req.user = { id: 1, role: 'editor' };
      const middleware = requireRole('editor');

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should allow editor access to viewer routes (hierarchy)', () => {
      req.user = { id: 1, role: 'editor' };
      const middleware = requireRole('viewer');

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should deny editor access to admin routes', () => {
      req.user = { id: 1, role: 'editor' };
      const middleware = requireRole('admin');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Insufficient permissions',
        required: 'admin',
        current: 'editor'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny viewer access to editor routes', () => {
      req.user = { id: 1, role: 'viewer' };
      const middleware = requireRole('editor');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Insufficient permissions',
        required: 'editor',
        current: 'viewer'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny viewer access to admin routes', () => {
      req.user = { id: 1, role: 'viewer' };
      const middleware = requireRole('admin');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Insufficient permissions',
        required: 'admin',
        current: 'viewer'
      });
      expect(next).not.toHaveBeenCalled();
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

    it('should deny access when user has unknown role', () => {
      req.user = { id: 1, role: 'unknown' };
      const middleware = requireRole('viewer');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Insufficient permissions',
        required: 'viewer',
        current: 'unknown'
      });
    });

    it('should allow viewer access to viewer routes', () => {
      req.user = { id: 1, role: 'viewer' };
      const middleware = requireRole('viewer');

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });
  });
});
