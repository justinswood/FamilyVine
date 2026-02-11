const { Pool } = require('pg');
const logger = require('./logger');

// Validate required database environment variables
// Fail fast if credentials are not properly configured
const requiredEnvVars = ['DB_USER', 'DB_HOST', 'DB_NAME', 'DB_PASSWORD'];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);

if (missingVars.length > 0) {
  const error = `FATAL: Missing required database environment variables: ${missingVars.join(', ')}`;
  logger.error(error);
  throw new Error(error);
}

// Centralized database connection pool
// NO FALLBACK VALUES - all credentials must come from environment
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432', 10),

  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // How long to wait for a connection
  statement_timeout: 30000, // 30 second query timeout to prevent long-running queries
});

// Handle pool errors
pool.on('error', (err, client) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  pool.end(() => {
    logger.info('Database pool has ended');
  });
});

module.exports = pool;
