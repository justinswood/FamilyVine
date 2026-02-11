-- ============================================================================
-- ROLLBACK MIGRATION 004
-- Purpose: Remove geocoding cache table and related objects
-- ============================================================================

-- Drop triggers
DROP TRIGGER IF EXISTS update_geocode_last_used_trigger ON geocode_cache;
DROP TRIGGER IF EXISTS update_geocode_cache_updated_at ON geocode_cache;

-- Drop functions
DROP FUNCTION IF EXISTS cleanup_old_geocode_cache(INTEGER);
DROP FUNCTION IF EXISTS update_geocode_last_used();

-- Note: We don't drop update_updated_at_column() as it may be used by other tables

-- Drop table (indexes will be dropped automatically)
DROP TABLE IF EXISTS geocode_cache;

-- Drop members index
DROP INDEX IF EXISTS idx_members_living_with_location;

-- Verify rollback
DO $$
DECLARE
    cache_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'geocode_cache'
    ) INTO cache_exists;

    RAISE NOTICE '✓ Rollback 004 completed';
    RAISE NOTICE '  - geocode_cache table: %', CASE WHEN NOT cache_exists THEN 'Removed' ELSE 'Still exists (check dependencies)' END;
END $$;
