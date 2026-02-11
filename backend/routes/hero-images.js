const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const pool = require('../config/database');
const { validateImageMagicNumber } = require('../utils/imageProcessor');
const { uploadConfigs } = require('../config/multer');
const logger = require('../config/logger');

// Use centralized multer config for hero image uploads
const upload = uploadConfigs.hero;

// POST - Save a cropped hero image
router.post('/', upload.single('heroImage'), async (req, res) => {
  try {
    const { caption, albumTitle } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    // Validate image using magic numbers
    const isValidImage = await validateImageMagicNumber(req.file.path);
    if (!isValidImage) {
      // Clean up invalid file
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        // File may not exist, ignore
      }
      return res.status(400).json({
        error: 'Invalid image file - file type verification failed'
      });
    }

    // Insert into photos table with hero flag
    const query = `
      INSERT INTO photos (
        filename, original_name, file_path, file_size,
        mime_type, caption, is_hero_image
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      req.file.filename,
      req.file.originalname,
      `uploads/hero/${req.file.filename}`,
      req.file.size,
      req.file.mimetype,
      caption || `Hero image from ${albumTitle || 'gallery'}`,
      true  // Mark as hero image
    ];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);

  } catch (error) {
    logger.error('Error saving hero image:', error);
    res.status(500).json({ error: 'Failed to save hero image' });
  }
});

// GET - Retrieve all hero images with tagged member details
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT p.*,
        COALESCE(
          (
            SELECT json_agg(json_build_object(
              'id', m.id,
              'first_name', m.first_name,
              'last_name', m.last_name,
              'photo_url', m.photo_url
            ))
            FROM members m
            WHERE m.id = ANY(p.hero_tagged_ids)
          ),
          '[]'::json
        ) AS tagged_members
      FROM photos p
      WHERE p.is_hero_image = true
      ORDER BY p.uploaded_at DESC
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching hero images:', error);
    res.status(500).json({ error: 'Failed to fetch hero images' });
  }
});

// PUT - Update hero image curator fields (blurb, location, tagged members)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { hero_blurb, hero_location_override, hero_tagged_ids, caption } = req.body;

    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (hero_blurb !== undefined) {
      fields.push(`hero_blurb = $${paramIndex++}`);
      values.push(hero_blurb);
    }
    if (hero_location_override !== undefined) {
      fields.push(`hero_location_override = $${paramIndex++}`);
      values.push(hero_location_override);
    }
    if (hero_tagged_ids !== undefined) {
      fields.push(`hero_tagged_ids = $${paramIndex++}`);
      values.push(hero_tagged_ids);
    }
    if (caption !== undefined) {
      fields.push(`caption = $${paramIndex++}`);
      values.push(caption);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const query = `
      UPDATE photos
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex} AND is_hero_image = true
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Hero image not found' });
    }

    // Fetch tagged member details for the response
    const photo = result.rows[0];
    if (photo.hero_tagged_ids && photo.hero_tagged_ids.length > 0) {
      const membersResult = await pool.query(
        `SELECT id, first_name, last_name, photo_url FROM members WHERE id = ANY($1)`,
        [photo.hero_tagged_ids]
      );
      photo.tagged_members = membersResult.rows;
    } else {
      photo.tagged_members = [];
    }

    res.json(photo);

  } catch (error) {
    logger.error('Error updating hero image:', error);
    res.status(500).json({ error: 'Failed to update hero image' });
  }
});

// DELETE - Remove a hero image
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM photos WHERE id = $1 AND is_hero_image = true RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Hero image not found' });
    }

    res.json({ message: 'Hero image deleted successfully' });
  } catch (error) {
    logger.error('Error deleting hero image:', error);
    res.status(500).json({ error: 'Failed to delete hero image' });
  }
});

module.exports = router;
