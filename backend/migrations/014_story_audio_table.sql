-- Migration 014: Create story_audio table for multiple audio recordings per story (max 3)
-- Moves from single audio_url/audio_duration columns on stories to a separate table

CREATE TABLE IF NOT EXISTS story_audio (
    id SERIAL PRIMARY KEY,
    story_id INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    audio_url VARCHAR(500) NOT NULL,
    audio_duration INTEGER,
    title VARCHAR(255),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_story_audio_story_id ON story_audio(story_id);

-- Migrate existing audio data from stories table into story_audio
INSERT INTO story_audio (story_id, audio_url, audio_duration, sort_order, created_at)
SELECT id, audio_url, audio_duration, 0, COALESCE(updated_at, created_at, NOW())
FROM stories
WHERE audio_url IS NOT NULL AND audio_url != '';

-- Drop old columns from stories table
ALTER TABLE stories DROP COLUMN IF EXISTS audio_url;
ALTER TABLE stories DROP COLUMN IF EXISTS audio_duration;
