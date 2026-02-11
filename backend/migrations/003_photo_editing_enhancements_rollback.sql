-- Rollback: 003_photo_editing_enhancements.sql
-- Description: Revert photo editing enhancements migration
-- Date: 2025-12-11

-- ============================================================================
-- REMOVE PHOTO_TAGS ENHANCEMENTS
-- ============================================================================

-- Drop foreign key constraint
ALTER TABLE photo_tags
  DROP CONSTRAINT IF EXISTS fk_tagged_by_user;

-- Drop index
DROP INDEX IF EXISTS idx_photo_tags_tagged_by;

-- ============================================================================
-- REMOVE PHOTOS TABLE ENHANCEMENTS
-- ============================================================================

-- Drop indexes
DROP INDEX IF EXISTS idx_photos_rotation;
DROP INDEX IF EXISTS idx_photos_edited;

-- Drop columns (use CASCADE to handle dependencies)
ALTER TABLE photos
  DROP COLUMN IF EXISTS rotation_degrees CASCADE;

ALTER TABLE photos
  DROP COLUMN IF EXISTS original_file_path CASCADE;

ALTER TABLE photos
  DROP COLUMN IF EXISTS is_edited CASCADE;

ALTER TABLE photos
  DROP COLUMN IF EXISTS edited_at CASCADE;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Rollback complete: Photo editing enhancements removed';
END$$;
