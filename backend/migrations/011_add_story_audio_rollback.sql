-- Rollback Migration 011: Remove audio fields from stories table

DROP INDEX IF EXISTS idx_stories_transcript;

ALTER TABLE stories DROP COLUMN IF EXISTS audio_url;
ALTER TABLE stories DROP COLUMN IF EXISTS audio_duration;
ALTER TABLE stories DROP COLUMN IF EXISTS transcript;
ALTER TABLE stories DROP COLUMN IF EXISTS historical_context;
