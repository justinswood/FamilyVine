const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const pool = require('../config/database');
const { validateImageMagicNumber } = require('../utils/imageProcessor');
const { uploadConfigs } = require('../config/multer');

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
    console.error('Error saving hero image:', error);
    res.status(500).json({ error: 'Failed to save hero image' });
  }
});

// GET - Retrieve all hero images
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT * FROM photos 
      WHERE is_hero_image = true 
      ORDER BY uploaded_at DESC
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching hero images:', error);
    res.status(500).json({ error: 'Failed to fetch hero images' });
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
    console.error('Error deleting hero image:', error);
    res.status(500).json({ error: 'Failed to delete hero image' });
  }
});

module.exports = router;