# Database Migrations

This directory contains SQL migration scripts for database schema updates.

## How to Apply Migrations

### Method 1: Using psql (Recommended)

```bash
# From the backend directory
psql -U familyvine_user -d familyvine -f migrations/001_add_performance_indexes.sql
```

### Method 2: Using Docker

```bash
# If database is running in Docker
docker exec -i familyvine-db-1 psql -U familyvine_user -d familyvine < migrations/001_add_performance_indexes.sql
```

### Method 3: Using pgAdmin or Database GUI

1. Open your database tool
2. Connect to the familyvine database
3. Execute the SQL file

## Migration List

| File | Description | Date | Status |
|------|-------------|------|--------|
| `001_add_performance_indexes.sql` | Adds performance indexes for all tables | 2024-12-09 | ✅ Applied |
| `002_add_password_reset.sql` | Password reset token management & email verification | 2024-12-09 | ✅ Applied |

## Verifying Index Creation

After applying migrations, verify indexes were created:

```sql
-- Check all indexes
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check index usage statistics
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan AS scans,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

## Performance Testing

Before and after migration, compare query performance:

```sql
-- Example: Test member search performance
EXPLAIN ANALYZE
SELECT * FROM members
WHERE first_name LIKE 'John%'
ORDER BY last_name;

-- Example: Test relationship lookup performance
EXPLAIN ANALYZE
SELECT * FROM relationships
WHERE member1_id = 123 AND relationship_type = 'father';
```

## Rollback

If you need to remove indexes:

```sql
-- Drop all indexes created by migration 001
DROP INDEX IF EXISTS idx_members_first_name CASCADE;
DROP INDEX IF EXISTS idx_members_last_name CASCADE;
-- ... (continue for all indexes)
```

Or use the rollback script if provided:

```bash
psql -U familyvine_user -d familyvine -f migrations/001_add_performance_indexes_rollback.sql
```
