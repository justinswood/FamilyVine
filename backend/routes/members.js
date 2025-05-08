const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'user',
  host: 'db',
  database: 'familytree',
  password: 'pass',
  port: 5432,
});

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Serve uploaded files
router.use('/uploads', express.static('uploads'));

// Get all members
router.get('/', async (req, res) => {
  const result = await pool.query('SELECT * FROM members ORDER BY id DESC');
  res.json(result.rows);
});

// Get one member
router.get('/:id', async (req, res) => {
  const result = await pool.query('SELECT * FROM members WHERE id = $1', [req.params.id]);
  res.json(result.rows[0]);
});

// Add a member (with optional photo)
router.post('/', upload.single('photo'), async (req, res) => {
  let { name, bio, birth_date, death_date, location } = req.body;
  const photo_url = req.file ? `/api/members/uploads/${req.file.filename}` : null;

  birth_date = birth_date || null;
  death_date = death_date || null;
  bio = bio || null;
  location = location || null;

  const result = await pool.query(
    'INSERT INTO members (name, bio, birth_date, death_date, location, photo_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [name, bio, birth_date, death_date, location, photo_url]
  );
  res.status(201).json(result.rows[0]);
});

module.exports = router;
