-- Migration: 003_photo_editing_enhancements.sql
-- Description: Add non-destructive rotation, original file backup, and enhanced tagging
-- Date: 2025-12-11

-- ============================================================================
-- PHOTOS TABLE ENHANCEMENTS
-- ============================================================================

-- Add non-destructive rotation support
ALTER TABLE photos
  ADD COLUMN IF NOT EXISTS rotation_degrees INTEGER DEFAULT 0
    CHECK (rotation_degrees IN (0, 90, 180, 270));

-- Add original file path for backup (before any edits)
ALTER TABLE photos
  ADD COLUMN IF NOT EXISTS original_file_path VARCHAR(500);

-- Add edit tracking
ALTER TABLE photos
  ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false;

ALTER TABLE photos
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_photos_rotation
  ON photos(rotation_degrees)
  WHERE rotation_degrees != 0;

CREATE INDEX IF NOT EXISTS idx_photos_edited
  ON photos(is_edited)
  WHERE is_edited = true;

-- ============================================================================
-- PHOTO_TAGS TABLE ENHANCEMENTS
-- ============================================================================

-- Add foreign key constraint for tagged_by (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_tagged_by_user'
    ) THEN
        ALTER TABLE photo_tags
        ADD CONSTRAINT fk_tagged_by_user
        FOREIGN KEY (tagged_by) REFERENCES users(id)
        ON DELETE SET NULL;
    END IF;
END$$;

-- Add index for tagged_by lookups
CREATE INDEX IF NOT EXISTS idx_photo_tags_tagged_by
  ON photo_tags(tagged_by);

-- ============================================================================
-- DATA MIGRATION
-- ============================================================================

-- Populate original_file_path for existing photos
-- This creates a backup reference before any future edits
UPDATE photos
SET original_file_path = file_path
WHERE original_file_path IS NULL;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify all existing photos have original_file_path
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM photos
  WHERE original_file_path IS NULL;

  IF missing_count > 0 THEN
    RAISE WARNING 'Found % photos without original_file_path', missing_count;
  ELSE
    RAISE NOTICE 'Migration successful: All photos have original_file_path';
  END IF;
END$$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN photos.rotation_degrees IS
  'Non-destructive rotation: 0, 90, 180, or 270 degrees. Applied via CSS transform on frontend.';

COMMENT ON COLUMN photos.original_file_path IS
  'Backup of original file path before any edits (crop, destructive rotation). Allows reverting edits.';

COMMENT ON COLUMN photos.is_edited IS
  'Flag indicating if photo has been edited (cropped, rotated destructively, etc.)';

COMMENT ON COLUMN photos.edited_at IS
  'Timestamp of last edit operation';

COMMENT ON CONSTRAINT fk_tagged_by_user ON photo_tags IS
  'Links photo tag to user who created the tag for audit trail';
