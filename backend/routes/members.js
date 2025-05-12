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

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

router.use('/uploads', express.static('uploads'));

router.get('/', async (req, res) => {
  const result = await pool.query('SELECT * FROM members ORDER BY id DESC');
  res.json(result.rows);
});

router.get('/:id', async (req, res) => {
  const result = await pool.query('SELECT * FROM members WHERE id = $1', [req.params.id]);
  res.json(result.rows[0]);
});

router.post('/', upload.single('photo'), async (req, res) => {
  const {
    first_name, middle_name, last_name, relationship, gender, is_alive,
    birth_date, death_date, birth_place, death_place, location,
    occupation, pronouns, email, phone, photo_url
  } = req.body;

  const photoPath = req.file ? `/api/members/uploads/${req.file.filename}` : photo_url || null;

  const result = await pool.query(
    `INSERT INTO members (
      first_name, middle_name, last_name, relationship, gender, is_alive,
      birth_date, death_date, birth_place, death_place, location,
      occupation, pronouns, email, phone, photo_url
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
    [
      first_name, middle_name, last_name, relationship, gender, is_alive,
      birth_date || null, death_date || null, birth_place, death_place, location,
      occupation, pronouns, email, phone, photoPath
    ]
  );
  res.status(201).json(result.rows[0]);
});

router.put('/:id', async (req, res) => {
  const {
    first_name, middle_name, last_name, relationship, gender, is_alive,
    birth_date, death_date, birth_place, death_place, location,
    occupation, pronouns, email, phone, photo_url
  } = req.body;

  const result = await pool.query(
    `UPDATE members SET
      first_name=$1, middle_name=$2, last_name=$3, relationship=$4, gender=$5, is_alive=$6,
      birth_date=$7, death_date=$8, birth_place=$9, death_place=$10, location=$11,
      occupation=$12, pronouns=$13, email=$14, phone=$15, photo_url=$16
     WHERE id=$17 RETURNING *`,
    [
      first_name, middle_name, last_name, relationship, gender, is_alive,
      birth_date || null, death_date || null, birth_place, death_place, location,
      occupation, pronouns, email, phone, photo_url, req.params.id
    ]
  );
  res.json(result.rows[0]);
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM members WHERE id = $1', [req.params.id]);
  res.status(204).end();
});

module.exports = router;
