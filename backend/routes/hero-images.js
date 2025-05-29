const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  user: 'user',
  host: 'db',
  database: 'familytree',
  password: 'pass',
  port: 5432,
});

// Configure multer for hero image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/hero');
    // Ensure the hero uploads directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `hero_${timestamp}${ext}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// POST - Save a cropped hero image
router.post('/', upload.single('heroImage'), async (req, res) => {
  try {
    const { caption, albumTitle } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
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