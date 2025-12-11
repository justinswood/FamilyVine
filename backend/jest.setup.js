// Jest setup file for backend tests

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.JWT_EXPIRES_IN = '1h';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'familyvine_test';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';

// Increase timeout for database operations
jest.setTimeout(10000);

// Mock logger to avoid cluttering test output
jest.mock('./config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));
