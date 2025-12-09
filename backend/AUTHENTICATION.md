# Authentication Implementation Guide

## Current Status

✅ **Infrastructure Complete:**
- JWT dependencies installed (jsonwebtoken, bcryptjs)
- Users table created in database
- Auth middleware active (`backend/middleware/auth.js`)
- Auth routes created (`/api/auth/login`, `/api/auth/register`)
- Environment variables configured

⚠️ **Requires Frontend Integration:**
- Frontend needs to implement login/register UI
- Frontend needs to store and send JWT tokens
- Frontend needs to handle 401/403 responses

## How to Enable Full Authentication

### Option 1: Enable Auth for Specific Routes (Recommended First Step)

Add `authenticateToken` middleware to critical write operations:

```javascript
// In backend/routes/members.js
const { authenticateToken } = require('../middleware/auth');

// Protect POST, PUT, DELETE operations
router.post('/', authenticateToken, async (req, res) => { ... });
router.put('/:id', authenticateToken, async (req, res) => { ... });
router.delete('/:id', authenticateToken, async (req, res) => { ... });

// Leave GET operations public for now
router.get('/', async (req, res) => { ... });
```

### Option 2: Enable Auth for All Routes

Apply middleware at the router level in `app.js`:

```javascript
// Apply to all routes except auth
app.use('/api/tree', authenticateToken, treeRoute);
app.use('/api/members', authenticateToken, membersRoute);
// etc...
```

## Frontend Integration Required

### 1. Create Login/Register Pages

```javascript
// Login example
const response = await fetch('http://localhost:5050/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});

const { token } = await response.json();
localStorage.setItem('auth_token', token);
```

### 2. Send Token with Requests

```javascript
// Add Authorization header to all API calls
const response = await fetch('http://localhost:5050/api/members', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
  }
});
```

### 3. Handle Auth Errors

```javascript
if (response.status === 401 || response.status === 403) {
  // Token invalid or expired - redirect to login
  localStorage.removeItem('auth_token');
  window.location.href = '/login';
}
```

## Testing Authentication

### 1. Create a Test User

```bash
curl -X POST http://localhost:5050/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"admin@family.com","password":"changeme123","role":"admin"}'
```

### 2. Login and Get Token

```bash
curl -X POST http://localhost:5050/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"changeme123"}'
```

### 3. Use Token to Access Protected Routes

```bash
curl http://localhost:5050/api/members \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## User Roles

- **admin**: Full access to all operations
- **editor**: Can create/edit members and photos
- **viewer**: Read-only access (default)

## Security Notes

- JWT tokens expire after 15 minutes (configurable via `JWT_EXPIRES_IN`)
- Passwords are hashed with bcrypt (10 rounds)
- Tokens can be refreshed using `/api/auth/refresh`
- Set a secure `JWT_SECRET` in production (generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)

## Next Steps

1. Generate secure JWT_SECRET for production
2. Implement frontend login/register UI
3. Add token storage and request interceptors
4. Apply authentication middleware to routes
5. Test auth flow end-to-end
6. Add token refresh logic
7. Implement logout functionality
