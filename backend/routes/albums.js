const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const pool = require('../config/database');
const { processImage } = require('../utils/imageProcessor');
const { uploadConfigs } = require('../config/multer');

// Use centralized multer config for gallery uploads
const upload = uploadConfigs.gallery;

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
      WHERE a.id::text = $1::text
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
    const errors = [];
    
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const caption = Array.isArray(captions) ? captions[i] : captions;
      
      console.log(`Processing file ${i + 1}/${req.files.length}: ${file.originalname}`);
      
      try {
        // Process the image (handles HEIC conversion and optimization)
        const finalPath = path.join('uploads/gallery/', `processed_${Date.now()}_${i}`);
        const processResult = await processImage(file, finalPath);
        
        if (!processResult.success) {
          console.error(`Failed to process ${file.originalname}:`, processResult.error);
          errors.push(`Failed to process ${file.originalname}: ${processResult.error}`);
          continue;
        }
        
        console.log(`File processed successfully: ${processResult.filename}${processResult.wasConverted ? ' (converted from HEIC)' : ''}`);
        
        const query = `
          INSERT INTO photos (
            album_id, filename, original_name, file_path, file_size,
            mime_type, width, height, caption
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *
        `;
        
        const values = [
          id,
          processResult.filename,
          processResult.originalName,
          processResult.path,
          processResult.size,
          processResult.mimetype,
          processResult.width,
          processResult.height,
          caption || null
        ];
        
        const result = await pool.query(query, values);
        uploadedPhotos.push(result.rows[0]);
        
      } catch (fileError) {
        console.error(`Error processing file ${file.originalname}:`, fileError);
        errors.push(`Error processing ${file.originalname}: ${fileError.message}`);
      }
    }
    
    console.log(`Successfully uploaded ${uploadedPhotos.length} photos`);
    if (errors.length > 0) {
      console.log(`Errors: ${errors.length}`);
    }
    
    const response = {
      message: `Successfully uploaded ${uploadedPhotos.length} photos`,
      photos: uploadedPhotos
    };
    
    if (errors.length > 0) {
      response.errors = errors;
      response.message += ` (${errors.length} files failed)`;
    }
    
    res.status(201).json(response);
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
    const { 
      member_id, 
      x_coordinate = null, 
      y_coordinate = null,
      width = null,
      height = null,
      confidence = null,
      is_verified = true 
    } = req.body;
    
    if (!member_id) {
      return res.status(400).json({ error: 'Member ID is required' });
    }
    
    // Check if this member is already tagged in this photo
    const existingTag = await pool.query(
      'SELECT id FROM photo_tags WHERE photo_id = $1 AND member_id = $2',
      [photoId, member_id]
    );
    
    if (existingTag.rows.length > 0) {
      return res.status(400).json({ error: 'Member is already tagged in this photo' });
    }
    
    const query = `
      INSERT INTO photo_tags (
        photo_id, member_id, x_coordinate, y_coordinate, 
        width, height, confidence, is_verified
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [
      photoId, member_id, x_coordinate, y_coordinate,
      width, height, confidence, is_verified
    ];
    
    const result = await pool.query(query, values);
    
    // Get member details for response
    const memberQuery = `SELECT first_name, last_name FROM members WHERE id = $1`;
    const memberResult = await pool.query(memberQuery, [member_id]);
    const member = memberResult.rows[0];
    
    res.status(201).json({
      ...result.rows[0],
      member_name: `${member.first_name} ${member.last_name}`,
      x_coordinate: result.rows[0].x_coordinate ? parseFloat(result.rows[0].x_coordinate) : null,
      y_coordinate: result.rows[0].y_coordinate ? parseFloat(result.rows[0].y_coordinate) : null,
      width: result.rows[0].width ? parseFloat(result.rows[0].width) : null,
      height: result.rows[0].height ? parseFloat(result.rows[0].height) : null,
      confidence: result.rows[0].confidence ? parseFloat(result.rows[0].confidence) : null
    });
  } catch (error) {
    console.error('Error adding photo tag:', error);
    res.status(500).json({ error: 'Failed to add tag' });
  }
});

// Get all tags for a specific photo
router.get('/:albumId/photos/:photoId/tags', async (req, res) => {
  try {
    const { photoId } = req.params;
    
    const query = `
      SELECT 
        pt.*,
        m.first_name,
        m.last_name,
        m.photo_url
      FROM photo_tags pt
      JOIN members m ON pt.member_id = m.id
      WHERE pt.photo_id = $1
      ORDER BY pt.tagged_at DESC
    `;
    
    const result = await pool.query(query, [photoId]);
    
    // Transform data to match frontend expectations
    const tags = result.rows.map(tag => ({
      id: tag.id,
      member_id: tag.member_id,
      member_name: `${tag.first_name} ${tag.last_name}`,
      x_coordinate: tag.x_coordinate ? parseFloat(tag.x_coordinate) : null,
      y_coordinate: tag.y_coordinate ? parseFloat(tag.y_coordinate) : null,
      width: tag.width ? parseFloat(tag.width) : null,
      height: tag.height ? parseFloat(tag.height) : null,
      confidence: tag.confidence ? parseFloat(tag.confidence) : null,
      is_verified: tag.is_verified,
      tagged_by: tag.tagged_by,
      tagged_at: tag.tagged_at,
      photo_id: tag.photo_id
    }));
    
    res.json(tags);
  } catch (error) {
    console.error('Error fetching photo tags:', error);
    res.status(500).json({ error: 'Failed to fetch photo tags' });
  }
});

// Update/edit a tag
router.put('/:albumId/photos/:photoId/tags/:tagId', async (req, res) => {
  try {
    const { tagId } = req.params;
    const { 
      is_verified,
      x_coordinate,
      y_coordinate,
      width,
      height,
      confidence
    } = req.body;
    
    // Build dynamic update query based on provided fields
    const updateFields = [];
    const values = [];
    let valueIndex = 1;
    
    if (is_verified !== undefined) {
      updateFields.push(`is_verified = $${valueIndex++}`);
      values.push(is_verified);
    }
    if (x_coordinate !== undefined) {
      updateFields.push(`x_coordinate = $${valueIndex++}`);
      values.push(x_coordinate);
    }
    if (y_coordinate !== undefined) {
      updateFields.push(`y_coordinate = $${valueIndex++}`);
      values.push(y_coordinate);
    }
    if (width !== undefined) {
      updateFields.push(`width = $${valueIndex++}`);
      values.push(width);
    }
    if (height !== undefined) {
      updateFields.push(`height = $${valueIndex++}`);
      values.push(height);
    }
    if (confidence !== undefined) {
      updateFields.push(`confidence = $${valueIndex++}`);
      values.push(confidence);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    const query = `
      UPDATE photo_tags 
      SET ${updateFields.join(', ')}
      WHERE id = $${valueIndex}
      RETURNING *
    `;
    values.push(tagId);
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tag not found' });
    }
    
    // Get updated tag with member info
    const updatedTag = result.rows[0];
    const memberQuery = `SELECT first_name, last_name FROM members WHERE id = $1`;
    const memberResult = await pool.query(memberQuery, [updatedTag.member_id]);
    const member = memberResult.rows[0];
    
    res.json({
      ...updatedTag,
      member_name: `${member.first_name} ${member.last_name}`,
      x_coordinate: updatedTag.x_coordinate ? parseFloat(updatedTag.x_coordinate) : null,
      y_coordinate: updatedTag.y_coordinate ? parseFloat(updatedTag.y_coordinate) : null,
      width: updatedTag.width ? parseFloat(updatedTag.width) : null,
      height: updatedTag.height ? parseFloat(updatedTag.height) : null,
      confidence: updatedTag.confidence ? parseFloat(updatedTag.confidence) : null
    });
  } catch (error) {
    console.error('Error updating tag:', error);
    res.status(500).json({ error: 'Failed to update tag' });
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