/**
 * HTTP Request Logging Middleware
 * Logs all incoming requests with timing and response information
 */

const logger = require('../config/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Request logging middleware
 * Adds request ID and logs request/response details
 */
function requestLogger(req, res, next) {
  // Generate unique request ID
  const requestId = uuidv4();
  req.requestId = requestId;

  // Start timer
  const startTime = Date.now();

  // Log incoming request
  logger.info('Incoming request', {
    requestId,
    method: req.method,
    url: req.url,
    path: req.path,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    query: req.query,
    body: req.method !== 'GET' ? sanitizeBody(req.body) : undefined
  });

  // Capture the original res.json and res.send
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  // Override res.json to log response
  res.json = function (body) {
    logResponse(req, res, startTime, body);
    return originalJson(body);
  };

  // Override res.send to log response
  res.send = function (body) {
    logResponse(req, res, startTime, body);
    return originalSend(body);
  };

  // Handle response finish event
  res.on('finish', () => {
    if (!res._loggedResponse) {
      logResponse(req, res, startTime);
    }
  });

  next();
}

/**
 * Log response details
 */
function logResponse(req, res, startTime, body = null) {
  if (res._loggedResponse) return;
  res._loggedResponse = true;

  const duration = Date.now() - startTime;
  const logData = {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    duration: `${duration}ms`,
    contentLength: res.get('content-length')
  };

  // Add user information if available
  if (req.user) {
    logData.userId = req.user.id;
    logData.userEmail = req.user.email;
  }

  // Log at appropriate level based on status code
  if (res.statusCode >= 500) {
    logger.error('Request completed with server error', {
      ...logData,
      responseBody: body ? sanitizeBody(body) : undefined
    });
  } else if (res.statusCode >= 400) {
    logger.warn('Request completed with client error', {
      ...logData,
      responseBody: body ? sanitizeBody(body) : undefined
    });
  } else {
    logger.info('Request completed successfully', logData);
  }
}

/**
 * Sanitize sensitive data from request/response bodies
 */
function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return body;

  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'api_key'];

  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
}

/**
 * Error logging middleware
 * Should be added after routes but before general error handler
 */
function errorLogger(err, req, res, next) {
  logger.error('Request error', {
    requestId: req.requestId,
    error: {
      message: err.message,
      stack: err.stack,
      code: err.code,
      statusCode: err.statusCode
    },
    method: req.method,
    url: req.url,
    path: req.path,
    userId: req.user?.id,
    userEmail: req.user?.email
  });

  next(err);
}

module.exports = {
  requestLogger,
  errorLogger
};
