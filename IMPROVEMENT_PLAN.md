# FamilyVine Improvement Plan

Generated: 2026-01-27

This document outlines identified improvements and upgrades for the FamilyVine application, organized by priority and category.

---

## Summary

| Priority | Count | Categories |
|----------|-------|------------|
| Critical | 1 | Security |
| High | 9 | Security, Performance, Testing, Infrastructure |
| Medium | 34 | Code Quality, Architecture, DevOps |
| Low | 2 | Architecture, Validation |

---

## Phase 1: Critical & Security (Immediate)

### 1.1 Remove Hardcoded Credentials [CRITICAL]

**Location:** `backend/config/database.js:7-10`

**Issue:** Database connection falls back to default credentials when environment variables missing.

```javascript
// Current (dangerous)
password: process.env.DB_PASSWORD || 'pass',

// Fixed
password: process.env.DB_PASSWORD,  // Will fail if not set
```

**Action Items:**
- [ ] Remove all fallback values for sensitive credentials
- [ ] Add startup validation that fails if credentials missing
- [ ] Update `.env.example` with clear instructions
- [ ] Rotate database password after fix

---

### 1.2 Add Role-Based Authorization [HIGH]

**Location:** `backend/routes/members.js`, `backend/routes/albums.js`, all protected routes

**Issue:** Routes use `authenticateToken` but have NO role-based checks. Any authenticated user can modify/delete any data.

**Action Items:**
- [ ] Create `requireRole(role)` middleware
- [ ] Add to destructive operations (POST, PUT, DELETE)
- [ ] Implement owner verification for albums/stories
- [ ] Define role hierarchy: viewer < editor < admin

```javascript
// Example implementation
const requireRole = (minRole) => (req, res, next) => {
  const roles = { viewer: 1, editor: 2, admin: 3 };
  if (roles[req.user.role] < roles[minRole]) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

// Usage
router.delete('/members/:id', authenticateToken, requireRole('admin'), deleteMember);
```

---

### 1.3 Enforce HTTPS in Production [HIGH]

**Location:** `backend/app.js`

**Issue:** No HTTP to HTTPS redirect in production environment.

**Action Items:**
- [ ] Add HTTPS redirect middleware for production
- [ ] Configure HSTS header with preload
- [ ] Update CSP to use https:// URLs
- [ ] Test SSL certificate validity

```javascript
// Add to app.js
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      return res.redirect(`https://${req.header('host')}${req.url}`);
    }
    next();
  });
}
```

---

### 1.4 Fix CORS Configuration [HIGH]

**Location:** `backend/app.js:41-57`

**Issue:** Allows requests with no origin (CSRF vulnerability).

**Action Items:**
- [ ] Remove `if (!origin) return callback(null, true);`
- [ ] Whitelist only specific production domains
- [ ] Move hardcoded IPs to environment variables
- [ ] Add CORS preflight caching

---

### 1.5 Implement Secrets Management [HIGH]

**Location:** Project-wide

**Issue:** Sensitive data stored in environment files, no vault integration.

**Action Items:**
- [ ] Ensure `.env` is in `.gitignore`
- [ ] Check git history for exposed secrets
- [ ] Rotate JWT_SECRET immediately
- [ ] Consider Docker Secrets or HashiCorp Vault
- [ ] Document secrets rotation procedure

---

### 1.6 Remove Console Logging [HIGH]

**Location:** `backend/routes/members.js` (20+ occurrences), other route files

**Issue:** Extensive `console.log()` statements expose sensitive data in logs.

**Action Items:**
- [ ] Replace all `console.log` with `logger.debug()`
- [ ] Replace all `console.error` with `logger.error()`
- [ ] Ensure debug level disabled in production
- [ ] Remove sensitive data from log messages

```bash
# Find all console statements
grep -rn "console\." backend/routes/
```

---

### 1.7 Strengthen Rate Limiting [HIGH]

**Location:** `backend/app.js:103-109, 142-150`

**Issue:** 1000 requests/15min is too permissive; no per-user limiting.

**Action Items:**
- [ ] Reduce general API limit to 100/15min
- [ ] Add stricter limits for write operations (20/15min)
- [ ] Implement per-user rate limiting using JWT user ID
- [ ] Add separate limits for file uploads

```javascript
const writeRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { error: 'Too many modifications, try again later' }
});
```

---

### 1.8 Add Input Validation [HIGH]

**Location:** `backend/routes/members.js`, all routes

**Issue:** Missing validation on route parameters, query strings, and request bodies.

**Action Items:**
- [ ] Validate all `:id` parameters are integers
- [ ] Validate search queries (length, characters)
- [ ] Validate request body fields (types, lengths)
- [ ] Add express-validator to all routes

```javascript
const { param, query, body, validationResult } = require('express-validator');

