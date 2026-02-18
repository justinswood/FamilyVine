const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { validateStory } = require('../middleware/authValidators');
const { requireRole } = require('../middleware/auth');
const { validateId } = require('../middleware/validators');
const { uploadConfigs } = require('../config/multer');
const logger = require('../config/logger');
const fs = require('fs');
const path = require('path');
const { safeUnlink, validateUploadPath } = require('../utils/pathSecurity');

const MAX_AUDIO_PER_STORY = 3;

// Helper: build the full story SELECT query with members, photos, and audio
function storySelectQuery(whereClause = '', orderClause = '') {
  return `
    SELECT
      s.*,
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'id', m.id,
            'first_name', m.first_name,
            'last_name', m.last_name,
            'photo_url', m.photo_url,
            'birth_date', m.birth_date,
            'death_date', m.death_date
          )
        ) FILTER (WHERE m.id IS NOT NULL),
        '[]'
      ) as members,
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'id', p.id,
            'file_path', p.file_path,
            'caption', p.caption
          )
        ) FILTER (WHERE p.id IS NOT NULL),
        '[]'
      ) as photos,
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'id', sa.id,
            'audio_url', sa.audio_url,
            'audio_duration', sa.audio_duration,
            'title', sa.title,
            'sort_order', sa.sort_order
          )
        ) FILTER (WHERE sa.id IS NOT NULL),
        '[]'
      ) as audio_recordings
    FROM stories s
    LEFT JOIN story_members sm ON s.id = sm.story_id
    LEFT JOIN members m ON sm.member_id = m.id
    LEFT JOIN story_photos sp ON s.id = sp.story_id
    LEFT JOIN photos p ON sp.photo_id = p.id
    LEFT JOIN story_audio sa ON s.id = sa.story_id
    ${whereClause}
    GROUP BY s.id
    ${orderClause}
  `;
}

// GET all stories with members, photos, and audio recordings
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      storySelectQuery('', 'ORDER BY s.story_date DESC NULLS LAST, s.created_at DESC')
    );
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching stories:', error);
    res.status(500).json({ error: 'Failed to fetch stories' });
  }
});

// GET single story by ID with members, photos, and audio recordings
router.get('/:id', validateId(), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      storySelectQuery('WHERE s.id = $1'),
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Story not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error fetching story:', error);
    res.status(500).json({ error: 'Failed to fetch story' });
  }
});

// POST - Create new story
router.post('/', requireRole('editor'), validateStory, async (req, res) => {
  const { title, content, author_name, story_date, member_ids = [], photo_ids = [], transcript, historical_context } = req.body;

  // Validation
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Insert story
    const storyResult = await client.query(
      `INSERT INTO stories (title, content, author_name, story_date, transcript, historical_context, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [title, content, author_name, story_date, transcript || null, historical_context || null]
    );

    const storyId = storyResult.rows[0].id;

    // Link members (storyId parameterized to prevent SQL injection)
    if (member_ids && member_ids.length > 0) {
      const memberValues = member_ids.map((_, index) =>
        `($1, $${index + 2}, NOW())`
      ).join(', ');

      await client.query(
        `INSERT INTO story_members (story_id, member_id, created_at)
         VALUES ${memberValues}`,
        [storyId, ...member_ids]
      );
    }

    // Link photos (storyId parameterized to prevent SQL injection)
    if (photo_ids && photo_ids.length > 0) {
      const photoValues = photo_ids.map((_, index) =>
        `($1, $${index + 2}, NOW())`
      ).join(', ');

      await client.query(
        `INSERT INTO story_photos (story_id, photo_id, created_at)
         VALUES ${photoValues}`,
        [storyId, ...photo_ids]
      );
    }

    await client.query('COMMIT');

    // Fetch the complete story
    const completeStory = await pool.query(
      storySelectQuery('WHERE s.id = $1'),
      [storyId]
    );

    res.status(201).json(completeStory.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error creating story:', error);
    res.status(500).json({ error: 'Failed to create story' });
  } finally {
    client.release();
  }
});

// PUT - Update story
router.put('/:id', validateId(), requireRole('editor'), validateStory, async (req, res) => {
  const { id } = req.params;
  const { title, content, author_name, story_date, member_ids = [], photo_ids = [], transcript, historical_context } = req.body;

  // Validation
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Update story
    const storyResult = await client.query(
      `UPDATE stories
       SET title = $1, content = $2, author_name = $3, story_date = $4,
           transcript = $5, historical_context = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [title, content, author_name, story_date, transcript || null, historical_context || null, id]
    );

    if (storyResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Story not found' });
    }

    // Delete existing member links
    await client.query('DELETE FROM story_members WHERE story_id = $1', [id]);

    // Link members
    if (member_ids && member_ids.length > 0) {
      const memberValues = member_ids.map((memberId, index) =>
        `($1, $${index + 2}, NOW())`
      ).join(', ');

      await client.query(
        `INSERT INTO story_members (story_id, member_id, created_at)
         VALUES ${memberValues}`,
        [id, ...member_ids]
      );
    }

    // Delete existing photo links
    await client.query('DELETE FROM story_photos WHERE story_id = $1', [id]);

    // Link photos
    if (photo_ids && photo_ids.length > 0) {
      const photoValues = photo_ids.map((photoId, index) =>
        `($1, $${index + 2}, NOW())`
      ).join(', ');

      await client.query(
        `INSERT INTO story_photos (story_id, photo_id, created_at)
         VALUES ${photoValues}`,
        [id, ...photo_ids]
      );
    }

    await client.query('COMMIT');

    // Fetch the complete updated story
    const completeStory = await pool.query(
      storySelectQuery('WHERE s.id = $1'),
      [id]
    );

    res.json(completeStory.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error updating story:', error);
    res.status(500).json({ error: 'Failed to update story' });
  } finally {
    client.release();
  }
});

