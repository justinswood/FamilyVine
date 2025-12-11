const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { validateStory } = require('../middleware/authValidators');
const logger = require('../config/logger');

// GET all stories with members and photos
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        s.*,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', m.id,
              'first_name', m.first_name,
              'last_name', m.last_name
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
        ) as photos
      FROM stories s
      LEFT JOIN story_members sm ON s.id = sm.story_id
      LEFT JOIN members m ON sm.member_id = m.id
      LEFT JOIN story_photos sp ON s.id = sp.story_id
      LEFT JOIN photos p ON sp.photo_id = p.id
      GROUP BY s.id
      ORDER BY s.story_date DESC NULLS LAST, s.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching stories:', error);
    res.status(500).json({ error: 'Failed to fetch stories' });
  }
});

// GET single story by ID with members and photos
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`
      SELECT
        s.*,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', m.id,
              'first_name', m.first_name,
              'last_name', m.last_name,
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
        ) as photos
      FROM stories s
      LEFT JOIN story_members sm ON s.id = sm.story_id
      LEFT JOIN members m ON sm.member_id = m.id
      LEFT JOIN story_photos sp ON s.id = sp.story_id
      LEFT JOIN photos p ON sp.photo_id = p.id
      WHERE s.id = $1
      GROUP BY s.id
    `, [id]);

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
router.post('/', validateStory, async (req, res) => {
  const { title, content, author_name, story_date, member_ids = [], photo_ids = [] } = req.body;

  // Validation
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Insert story
    const storyResult = await client.query(
      `INSERT INTO stories (title, content, author_name, story_date, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [title, content, author_name, story_date]
    );

    const storyId = storyResult.rows[0].id;

    // Link members
    if (member_ids && member_ids.length > 0) {
      const memberValues = member_ids.map((memberId, index) =>
        `(${storyId}, $${index + 1}, NOW())`
      ).join(', ');

      await client.query(
        `INSERT INTO story_members (story_id, member_id, created_at)
         VALUES ${memberValues}`,
        member_ids
      );
    }

    // Link photos
    if (photo_ids && photo_ids.length > 0) {
      const photoValues = photo_ids.map((photoId, index) =>
        `(${storyId}, $${index + 1}, NOW())`
      ).join(', ');

      await client.query(
        `INSERT INTO story_photos (story_id, photo_id, created_at)
         VALUES ${photoValues}`,
        photo_ids
      );
    }

    await client.query('COMMIT');

    // Fetch the complete story with members and photos
    const completeStory = await pool.query(`
      SELECT
        s.*,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', m.id,
              'first_name', m.first_name,
              'last_name', m.last_name
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
        ) as photos
      FROM stories s
      LEFT JOIN story_members sm ON s.id = sm.story_id
      LEFT JOIN members m ON sm.member_id = m.id
      LEFT JOIN story_photos sp ON s.id = sp.story_id
      LEFT JOIN photos p ON sp.photo_id = p.id
      WHERE s.id = $1
      GROUP BY s.id
    `, [storyId]);

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
router.put('/:id', validateStory, async (req, res) => {
  const { id } = req.params;
  const { title, content, author_name, story_date, member_ids = [], photo_ids = [] } = req.body;

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
       SET title = $1, content = $2, author_name = $3, story_date = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [title, content, author_name, story_date, id]
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
    const completeStory = await pool.query(`
      SELECT
        s.*,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', m.id,
              'first_name', m.first_name,
              'last_name', m.last_name
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
        ) as photos
      FROM stories s
      LEFT JOIN story_members sm ON s.id = sm.story_id
      LEFT JOIN members m ON sm.member_id = m.id
      LEFT JOIN story_photos sp ON s.id = sp.story_id
      LEFT JOIN photos p ON sp.photo_id = p.id
      WHERE s.id = $1
      GROUP BY s.id
    `, [id]);

    res.json(completeStory.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error updating story:', error);
    res.status(500).json({ error: 'Failed to update story' });
  } finally {
    client.release();
  }
});

// DELETE story
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Delete member links
    await client.query('DELETE FROM story_members WHERE story_id = $1', [id]);

    // Delete photo links
    await client.query('DELETE FROM story_photos WHERE story_id = $1', [id]);

    // Delete story
    const result = await client.query('DELETE FROM stories WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Story not found' });
    }

    await client.query('COMMIT');

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
