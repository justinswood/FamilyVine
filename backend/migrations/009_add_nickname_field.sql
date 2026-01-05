-- ============================================================================
-- ADD NICKNAME FIELD TO MEMBERS TABLE
-- Purpose: Add optional nickname field to member profiles
-- Created: 2026-01-02
-- Display Format: FirstName "Nickname" MiddleName LastName
-- ============================================================================

-- Add nickname column to members table
ALTER TABLE members
ADD COLUMN IF NOT EXISTS nickname VARCHAR(100);

-- Add comment for documentation
COMMENT ON COLUMN members.nickname IS 'Optional nickname displayed in quotes within full name';

-- Create partial index for nickname searches (only where nickname exists)
CREATE INDEX IF NOT EXISTS idx_members_nickname
ON members(nickname)
WHERE nickname IS NOT NULL;

-- ============================================================================
-- MIGRATION VERIFICATION
-- ============================================================================

DO $$
DECLARE
    column_exists BOOLEAN;
    index_count INTEGER;
BEGIN
    -- Check if nickname column exists
    SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'members'
        AND column_name = 'nickname'
    ) INTO column_exists;

    -- Count indexes
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE tablename = 'members'
    AND indexname = 'idx_members_nickname';

    -- Output results
    RAISE NOTICE '✓ Migration 009 completed successfully';
    RAISE NOTICE '  - nickname column: %', CASE WHEN column_exists THEN 'Added' ELSE 'Failed' END;
    RAISE NOTICE '  - nickname index: %', CASE WHEN index_count > 0 THEN 'Created' ELSE 'Skipped' END;
END $$;

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- Column Details:
-- - Type: VARCHAR(100) - sufficient for most nicknames
-- - Nullable: YES - nicknames are optional
-- - Default: NULL
--
-- Display Format Example:
-- - With nickname: Percy "Big Daddy" Manning Sr.
-- - Without nickname: Percy Manning Sr.
--
-- Index Strategy:
-- - Partial index (WHERE nickname IS NOT NULL)
-- - Optimizes searches without indexing NULL values
-- - Minimal storage overhead
--
-- ============================================================================
