-- Rollback Migration 018: Remove social media link columns
-- Date: 2026-03-12

ALTER TABLE members DROP COLUMN IF EXISTS facebook_url;
ALTER TABLE members DROP COLUMN IF EXISTS instagram_url;
ALTER TABLE members DROP COLUMN IF EXISTS linkedin_url;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'members' AND column_name = 'facebook_url'
  ) THEN
    RAISE NOTICE 'Rollback 018 applied successfully: social link columns removed';
  ELSE
    RAISE EXCEPTION 'Rollback 018 failed: columns still exist';
  END IF;
END $$;
