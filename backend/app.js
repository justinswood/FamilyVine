const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./config/logger');
const { authenticateToken } = require('./middleware/auth');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const authRoute = require('./routes/auth');
const membersRoute = require('./routes/members');
const albumsRoute = require('./routes/albums');
const relationshipsRoute = require('./routes/relationships');
const treePositionsRoute = require('./routes/tree-positions');
const treeRoute = require('./routes/tree');
const storiesRoute = require('./routes/stories');
const heroImagesRoute = require('./routes/hero-images');
const usersRoute = require('./routes/users');
const recipesRoute = require('./routes/recipes');
const worldEventsRoute = require('./routes/world-events');
const preferencesRoute = require('./routes/preferences');
const app = express();

// CORS configuration - allows local network access
// Set CORS_ORIGIN in .env (comma-separated for multiple origins)
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()).filter(Boolean)
  : ['http://localhost:3030'];

// Helper to check if origin is from local network
const isLocalNetworkOrigin = (origin) => {
  if (!origin) return false;
  // Match localhost, 192.168.x.x, 10.x.x.x, 172.16-31.x.x (private IP ranges)
  const localPatterns = [
    /^https?:\/\/localhost(:\d+)?$/,
    /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
    /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/,
    /^https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/,
    /^https?:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}(:\d+)?$/,
  ];
  return localPatterns.some(pattern => pattern.test(origin));
};

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests without Origin header (same-origin via Nginx proxy, health checks, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    // Allow explicit origins and any local network origin
    if (allowedOrigins.includes(origin) || isLocalNetworkOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Health check endpoints - MUST be before CORS middleware
// These endpoints are called by Docker health checks and load balancers without origin headers
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/health/detailed', async (req, res) => {
  const pool = require('./config/database');
  const checks = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: { status: 'unknown', latency: null },
  };

  try {
    // Test database connectivity with timing
    const startTime = Date.now();
    await pool.query('SELECT 1');
    const latency = Date.now() - startTime;

    checks.database = {
      status: 'connected',
      latency: `${latency}ms`,
      pool: {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount
      }
    };

    // Overall status
    const healthy = checks.database.status === 'connected';
    checks.status = healthy ? 'healthy' : 'degraded';

    res.status(healthy ? 200 : 503).json(checks);
  } catch (error) {
    checks.database = {
      status: 'disconnected',
      error: error.message
    };
    checks.status = 'unhealthy';

    logger.error('Health check failed', { error: error.message });
    res.status(503).json(checks);
  }
});

// Static file serving - MUST be before CORS middleware
// Images need to be accessible from browsers without strict origin requirements
app.use('/uploads', (req, res, next) => {
  const origin = req.headers.origin;
  // Allow images from allowed origins, local network, or no origin (direct browser access)
  if (!origin || allowedOrigins.includes(origin) || isLocalNetworkOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  next();
}, express.static(path.join(__dirname, 'uploads')));

app.use(cors(corsOptions));

// Security headers with helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        ...allowedOrigins,
        "https://images.unsplash.com"
      ],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: [
        "'self'",
        ...allowedOrigins
      ],
      mediaSrc: [
        "'self'",
        "blob:"
      ]
    }
  },
  crossOriginEmbedderPolicy: false, // Allow embedding images
  crossOriginResourcePolicy: { policy: "cross-origin" } // Allow images from different origin
}));

// Disable X-Powered-By header
app.disable('x-powered-by');

// Trust proxy (required for correct IP detection behind Cloudflare/nginx)
app.set('trust proxy', 1);

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 requests per window (more reasonable for family app)
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiting (authenticated users)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per window (generous for authenticated family app)
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for write operations (POST, PUT, DELETE)
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 write operations per window
  message: { error: 'Too many modifications, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS',
});

// Parse JSON with size limit to prevent DoS attacks
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Prevent caching of API responses
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// Apply write rate limiter to all routes for POST/PUT/DELETE
app.use(writeLimiter);

// API routes - Order matters!
// Auth routes (public - no authentication required, but rate limited)
app.use('/api/auth', authLimiter, authRoute);

// Protected routes - all require valid JWT token and general rate limiting
app.use('/api/tree', apiLimiter, authenticateToken, treeRoute);
app.use('/api/tree-positions', apiLimiter, authenticateToken, treePositionsRoute);
app.use('/api/relationships', apiLimiter, authenticateToken, relationshipsRoute);
app.use('/api/albums', apiLimiter, authenticateToken, albumsRoute);
app.use('/api/members', apiLimiter, authenticateToken, membersRoute);
app.use('/api/hero-images', apiLimiter, authenticateToken, heroImagesRoute);
app.use('/api/stories', apiLimiter, authenticateToken, storiesRoute);
app.use('/api/recipes', apiLimiter, authenticateToken, recipesRoute);
app.use('/api/world-events', apiLimiter, authenticateToken, worldEventsRoute);
app.use('/api/preferences', apiLimiter, authenticateToken, preferencesRoute);
app.use('/api/users', apiLimiter, usersRoute); // User management (admin only, auth handled in route)

// 404 handler for undefined routes (must come after all route definitions)
app.use(notFoundHandler);

// Centralized error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  logger.info('Backend server started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    allowedOrigins: allowedOrigins
  });

  // Start background jobs
  const { startBirthdayReminderJob } = require('./jobs/birthdayReminders');
  startBirthdayReminderJob();
});