// POST - Upload audio for a story (supports up to 3 recordings)
router.post('/:id/audio', validateId(), requireRole('editor'), uploadConfigs.audio.single('audio'), async (req, res) => {
  const { id } = req.params;

  try {
    // Verify story exists
    const storyCheck = await pool.query('SELECT id FROM stories WHERE id = $1', [id]);
    if (storyCheck.rows.length === 0) {
      if (req.file) safeUnlink(req.file.path, logger);
      return res.status(404).json({ error: 'Story not found' });
    }

    // Check current audio count
    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM story_audio WHERE story_id = $1',
      [id]
    );
    const currentCount = parseInt(countResult.rows[0].count, 10);

    if (currentCount >= MAX_AUDIO_PER_STORY) {
      if (req.file) safeUnlink(req.file.path, logger);
      return res.status(400).json({
        error: `Maximum of ${MAX_AUDIO_PER_STORY} audio recordings per story. Delete one before adding another.`
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const audioUrl = `uploads/audio/${req.file.filename}`;
    const audioDuration = req.body.duration ? parseInt(req.body.duration, 10) : null;
    const audioTitle = req.body.title || null;
    const sortOrder = currentCount; // append at end

    const insertResult = await pool.query(
      `INSERT INTO story_audio (story_id, audio_url, audio_duration, title, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, audioUrl, audioDuration, audioTitle, sortOrder]
    );

    // Update story's updated_at
    await pool.query('UPDATE stories SET updated_at = NOW() WHERE id = $1', [id]);

    res.json({
      message: 'Audio uploaded successfully',
      audio: insertResult.rows[0]
    });
  } catch (error) {
    logger.error('Error uploading audio:', error);
    res.status(500).json({ error: 'Failed to upload audio' });
  }
});

// DELETE - Remove a specific audio recording by audio ID
router.delete('/:storyId/audio/:audioId', validateId(['storyId', 'audioId']), requireRole('editor'), async (req, res) => {
  const { storyId, audioId } = req.params;

  try {
    // Get the audio record
    const result = await pool.query(
      'SELECT * FROM story_audio WHERE id = $1 AND story_id = $2',
      [audioId, storyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Audio recording not found' });
    }

    const audioRecord = result.rows[0];

    // Delete the file (with path traversal protection)
    if (audioRecord.audio_url) {
      const filePath = path.join(__dirname, '..', audioRecord.audio_url);
      safeUnlink(filePath, logger);
    }

    // Delete from DB
    await pool.query('DELETE FROM story_audio WHERE id = $1', [audioId]);

    // Re-order remaining audio
    await pool.query(`
      UPDATE story_audio
      SET sort_order = sub.new_order
      FROM (
        SELECT id, ROW_NUMBER() OVER (ORDER BY sort_order) - 1 as new_order
        FROM story_audio
        WHERE story_id = $1
      ) sub
      WHERE story_audio.id = sub.id
    `, [storyId]);

    // Update story's updated_at
    await pool.query('UPDATE stories SET updated_at = NOW() WHERE id = $1', [storyId]);

    res.json({ message: 'Audio recording removed successfully' });
  } catch (error) {
    logger.error('Error removing audio:', error);
    res.status(500).json({ error: 'Failed to remove audio' });
  }
});

// DELETE story
router.delete('/:id', validateId(), requireRole('editor'), async (req, res) => {
  const { id } = req.params;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get audio URLs before deleting (for file cleanup)
    const audioData = await client.query(
      'SELECT audio_url FROM story_audio WHERE story_id = $1',
      [id]
    );

    // Delete member links
    await client.query('DELETE FROM story_members WHERE story_id = $1', [id]);

    // Delete photo links
    await client.query('DELETE FROM story_photos WHERE story_id = $1', [id]);

    // Delete audio records (CASCADE would handle this, but explicit for file cleanup)
    await client.query('DELETE FROM story_audio WHERE story_id = $1', [id]);

    // Delete story
    const result = await client.query('DELETE FROM stories WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Story not found' });
    }

    await client.query('COMMIT');

    // Clean up audio files after successful deletion (with path traversal protection)
    for (const row of audioData.rows) {
      if (row.audio_url) {
        const filePath = path.join(__dirname, '..', row.audio_url);
        safeUnlink(filePath, logger);
      }
    }

    res.json({ message: 'Story deleted successfully', story: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error deleting story:', error);
    res.status(500).json({ error: 'Failed to delete story' });
  } finally {
    client.release();
  }
});

module.exports = router;
