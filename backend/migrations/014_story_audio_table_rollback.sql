-- Rollback Migration 014: Revert to single audio columns on stories table

-- Re-add columns to stories
ALTER TABLE stories ADD COLUMN IF NOT EXISTS audio_url VARCHAR(500);
ALTER TABLE stories ADD COLUMN IF NOT EXISTS audio_duration INTEGER;

-- Migrate data back (take the first audio per story)
UPDATE stories s
SET audio_url = sa.audio_url,
    audio_duration = sa.audio_duration
FROM (
    SELECT DISTINCT ON (story_id) story_id, audio_url, audio_duration
    FROM story_audio
    ORDER BY story_id, sort_order ASC
) sa
WHERE s.id = sa.story_id;

-- Drop the story_audio table
DROP TABLE IF EXISTS story_audio;