router.get('/members/:id',
  param('id').isInt({ min: 1 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  getMember
);
```

---

## Phase 2: Performance & Testing

### 2.1 Fix N+1 Query in Tree Traversal [HIGH]

**Location:** `backend/routes/tree.js`

**Issue:** Recursive tree fetching performs individual queries per node.

**Action Items:**
- [ ] Rewrite tree query using PostgreSQL CTE (Common Table Expression)
- [ ] Fetch entire tree in single query
- [ ] Add caching for tree structure (5-minute TTL)

```sql
-- Example CTE query
WITH RECURSIVE family_tree AS (
  SELECT u.*, 0 as depth
  FROM unions u WHERE id = $1
  UNION ALL
  SELECT u.*, ft.depth + 1
  FROM unions u
  JOIN union_children uc ON uc.child_id = u.partner1_id OR uc.child_id = u.partner2_id
  JOIN family_tree ft ON uc.union_id = ft.id
  WHERE ft.depth < 10
)
SELECT * FROM family_tree;
```

---

### 2.2 Add API Pagination [MEDIUM]

**Location:** All list endpoints

**Issue:** `/api/members`, `/api/relationships` return ALL records without limits.

**Action Items:**
- [ ] Add pagination parameters: `?page=1&limit=50`
- [ ] Default limit: 50, max limit: 500
- [ ] Return total count and pagination metadata
- [ ] Update frontend to handle pagination

```javascript
// Response format
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1234,
    "pages": 25
  }
}
```

---

### 2.3 Add Database Indexes [MEDIUM]

**Location:** `backend/init.sql`

**Issue:** Missing indexes on frequently queried columns.

**Action Items:**
- [ ] Add index on `members.email`
- [ ] Add index on `members.location`
- [ ] Add index on `relationships.relationship_type`
- [ ] Add index on `union_children.child_id`
- [ ] Create migration file for existing databases

```sql
-- Migration: 009_add_performance_indexes.sql
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_members_location ON members(location);
CREATE INDEX IF NOT EXISTS idx_relationships_type ON relationships(relationship_type);
CREATE INDEX IF NOT EXISTS idx_union_children_child ON union_children(child_id);
```

---

### 2.4 Add Backend Test Coverage [HIGH]

**Location:** `backend/__tests__/`

**Issue:** Jest configured but no actual tests exist.

**Action Items:**
- [ ] Add auth middleware tests
- [ ] Add member CRUD route tests
- [ ] Add relationship logic tests
- [ ] Add CSV import validation tests
- [ ] Target 70% coverage minimum

```
backend/__tests__/
├── routes/
│   ├── members.test.js
│   ├── relationships.test.js
│   ├── auth.test.js
│   └── tree.test.js
├── middleware/
│   └── auth.test.js
└── services/
    └── memberService.test.js
```

---

### 2.5 Add E2E Tests [MEDIUM]

**Location:** New `e2e/` directory

**Issue:** No end-to-end tests for critical user flows.

**Action Items:**
- [ ] Set up Playwright or Cypress
- [ ] Test login/logout flow
- [ ] Test member creation
- [ ] Test family tree navigation
- [ ] Test photo upload and tagging

---

## Phase 3: Code Quality & Architecture

### 3.1 Create Service Layer [MEDIUM]

**Location:** `backend/services/`

**Issue:** Business logic mixed with route handlers, hard to test.

**Action Items:**
- [ ] Create `memberService.js` with CRUD operations
- [ ] Create `relationshipService.js` with bidirectional logic
- [ ] Create `treeService.js` with traversal logic
- [ ] Move all SQL queries to services
- [ ] Routes become thin wrappers

```
backend/services/
├── memberService.js      # Member CRUD, search, photo handling
├── relationshipService.js # Bidirectional linking, validation
├── treeService.js        # Tree building, traversal
├── albumService.js       # Album/photo operations
└── authService.js        # Token generation, validation
```

---

### 3.2 Centralize Database Pool [MEDIUM]

**Location:** `backend/config/database.js`

**Issue:** Multiple pool instances possible if not careful.

**Action Items:**
- [ ] Ensure single pool instance exported
- [ ] Add pool health monitoring
- [ ] Implement connection timeout handling
- [ ] Add statement_timeout for long queries

```javascript
// database.js
const pool = new Pool({
  ...config,
  statement_timeout: 30000,  // 30 second query timeout
});

