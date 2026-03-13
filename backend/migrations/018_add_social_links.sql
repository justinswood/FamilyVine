-- Migration 018: Add social media link columns to members table
-- Date: 2026-03-12
-- Description: Adds facebook_url, instagram_url, linkedin_url columns

ALTER TABLE members ADD COLUMN IF NOT EXISTS facebook_url VARCHAR(500);
ALTER TABLE members ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(500);
ALTER TABLE members ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(500);

-- Verify columns were added
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'members' AND column_name = 'facebook_url'
  ) THEN
    RAISE NOTICE 'Migration 018 applied successfully: social link columns added';
  ELSE
    RAISE EXCEPTION 'Migration 018 failed: columns not created';
  END IF;
END $$;
