const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const logger = require('../config/logger');

/**
 * GET /api/preferences
 * Get current user's preferences (auto-creates defaults if none exist)
 */
router.get('/', async (req, res) => {
  try {
    let result = await pool.query(
      'SELECT * FROM user_preferences WHERE user_id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      result = await pool.query(
        'INSERT INTO user_preferences (user_id) VALUES ($1) RETURNING *',
        [req.user.id]
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error fetching preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

/**
 * PUT /api/preferences
 * Update current user's preferences (partial update)
 */
router.put('/', async (req, res) => {
  try {
    const allowedFields = {
      family_name: 'string',
      default_privacy: 'enum:public,family,private',
      date_format: 'string',
      show_private_info: 'boolean',
      require_login_for_viewing: 'boolean',
      allow_guest_access: 'boolean',
      email_notifications: 'boolean',
      member_updates: 'boolean',
      relationship_changes: 'boolean',
      photo_uploads: 'boolean',
      default_root_member_id: 'integer_nullable',
      preferred_generation_depth: 'integer',
      show_unknown_parents: 'boolean',
    };

    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, type] of Object.entries(allowedFields)) {
      if (req.body[key] === undefined) continue;

      const val = req.body[key];

      // Validate enums
      if (type.startsWith('enum:')) {
        const allowed = type.split(':')[1].split(',');
        if (!allowed.includes(val)) {
          return res.status(400).json({ error: `Invalid value for ${key}` });
        }
      }

      // Validate integer range
      if (key === 'preferred_generation_depth') {
        const num = parseInt(val);
        if (isNaN(num) || num < 1 || num > 10) {
          return res.status(400).json({ error: 'Generation depth must be between 1 and 10' });
        }
      }

      fields.push(`${key} = $${paramCount++}`);
      values.push(val === '' ? null : val);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No valid preferences provided' });
    }

    values.push(req.user.id);

    const result = await pool.query(
      `INSERT INTO user_preferences (user_id)
       VALUES ($${paramCount})
       ON CONFLICT (user_id)
       DO UPDATE SET ${fields.join(', ')}
       RETURNING *`,
      values
    );

    logger.info('User updated preferences', {
      userId: req.user.id,
      updatedFields: Object.keys(req.body).filter(k => k in allowedFields),
    });

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

module.exports = router;