pool.on('error', (err) => {
  logger.error('Unexpected database error', err);
});

module.exports = pool;
```

---

### 3.3 Add Request Body Size Limits [MEDIUM]

**Location:** `backend/app.js:112`

**Issue:** `express.json()` has no size limit, vulnerable to large payload DoS.

**Action Items:**
- [ ] Add `limit: '10mb'` to JSON parser
- [ ] Add limits to URL-encoded parser
- [ ] Document limits for API consumers

```javascript
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
```

---

### 3.4 Fix CSV Import Security [MEDIUM]

**Location:** `backend/routes/members.js:462-530`

**Issue:** No file size limit, no row limit, no type validation.

**Action Items:**
- [ ] Add 10MB file size limit
- [ ] Add 10,000 row processing limit
- [ ] Validate CSV structure before processing
- [ ] Add progress reporting for large imports

---

### 3.5 Remove Unsafe Inline Styles in CSP [MEDIUM]

**Location:** `backend/app.js:76`

**Issue:** `'unsafe-inline'` in styleSrc defeats XSS protection.

**Action Items:**
- [ ] Audit inline styles in frontend
- [ ] Move inline styles to CSS files
- [ ] Implement nonces for necessary inline styles
- [ ] Update CSP to remove unsafe-inline

---

### 3.6 Add API Versioning [LOW]

**Location:** `backend/app.js` route registration

**Issue:** No version prefix, breaking changes affect all clients.

**Action Items:**
- [ ] Add `/api/v1/` prefix to all routes
- [ ] Keep `/api/` as alias for v1
- [ ] Document deprecation policy
- [ ] Plan for future v2

---

## Phase 4: Infrastructure & DevOps

### 4.1 Add Monitoring & Alerting [HIGH]

**Location:** `docker-compose.yml`

**Issue:** No Prometheus, Grafana, Sentry, or log aggregation.

**Action Items:**
- [ ] Add Prometheus metrics endpoint
- [ ] Set up Grafana dashboards
- [ ] Integrate Sentry for error tracking
- [ ] Add centralized logging (Loki or ELK)

```yaml
# docker-compose additions
prometheus:
  image: prom/prometheus
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml

grafana:
  image: grafana/grafana
  depends_on:
    - prometheus
```

---

### 4.2 Enhance Health Check [MEDIUM]

**Location:** `backend/app.js:129-135`

**Issue:** Health endpoint doesn't check database connectivity.

**Action Items:**
- [ ] Add database connectivity check
- [ ] Add disk space check
- [ ] Add memory usage check
- [ ] Create `/health/detailed` endpoint

```javascript
app.get('/health/detailed', async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    disk: await checkDiskSpace(),
    memory: process.memoryUsage(),
    uptime: process.uptime()
  };
  const healthy = checks.database && checks.disk;
  res.status(healthy ? 200 : 503).json(checks);
});
```

---

### 4.3 Add Docker Resource Limits [MEDIUM]

**Location:** `docker-compose.yml`

**Issue:** No memory/CPU limits, vulnerable to resource exhaustion.

**Action Items:**
- [ ] Add memory limits (backend: 512MB, frontend: 256MB)
- [ ] Add CPU limits
- [ ] Configure restart policies with max retries
- [ ] Add log rotation

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
```

---

### 4.4 Implement Automated Backups [MEDIUM]

**Location:** New backup configuration

**Issue:** Only manual backup files exist, no automation.

**Action Items:**
- [ ] Create backup script with pg_dump
- [ ] Schedule daily backups via cron
- [ ] Store backups off-server (S3, etc.)
- [ ] Implement backup verification
- [ ] Document restoration procedure

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
docker exec familyvine-db-1 pg_dump -U user familytree > /backups/familyvine_${DATE}.sql
# Upload to S3/remote storage
```

---

### 4.5 Add CI/CD Pipeline [MEDIUM]

**Location:** `.github/workflows/` (new)

**Issue:** No automated testing, security scanning, or deployment.

**Action Items:**
- [ ] Add GitHub Actions workflow
- [ ] Run tests on PR
- [ ] Run `npm audit` for security
- [ ] Add ESLint security plugin
- [ ] Automate deployment on merge to main

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cd backend && npm ci && npm test
      - run: cd frontend && npm ci && npm test
      - run: npm audit --audit-level=high
```

