const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { Pool } = require('pg');

console.log('=== ALBUMS.JS LOADED ===');

const pool = new Pool({
  user: 'user',
  host: 'db',
  database: 'familytree',
  password: 'pass',
  port: 5432,
});

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/gallery/');
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `photo_${timestamp}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: { 
    fileSize: 50 * 1024 * 1024, // 50MB per file
    files: 100  // Allow up to 100 files total
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get all albums
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT a.*, 
             p.file_path as cover_photo_path,
             COUNT(photos.id) as photo_count
      FROM albums a
      LEFT JOIN photos p ON a.cover_photo_id = p.id
      LEFT JOIN photos ON photos.album_id = a.id
      GROUP BY a.id, p.file_path
      ORDER BY a.created_at DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching albums:', error);
    res.status(500).json({ error: 'Failed to fetch albums' });
  }
});

// Get specific album with photos
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get album details
    const albumQuery = `
      SELECT a.*, p.file_path as cover_photo_path
      FROM albums a
      LEFT JOIN photos p ON a.cover_photo_id = p.id
      WHERE a.id = $1
    `;
    const albumResult = await pool.query(albumQuery, [id]);
    
    if (albumResult.rows.length === 0) {
      return res.status(404).json({ error: 'Album not found' });
    }
    
    // Get photos in album
    const photosQuery = `
      SELECT * FROM photos 
      WHERE album_id = $1 
      ORDER BY uploaded_at DESC
    `;
    const photosResult = await pool.query(photosQuery, [id]);
    
    const album = albumResult.rows[0];
    album.photos = photosResult.rows;
    
    res.json(album);
  } catch (error) {
    console.error('Error fetching album:', error);
    res.status(500).json({ error: 'Failed to fetch album' });
  }
});

// Create new album
router.post('/', async (req, res) => {
  try {
    const { title, description, event_date, is_public = true } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Album title is required' });
    }
    
    const query = `
      INSERT INTO albums (title, description, event_date, is_public)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const result = await pool.query(query, [title, description, event_date || null, is_public]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating album:', error);
    res.status(500).json({ error: 'Failed to create album' });
  }
});

// Update album
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, event_date, is_public } = req.body;
    
    const query = `
      UPDATE albums 
      SET title = $1, description = $2, event_date = $3, is_public = $4
      WHERE id = $5
      RETURNING *
    `;
    
    const result = await pool.query(query, [title, description, event_date, is_public, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Album not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating album:', error);
    res.status(500).json({ error: 'Failed to update album' });
  }
});

// Delete album
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM albums WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Album not found' });
    }
    
    res.json({ message: 'Album deleted successfully' });
  } catch (error) {
    console.error('Error deleting album:', error);
    res.status(500).json({ error: 'Failed to delete album' });
  }
});

// Upload photos to album
router.post('/:id/photos', upload.array('photos', 100), async (req, res) => {
  try {
    const { id } = req.params;
    const { captions = [] } = req.body;
    
    console.log('=== PROCESSING UPLOAD ===');
    console.log('Album ID:', id);
    console.log('Number of files:', req.files ? req.files.length : 0);
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No photos uploaded' });
    }
    
    const uploadedPhotos = [];
    
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const caption = Array.isArray(captions) ? captions[i] : captions;
      
      console.log(`Processing file ${i + 1}/${req.files.length}: ${file.filename}`);
      
      const query = `
        INSERT INTO photos (
          album_id, filename, original_name, file_path, file_size,
          mime_type, caption
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const values = [
        id,
        file.filename,
        file.originalname,
        file.path,
        file.size,
        file.mimetype,
        caption || null
      ];
      
      const result = await pool.query(query, values);
      uploadedPhotos.push(result.rows[0]);
    }
    
    console.log(`Successfully uploaded ${uploadedPhotos.length} photos`);
    
    res.status(201).json({
      message: `Successfully uploaded ${uploadedPhotos.length} photos`,
      photos: uploadedPhotos
    });
  } catch (error) {
    console.error('Error uploading photos:', error);
    res.status(500).json({ error: 'Failed to upload photos: ' + error.message });
  }
});

// Get specific photo
router.get('/:albumId/photos/:photoId', async (req, res) => {
  try {
    const { photoId } = req.params;
    
    const query = `
      SELECT p.*, 
             array_agg(json_build_object(
               'member_id', pt.member_id,
               'member_name', m.first_name || ' ' || m.last_name,
               'x', pt.x_coordinate,
               'y', pt.y_coordinate,
               'width', pt.width,
               'height', pt.height
             )) FILTER (WHERE pt.id IS NOT NULL) as tags
      FROM photos p
      LEFT JOIN photo_tags pt ON p.id = pt.photo_id
      LEFT JOIN members m ON pt.member_id = m.id
      WHERE p.id = $1
      GROUP BY p.id
    `;
    
    const result = await pool.query(query, [photoId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching photo:', error);
    res.status(500).json({ error: 'Failed to fetch photo' });
  }
});

// Delete photo
router.delete('/:albumId/photos/:photoId', async (req, res) => {
  try {
    const { photoId } = req.params;
    
    const result = await pool.query('DELETE FROM photos WHERE id = $1 RETURNING *', [photoId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

// Set album cover photo
router.put('/:id/cover/:photoId', async (req, res) => {
  try {
    const { id, photoId } = req.params;
    
    const query = `
      UPDATE albums 
      SET cover_photo_id = $1
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [photoId, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Album not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error setting cover photo:', error);
    res.status(500).json({ error: 'Failed to set cover photo' });
  }
});

// Add tag to photo
router.post('/:albumId/photos/:photoId/tags', async (req, res) => {
  try {
    const { photoId } = req.params;
    const { member_id } = req.body;
    
    if (!member_id) {
      return res.status(400).json({ error: 'Member ID is required' });
    }
    
    // Check if this tag already exists
    const existingTag = await pool.query(
      'SELECT id FROM photo_tags WHERE photo_id = $1 AND member_id = $2',
      [photoId, member_id]
    );
    
    if (existingTag.rows.length > 0) {
      return res.status(400).json({ error: 'Member is already tagged in this photo' });
    }
    
    const query = `
      INSERT INTO photo_tags (photo_id, member_id, is_verified)
      VALUES ($1, $2, true)
      RETURNING *
    `;
    
    const result = await pool.query(query, [photoId, member_id]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding photo tag:', error);
    res.status(500).json({ error: 'Failed to add tag' });
  }
});

// Remove tag from photo
router.delete('/:albumId/photos/:photoId/tags/:tagId', async (req, res) => {
  try {
    const { tagId } = req.params;
    
    const result = await pool.query('DELETE FROM photo_tags WHERE id = $1 RETURNING *', [tagId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tag not found' });
    }
    
    res.json({ message: 'Tag removed successfully' });
  } catch (error) {
    console.error('Error removing photo tag:', error);
    res.status(500).json({ error: 'Failed to remove tag' });
  }
});

// Get photos where a member is tagged
router.get('/tagged/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;
    
    const query = `
      SELECT p.*, a.title as album_title, a.id as album_id
      FROM photos p
      JOIN photo_tags pt ON p.id = pt.photo_id
      JOIN albums a ON p.album_id = a.id
      WHERE pt.member_id = $1
      ORDER BY p.uploaded_at DESC
    `;
    
    const result = await pool.query(query, [memberId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tagged photos:', error);
    res.status(500).json({ error: 'Failed to fetch tagged photos' });
  }
});

module.exports = router;