# Swagger/OpenAPI Documentation Setup

This guide explains how to set up and use the Swagger/OpenAPI documentation for the FamilyVine API.

## Installation

### 1. Install Required Dependencies

```bash
cd /opt/familyvine/backend
npm install swagger-jsdoc swagger-ui-express --save
```

### 2. Update app.js

Add the following code to `app.js` after the middleware setup and before the routes:

```javascript
// Import swagger modules
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

// Swagger documentation endpoint (add before your API routes)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'FamilyVine API Documentation'
}));
```

**Complete example with context:**

```javascript
// ... existing imports ...
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

// ... existing middleware setup (cors, helmet, etc.) ...

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'FamilyVine API Documentation'
}));

// API routes
app.use('/api/auth', authLimiter, authRoute);
// ... rest of your routes ...
```

### 3. Rebuild and Restart Docker Container

```bash
# Rebuild the backend image with new dependencies
docker build -t familyvine_backend:latest ./backend

# Restart the backend container
docker restart familyvine-backend-1
```

## Accessing the Documentation

Once the setup is complete, access the Swagger UI at:

- **Local Development**: http://localhost:5050/api-docs
- **Production**: http://192.168.1.171:5050/api-docs

## Documentation Coverage

### Currently Documented Endpoints

The following authentication endpoints are fully documented:

- `POST /api/auth/register` - Register a new user account
- `POST /api/auth/login` - Login to user account
- `POST /api/auth/forgot-password` - Request password reset token
- `GET /api/auth/verify-reset-token/:token` - Verify password reset token validity
- `POST /api/auth/reset-password` - Reset password with valid token

### Adding Documentation to Other Routes

To document additional endpoints, add JSDoc comments above route definitions in the format:

```javascript
/**
 * @swagger
 * /api/endpoint-path:
 *   method:
 *     summary: Brief description
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ModelName'
 */
router.method('/endpoint-path', async (req, res) => {
  // Route implementation
});
```

## Testing Authenticated Endpoints

Many endpoints require JWT authentication. To test them in Swagger UI:

1. Login using `/api/auth/login` endpoint
2. Copy the JWT token from the response
3. Click the "Authorize" button at the top of Swagger UI
4. Enter the token in the format: `Bearer YOUR_TOKEN_HERE`
5. Click "Authorize" and "Close"
6. Now you can test protected endpoints

## Example Routes to Document Next

Priority routes for documentation:

### Members API
- `GET /api/members` - List all members
- `GET /api/members/:id` - Get member details
- `POST /api/members` - Create new member
- `PUT /api/members/:id` - Update member
- `DELETE /api/members/:id` - Delete member

### Relationships API
- `GET /api/relationships` - List all relationships
- `POST /api/relationships` - Create relationship
- `DELETE /api/relationships/:id` - Delete relationship

### Albums API
- `GET /api/albums` - List all albums
- `GET /api/albums/:id` - Get album details
- `POST /api/albums` - Create album
- `POST /api/albums/:id/photos` - Upload photos

### Tree API
- `GET /api/tree` - Get family tree data
- `GET /api/tree/descendants/:id` - Get descendants
- `GET /api/tree/ancestors/:id` - Get ancestors

## Schema Definitions

Common schemas are defined in `/backend/config/swagger.js`:

- `User` - User account information
- `Member` - Family member details
- `Relationship` - Family relationship
- `Union` - Partner union
- `Album` - Photo album
- `Photo` - Photo details
- `Story` - Family story
- `Error` - Error response format
- `Success` - Success response format

You can reference these using: `$ref: '#/components/schemas/ModelName'`

## Benefits of Swagger Documentation

- **Interactive Testing**: Test all API endpoints directly from the browser
- **Authentication Support**: Built-in JWT token authentication
- **Schema Validation**: Automatically validates requests against defined schemas
- **Client Generation**: Generate API clients for various programming languages
- **Team Collaboration**: Share consistent API documentation with frontend developers
- **Onboarding**: New developers can quickly understand API structure

## Troubleshooting

### Swagger UI not loading

1. Check that dependencies are installed: `npm list swagger-jsdoc swagger-ui-express`
2. Verify swagger configuration exists: `ls -la /opt/familyvine/backend/config/swagger.js`
3. Check backend logs: `docker logs familyvine-backend-1`

### Routes not appearing in documentation

1. Ensure JSDoc comments use `@swagger` tag (not `@openapi`)
2. Verify route files are in the `./routes/` directory
3. Check swagger config `apis` path matches your route file locations
4. Restart the backend after adding new documentation

### Authentication not working in Swagger UI

1. Make sure to include "Bearer " prefix before the token
2. Token format: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
3. Check token expiration (default 8 hours)
4. Verify JWT_SECRET is set in environment variables

## Advanced Configuration

### Disable Swagger in Production (Optional)

If you want to disable Swagger in production for security:

```javascript
// Only enable swagger in development
if (process.env.NODE_ENV !== 'production') {
  const swaggerUi = require('swagger-ui-express');
  const swaggerSpec = require('./config/swagger');

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'FamilyVine API Documentation'
  }));
}
```

### Export OpenAPI Specification

To export the raw OpenAPI JSON:

```javascript
// Add this route to app.js
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});
```

## Next Steps

1. Install swagger dependencies
2. Update app.js with swagger configuration
3. Rebuild and restart backend container
4. Access http://localhost:5050/api-docs to view documentation
5. Test the password reset endpoints
6. Document remaining API routes following the examples in auth.js

For questions or issues, refer to:
- [Swagger JSDoc Documentation](https://github.com/Surnet/swagger-jsdoc)
- [Swagger UI Express](https://github.com/scottie1984/swagger-ui-express)
- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
