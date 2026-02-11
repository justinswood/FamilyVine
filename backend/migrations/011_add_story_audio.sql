-- Migration 011: Add audio fields to stories table
-- Supports Voice of the Vine audio recording feature

ALTER TABLE stories ADD COLUMN IF NOT EXISTS audio_url VARCHAR(500);
ALTER TABLE stories ADD COLUMN IF NOT EXISTS audio_duration INTEGER;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS transcript TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS historical_context TEXT;

-- Full-text search index on transcript
CREATE INDEX IF NOT EXISTS idx_stories_transcript
  ON stories USING gin(to_tsvector('english', COALESCE(transcript, '')));
