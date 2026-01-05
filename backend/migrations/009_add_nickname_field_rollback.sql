-- ============================================================================
-- ROLLBACK: Remove nickname field from members table
-- ============================================================================

-- Drop index
DROP INDEX IF EXISTS idx_members_nickname;

-- Remove column
ALTER TABLE members DROP COLUMN IF EXISTS nickname;

-- Verify rollback
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'members'
        AND column_name = 'nickname'
    ) INTO column_exists;

    RAISE NOTICE '✓ Rollback 009 completed';
    RAISE NOTICE '  - nickname column removed: %', CASE WHEN NOT column_exists THEN 'Yes' ELSE 'Failed' END;
END $$;
