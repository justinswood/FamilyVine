-- ============================================================================
-- GEOCODING CACHE MIGRATION
-- Purpose: Create centralized geocoding cache to improve Map page performance
-- Created: 2025-12-13
-- Estimated Impact: 30x performance improvement (60s → 2s load time)
-- ============================================================================

-- ============================================================================
-- CREATE GEOCODE_CACHE TABLE
-- Purpose: Store geocoded coordinates for location strings
-- Eliminates need for repeated external API calls to Nominatim
-- ============================================================================

CREATE TABLE IF NOT EXISTS geocode_cache (
    id SERIAL PRIMARY KEY,
    location_string VARCHAR(500) NOT NULL UNIQUE,  -- Normalized location (lowercase, trimmed)
    original_location VARCHAR(500) NOT NULL,       -- Original case-preserved string
    latitude DECIMAL(10, 8) NOT NULL,              -- -90 to 90 degrees with 8 decimal precision
    longitude DECIMAL(11, 8) NOT NULL,             -- -180 to 180 degrees with 8 decimal precision
    display_name TEXT,                             -- Full display name from Nominatim
    geocoding_source VARCHAR(50) DEFAULT 'nominatim',
    geocoding_quality VARCHAR(20) DEFAULT 'exact', -- exact, approximate, failed
    member_count INTEGER DEFAULT 1,                -- How many members use this location
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Primary lookup index (most common query)
CREATE INDEX IF NOT EXISTS idx_geocode_location ON geocode_cache(location_string);

-- Spatial queries (lat/lon lookups)
CREATE INDEX IF NOT EXISTS idx_geocode_coords ON geocode_cache(latitude, longitude);

-- Cleanup and maintenance queries
CREATE INDEX IF NOT EXISTS idx_geocode_updated ON geocode_cache(updated_at DESC);

-- Filter by geocoding quality
CREATE INDEX IF NOT EXISTS idx_geocode_quality ON geocode_cache(geocoding_quality);

-- ============================================================================
-- INDEX ON MEMBERS TABLE
-- Purpose: Optimize queries for living members with locations
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_members_living_with_location
    ON members(location)
    WHERE death_date IS NULL
      AND location IS NOT NULL
      AND location != '';

-- ============================================================================
-- TRIGGER FUNCTION: Update updated_at timestamp
-- ============================================================================

-- Check if the function already exists, create only if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc
        WHERE proname = 'update_updated_at_column'
    ) THEN
        CREATE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $trigger$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $trigger$ LANGUAGE plpgsql;
    END IF;
END $$;

-- Apply trigger to geocode_cache table
DROP TRIGGER IF EXISTS update_geocode_cache_updated_at ON geocode_cache;
CREATE TRIGGER update_geocode_cache_updated_at
    BEFORE UPDATE ON geocode_cache
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTION: Update last_used_at when location is accessed
-- ============================================================================

CREATE OR REPLACE FUNCTION update_geocode_last_used()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_used_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_geocode_last_used_trigger ON geocode_cache;
CREATE TRIGGER update_geocode_last_used_trigger
    BEFORE UPDATE ON geocode_cache
    FOR EACH ROW
    WHEN (OLD.last_used_at IS DISTINCT FROM NEW.last_used_at)
    EXECUTE FUNCTION update_geocode_last_used();

-- ============================================================================
-- CLEANUP FUNCTION: Remove unused cache entries (optional maintenance)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_geocode_cache(days_old INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM geocode_cache
    WHERE last_used_at < CURRENT_TIMESTAMP - (days_old || ' days')::INTERVAL
      AND member_count = 0;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ANALYZE TABLES FOR QUERY PLANNER
-- ============================================================================

ANALYZE geocode_cache;
ANALYZE members;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify table creation
DO $$
DECLARE
    cache_exists BOOLEAN;
    index_count INTEGER;
BEGIN
    -- Check if geocode_cache table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'geocode_cache'
    ) INTO cache_exists;

    -- Count indexes
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE tablename = 'geocode_cache';

    -- Output results
    RAISE NOTICE '✓ Migration 004 completed successfully';
    RAISE NOTICE '  - geocode_cache table: %', CASE WHEN cache_exists THEN 'Created' ELSE 'Failed' END;
    RAISE NOTICE '  - Indexes created: %', index_count;
    RAISE NOTICE '  - Ready for geocoding service';
END $$;

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- Performance Expectations:
-- - Initial geocoding of 30 locations: ~30-40 seconds (one-time cost)
-- - Subsequent map loads: <2 seconds (database lookup only)
-- - Cache hit rate: Expected >95% after initial population
--
-- Maintenance:
-- - Run cleanup_old_geocode_cache() periodically to remove stale entries
-- - Example: SELECT cleanup_old_geocode_cache(180); -- Clean 6 month old entries
--
-- Monitor cache effectiveness:
-- - SELECT COUNT(*), AVG(member_count) FROM geocode_cache;
-- - SELECT location_string, member_count FROM geocode_cache ORDER BY member_count DESC LIMIT 10;
--
-- ============================================================================
