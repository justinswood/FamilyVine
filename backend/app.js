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
const app = express();

// CORS configuration for production
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      'https://family.techwoods.cc',     // Production domain (HTTPS only)
      'http://192.168.1.171:3030',       // Specific local IP for family use
    ]
  : [
      'http://localhost:3000',           // Local development
      'http://localhost:3030',           // Local frontend
      'http://192.168.1.120:3000',       // Development machine
      'http://192.168.1.171:3030',       // Production machine
    ];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, mobile apps, health checks)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

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
        "http://localhost:5050",
        "http://192.168.1.171:5050",
        "http://192.168.1.120:5050"
      ],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: [
        "'self'",
        "http://localhost:5050",
        "http://192.168.1.171:5050",
        "http://192.168.1.120:5050"
      ]
    }
  },
  crossOriginEmbedderPolicy: false, // Allow embedding images
  crossOriginResourcePolicy: { policy: "cross-origin" } // Allow images from different origin
}));

// Disable X-Powered-By header
app.disable('x-powered-by');

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per window (increased for normal usage)
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Parse JSON
app.use(express.json());

// Serve static files from uploads directory with CORS headers for images
app.use('/uploads', (req, res, next) => {
  const origin = req.headers.origin;

  // Allow images to be loaded from allowed origins
  if (!origin || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
  }

  next();
}, express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

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
});