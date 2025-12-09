# Rebuild and Test Authentication

## Complete Implementation Summary

All authentication infrastructure has been implemented:

✅ JWT dependencies added to package.json
✅ Users table added to init.sql
✅ Authentication middleware activated
✅ Auth routes created (/api/auth/login, /register, /me, /refresh)
✅ Environment variables configured
✅ Test script created

## Step 1: Rebuild Docker Containers

The containers need to be rebuilt to:
- Install new JWT dependencies (jsonwebtoken, bcryptjs)
- Initialize the new users table in the database
- Load updated environment variables

```bash
cd /opt/familyvine

# Stop all containers
docker-compose down

# Rebuild and start (this will take a few minutes)
docker-compose up -d --build

# Watch backend logs to verify startup
docker-compose logs -f backend
```

**Look for these success messages in the logs:**
- ✅ "Backend running on port 5000"
- ✅ No errors about missing JWT dependencies
- ✅ Database connections successful

**Press Ctrl+C to stop watching logs once you see the backend is running.**

## Step 2: Run Authentication Tests

Once containers are rebuilt and running:

```bash
cd /opt/familyvine
./test-authentication.sh
```

The script will:
1. ✅ Check backend health
2. ✅ Register a test admin user
3. ✅ Login and get JWT token
4. ✅ Verify token works
5. ✅ Test API access
6. ✅ Check database users table

## Step 3: Manual Testing (Optional)

### Create a User:
```bash
curl -X POST http://localhost:5050/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@family.com",
    "password": "securepass123",
    "role": "viewer"
  }'
```

### Login:
```bash
curl -X POST http://localhost:5050/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "securepass123"
  }'
```

Save the token from the response!

### Use Token:
```bash
curl http://localhost:5050/api/members \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Step 4: Verify Database

Check that the users table was created:

```bash
docker exec familyvine-db-1 psql -U user -d familytree -c "\dt"
```

You should see a `users` table in the output.

Query users:
```bash
docker exec familyvine-db-1 psql -U user -d familytree -c "SELECT id, username, email, role, created_at FROM users;"
```

## Troubleshooting

### Container won't start:
```bash
# Check logs for errors
docker-compose logs backend

# Try rebuilding without cache
docker-compose build --no-cache backend
docker-compose up -d
```

### "npm install" errors:
The backend Dockerfile should handle npm install automatically. If you see errors, check:
```bash
docker-compose logs backend | grep -i "npm\|error"
```

### Database initialization issues:
```bash
# Check if init.sql ran
docker-compose logs db | grep -i "init"

# Recreate database (WARNING: This deletes all data!)
docker-compose down -v
docker-compose up -d
```

### Users table not found:
If the users table doesn't exist after rebuild, you may need to manually create it:

```bash
docker exec -i familyvine-db-1 psql -U user -d familytree < backend/init.sql
```

## Expected Results

After successful rebuild and testing:

✅ Backend running on http://localhost:5050
✅ No JWT dependency errors in logs
✅ Users table exists in database
✅ Can register new users
✅ Can login and receive JWT token
✅ Token validates successfully
✅ API endpoints accessible (currently without auth enforcement)

## Next Steps

Once authentication is verified working:

1. **Frontend Integration**: Implement login UI and token management
2. **Enable Protection**: Apply `authenticateToken` middleware to routes
3. **Production Security**: Generate secure JWT_SECRET
4. **User Management**: Create admin panel for user CRUD

See `backend/AUTHENTICATION.md` for detailed implementation guide.

## Quick Reference

| Component | Location | Port |
|-----------|----------|------|
| Backend API | http://localhost:5050 | 5050 |
| Frontend | http://localhost:3030 | 3030 |
| Database | localhost | 5432 |
| Auth Endpoints | /api/auth/* | 5050 |

**Test Credentials** (created by test script):
- Username: `admin`
- Password: `changeme123`
- Role: `admin`