---

## Phase 5: Frontend Improvements

### 5.1 Optimize Bundle Size [MEDIUM]

**Location:** `frontend/package.json`

**Issue:** Multiple animation libraries, duplicate tree implementations.

**Action Items:**
- [ ] Run bundle analyzer
- [ ] Remove @balkangraph (using custom lib)
- [ ] Evaluate need for both framer-motion AND gsap
- [ ] Implement code splitting with React.lazy
- [ ] Remove unused D3 components

```bash
# Analyze bundle
npm install -g webpack-bundle-analyzer
npm run build
npx webpack-bundle-analyzer build/static/js/*.js
```

---

### 5.2 Add React Performance Optimizations [MEDIUM]

**Location:** `frontend/src/pages/`, `frontend/src/components/`

**Issue:** Large components likely re-render unnecessarily.

**Action Items:**
- [ ] Profile with React DevTools
- [ ] Add React.memo to list item components
- [ ] Use useCallback for event handlers in lists
- [ ] Implement virtualization for large lists
- [ ] Add React.lazy for page components

---

### 5.3 Improve Accessibility [MEDIUM]

**Location:** Frontend components

**Issue:** No accessibility audit performed.

**Action Items:**
- [ ] Run axe-core accessibility audit
- [ ] Add ARIA labels to interactive elements
- [ ] Ensure keyboard navigation works
- [ ] Add skip links for screen readers
- [ ] Test with screen reader

---

### 5.4 Fix Token Invalidation on Logout [MEDIUM]

**Location:** `frontend/src/contexts/AuthContext.js`

**Issue:** Frontend clears localStorage but doesn't invalidate JWT on server.

**Action Items:**
- [ ] Implement token blacklist on backend
- [ ] Call logout endpoint to invalidate token
- [ ] Consider refresh token pattern
- [ ] Add token rotation on activity

---

## Implementation Timeline

### Week 1-2: Critical Security
- 1.1 Remove hardcoded credentials
- 1.4 Fix CORS configuration
- 1.5 Secrets management
- 1.6 Remove console logging
- 1.7 Strengthen rate limiting

### Week 3-4: High Priority Security & Performance
- 1.2 Role-based authorization
- 1.3 HTTPS enforcement
- 1.8 Input validation
- 2.1 Fix N+1 tree query
- 2.4 Backend test coverage

### Week 5-6: Code Quality
- 2.2 API pagination
- 2.3 Database indexes
- 3.1 Service layer
- 3.2 Database pool
- 3.3 Request size limits

### Week 7-8: Infrastructure
- 4.1 Monitoring & alerting
- 4.2 Health checks
- 4.3 Docker limits
- 4.4 Automated backups
- 4.5 CI/CD pipeline

### Ongoing: Frontend & Polish
- 5.1 Bundle optimization
- 5.2 Performance tuning
- 5.3 Accessibility
- 5.4 Token management

---

## Quick Wins (Can Do Immediately)

1. **Add `.env` to `.gitignore`** if not already
2. **Remove console.log statements** - search and replace
3. **Add request body size limit** - one line change
4. **Add health check database ping** - quick addition
5. **Run `npm audit fix`** - automated security patches

---

## Files to Create

| File | Purpose |
|------|---------|
| `backend/middleware/requireRole.js` | Role-based authorization |
| `backend/services/memberService.js` | Member business logic |
| `backend/services/treeService.js` | Tree traversal logic |
| `backend/migrations/009_add_indexes.sql` | Performance indexes |
| `.github/workflows/ci.yml` | CI/CD pipeline |
| `scripts/backup.sh` | Automated backup script |
| `e2e/auth.spec.ts` | E2E auth tests |

---

## Metrics to Track

After implementing improvements:

- [ ] API response time < 200ms (p95)
- [ ] Test coverage > 70%
- [ ] Zero critical/high security findings
- [ ] Lighthouse accessibility score > 90
- [ ] Bundle size < 500KB (gzipped)
- [ ] Database query time < 100ms (p95)
