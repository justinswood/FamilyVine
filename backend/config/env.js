/**
 * Environment Variable Validation
 * Ensures all required environment variables are set on startup
 */

const logger = require('./logger');

/**
 * Get required environment variable or throw error
 * @param {string} key - Environment variable name
 * @param {string} defaultValue - Optional default value (only for non-sensitive vars)
 * @returns {string} Environment variable value
 */
function getEnvVar(key, defaultValue = null) {
  const value = process.env[key];

  if (!value && defaultValue === null) {
    const error = `FATAL: Required environment variable ${key} is not set. Application cannot start.`;
    logger.error(error);
    throw new Error(error);
  }

  return value || defaultValue;
}

/**
 * Validate all required environment variables on startup
 * Fails fast if any required vars are missing
 */
function validateEnv() {
  const required = {
    // Security - NO DEFAULTS ALLOWED
    JWT_SECRET: null,

    // Database - MUST be configured
    DB_HOST: null,
    DB_PORT: null,
    DB_NAME: null,
    DB_USER: null,
    DB_PASSWORD: null,

    // Optional with safe defaults
    NODE_ENV: 'development',
    PORT: '5000',
    JWT_EXPIRES_IN: '7d',
    LOG_LEVEL: 'info'
  };

  const config = {};

  for (const [key, defaultValue] of Object.entries(required)) {
    try {
      config[key] = getEnvVar(key, defaultValue);
    } catch (error) {
      // For critical vars, exit immediately
      if (key === 'JWT_SECRET' || key.startsWith('DB_')) {
        logger.error('Missing critical environment variable', { key });
        process.exit(1);
      }
      throw error;
    }
  }

  // Validate JWT_SECRET strength
  if (config.JWT_SECRET && config.JWT_SECRET.length < 32) {
    logger.warn('JWT_SECRET is too short. Recommended minimum length is 32 characters.');
  }

  // Warn if using development mode in production-like ports
  if (config.NODE_ENV === 'development' && parseInt(config.PORT) >= 5000) {
    logger.warn('Running in development mode on production-like port', {
      port: config.PORT
    });
  }

  logger.info('Environment validation successful', {
    nodeEnv: config.NODE_ENV,
    port: config.PORT,
    dbHost: config.DB_HOST,
    dbName: config.DB_NAME
  });

  return config;
}

module.exports = {
  getEnvVar,
  validateEnv
};
