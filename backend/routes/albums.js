const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const pool = require('../config/database');
const { processImage } = require('../utils/imageProcessor');
const { uploadConfigs } = require('../config/multer');
const logger = require('../config/logger');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateId } = require('../middleware/validators');
const { safeUnlinkSync } = require('../utils/pathSecurity');

// Use centralized multer config for gallery uploads
const upload = uploadConfigs.gallery;

// Get all albums
router.get('/', async (req, res) => {
  try {
    // Split into efficient queries to avoid cartesian JOIN explosion
    const albumsResult = await pool.query(`
      SELECT a.*,
             p.file_path as cover_photo_path,
             p.rotation_degrees as cover_photo_rotation,
             (SELECT COUNT(*) FROM photos WHERE album_id = a.id) as photo_count
      FROM albums a
      LEFT JOIN photos p ON a.cover_photo_id = p.id
      ORDER BY a.created_at DESC
    `);

    if (albumsResult.rows.length === 0) {
      return res.json([]);
    }

    const albumIds = albumsResult.rows.map(a => a.id);

    // Batch-fetch tagged members and recent photos for all albums
    const [taggedResult, recentResult] = await Promise.all([
      pool.query(`
        SELECT ph.album_id, m.id, m.first_name, m.last_name, m.photo_url
        FROM photo_tags pt
        JOIN photos ph ON pt.photo_id = ph.id
        JOIN members m ON pt.member_id = m.id
        WHERE ph.album_id = ANY($1)
      `, [albumIds]),
      pool.query(`
        SELECT sub.album_id, sub.id, sub.file_path
        FROM (
          SELECT p.album_id, p.id, p.file_path,
                 ROW_NUMBER() OVER (PARTITION BY p.album_id ORDER BY p.uploaded_at DESC) as rn
          FROM photos p
          WHERE p.album_id = ANY($1)
        ) sub
        WHERE sub.rn <= 3
      `, [albumIds])
    ]);

    // Group by album_id
    const taggedByAlbum = {};
    const recentByAlbum = {};
    for (const row of taggedResult.rows) {
      if (!taggedByAlbum[row.album_id]) taggedByAlbum[row.album_id] = [];
      taggedByAlbum[row.album_id].push({ id: row.id, first_name: row.first_name, last_name: row.last_name, photo_url: row.photo_url });
    }
    for (const row of recentResult.rows) {
      if (!recentByAlbum[row.album_id]) recentByAlbum[row.album_id] = [];
      recentByAlbum[row.album_id].push({ id: row.id, file_path: row.file_path });
    }

    // Deduplicate tagged members per album
    const albums = albumsResult.rows.map(album => ({
      ...album,
      tagged_members: taggedByAlbum[album.id]
        ? [...new Map(taggedByAlbum[album.id].map(m => [m.id, m])).values()]
        : [],
      recent_photos: recentByAlbum[album.id] || []
    }));

    res.json(albums);
  } catch (error) {
    logger.error('Error fetching albums:', error);
    res.status(500).json({ error: 'Failed to fetch albums' });
  }
});

// Get specific album with photos
router.get('/:id', validateId(), async (req, res) => {
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
    logger.error('Error fetching album:', error);
    res.status(500).json({ error: 'Failed to fetch album' });
  }
});

// Create new album
router.post('/', requireRole('editor'), async (req, res) => {
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
    logger.error('Error creating album:', error);
    res.status(500).json({ error: 'Failed to create album' });
  }
});

// Update album
router.put('/:id', validateId(), requireRole('editor'), async (req, res) => {
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
    logger.error('Error updating album:', error);
    res.status(500).json({ error: 'Failed to update album' });
  }
});

// Delete album
router.delete('/:id', validateId(), requireRole('editor'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM albums WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Album not found' });
    }
    
    res.json({ message: 'Album deleted successfully' });
  } catch (error) {
    logger.error('Error deleting album:', error);
    res.status(500).json({ error: 'Failed to delete album' });
  }
});

// Upload photos to album
router.post('/:id/photos', validateId(), requireRole('editor'), upload.array('photos', 100), async (req, res) => {
  try {
    const { id } = req.params;
    const { captions = [] } = req.body;

    logger.info('Processing upload', { albumId: id, fileCount: req.files ? req.files.length : 0 });
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No photos uploaded' });
    }
    
    const uploadedPhotos = [];
    const errors = [];
    
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const caption = Array.isArray(captions) ? captions[i] : captions;

      logger.debug(`Processing file ${i + 1}/${req.files.length}: ${file.originalname}`);
      
      try {
        // Process the image (handles HEIC conversion and optimization)
        const finalPath = path.join('uploads/gallery/', `processed_${Date.now()}_${i}`);
        const processResult = await processImage(file, finalPath);
        
        if (!processResult.success) {
          logger.error(`Failed to process ${file.originalname}:`, { error: processResult.error });
          errors.push(`Failed to process ${file.originalname}: ${processResult.error}`);
          continue;
        }

        logger.info(`File processed successfully: ${processResult.filename}${processResult.wasConverted ? ' (converted from HEIC)' : ''}`);
        
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
        logger.error(`Error processing file ${file.originalname}:`, fileError);
        errors.push(`Error processing ${file.originalname}: ${fileError.message}`);
      }
    }

    logger.info(`Successfully uploaded ${uploadedPhotos.length} photos`, { errorCount: errors.length });
    
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
    logger.error('Error uploading photos:', error);
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
               'member_name', m.first_name || ' ' || m.last_name || COALESCE(' ' || NULLIF(m.suffix, ''), ''),
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
    logger.error('Error fetching photo:', error);
    res.status(500).json({ error: 'Failed to fetch photo' });
  }
});

// Delete photo
router.delete('/:albumId/photos/:photoId', validateId(['albumId', 'photoId']), requireRole('editor'), async (req, res) => {
  try {
    const { photoId } = req.params;
    
    const result = await pool.query('DELETE FROM photos WHERE id = $1 RETURNING *', [photoId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    logger.error('Error deleting photo:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

// Set album cover photo
router.put('/:id/cover/:photoId', validateId(['id', 'photoId']), requireRole('editor'), async (req, res) => {
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
    logger.error('Error setting cover photo:', error);
    res.status(500).json({ error: 'Failed to set cover photo' });
  }
});

// Add tag to photo
router.post('/:albumId/photos/:photoId/tags', validateId(['albumId', 'photoId']), authenticateToken, async (req, res) => {
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

    // Get tagged_by from authenticated user
    const tagged_by = req.user?.id || null;

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
        width, height, confidence, is_verified, tagged_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      photoId, member_id, x_coordinate, y_coordinate,
      width, height, confidence, is_verified, tagged_by
    ];

    const result = await pool.query(query, values);

    // Get member details for response
    const memberQuery = `SELECT first_name, last_name, suffix FROM members WHERE id = $1`;
    const memberResult = await pool.query(memberQuery, [member_id]);
    const member = memberResult.rows[0];

    logger.info('Photo tag created', {
      tagId: result.rows[0].id,
      photoId,
      memberId: member_id,
      taggedBy: tagged_by
    });

    res.status(201).json({
      ...result.rows[0],
      member_name: `${member.first_name} ${member.last_name}${member.suffix ? ' ' + member.suffix : ''}`,
      x_coordinate: result.rows[0].x_coordinate ? parseFloat(result.rows[0].x_coordinate) : null,
      y_coordinate: result.rows[0].y_coordinate ? parseFloat(result.rows[0].y_coordinate) : null,
      width: result.rows[0].width ? parseFloat(result.rows[0].width) : null,
      height: result.rows[0].height ? parseFloat(result.rows[0].height) : null,
      confidence: result.rows[0].confidence ? parseFloat(result.rows[0].confidence) : null
    });
  } catch (error) {
    logger.error('Error adding photo tag:', error);
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
        m.suffix,
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
      member_name: `${tag.first_name} ${tag.last_name}${tag.suffix ? ' ' + tag.suffix : ''}`,
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
    logger.error('Error fetching photo tags:', error);
    res.status(500).json({ error: 'Failed to fetch photo tags' });
  }
});

// Update/edit a tag
router.put('/:albumId/photos/:photoId/tags/:tagId', validateId(['albumId', 'photoId', 'tagId']), requireRole('editor'), async (req, res) => {
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
    const memberQuery = `SELECT first_name, last_name, suffix FROM members WHERE id = $1`;
    const memberResult = await pool.query(memberQuery, [updatedTag.member_id]);
    const member = memberResult.rows[0];

    res.json({
      ...updatedTag,
      member_name: `${member.first_name} ${member.last_name}${member.suffix ? ' ' + member.suffix : ''}`,
      x_coordinate: updatedTag.x_coordinate ? parseFloat(updatedTag.x_coordinate) : null,
      y_coordinate: updatedTag.y_coordinate ? parseFloat(updatedTag.y_coordinate) : null,
      width: updatedTag.width ? parseFloat(updatedTag.width) : null,
      height: updatedTag.height ? parseFloat(updatedTag.height) : null,
      confidence: updatedTag.confidence ? parseFloat(updatedTag.confidence) : null
    });
  } catch (error) {
    logger.error('Error updating tag:', error);
    res.status(500).json({ error: 'Failed to update tag' });
  }
});

// Remove tag from photo
router.delete('/:albumId/photos/:photoId/tags/:tagId', validateId(['albumId', 'photoId', 'tagId']), requireRole('editor'), async (req, res) => {
  try {
    const { tagId } = req.params;
    
    const result = await pool.query('DELETE FROM photo_tags WHERE id = $1 RETURNING *', [tagId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tag not found' });
    }
    
    res.json({ message: 'Tag removed successfully' });
  } catch (error) {
    logger.error('Error removing photo tag:', error);
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
    logger.error('Error fetching tagged photos:', error);
    res.status(500).json({ error: 'Failed to fetch tagged photos' });
  }
});

// PUT /:albumId/photos/:photoId/rotate - Rotate a photo (destructive by default for reliable display)
router.put('/:albumId/photos/:photoId/rotate', validateId(['albumId', 'photoId']), authenticateToken, async (req, res) => {
  const { albumId, photoId } = req.params;
  const { degrees = 90, destructive = true } = req.body;

  try {
    // Validate degrees (only allow 90, 180, 270, -90)
    const validDegrees = [90, 180, 270, -90];
    if (!validDegrees.includes(degrees)) {
      return res.status(400).json({ error: 'Invalid rotation degrees' });
    }

    // Get photo details from database
    const photoQuery = await pool.query(
      'SELECT * FROM photos WHERE id = $1 AND album_id = $2',
      [photoId, albumId]
    );

    if (photoQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const photo = photoQuery.rows[0];

    // NON-DESTRUCTIVE MODE (default): Store rotation as metadata
    if (!destructive) {
      // Normalize degrees to 0-359 range
      const normalizedDegrees = degrees < 0 ? 360 + degrees : degrees;
      const newRotation = (photo.rotation_degrees + normalizedDegrees) % 360;

      // Determine if we need to swap width/height (90° or 270° rotation from current state)
      const effectiveRotation = (normalizedDegrees % 180) !== 0;
      const newWidth = effectiveRotation ? photo.height : photo.width;
      const newHeight = effectiveRotation ? photo.width : photo.height;

      // Update rotation metadata in database
      const result = await pool.query(
        `UPDATE photos
         SET rotation_degrees = $1,
             width = $2,
             height = $3,
             edited_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [newRotation, newWidth, newHeight, photoId]
      );

      logger.info('Photo rotated non-destructively', {
        photoId,
        albumId,
        degrees: normalizedDegrees,
        newRotation,
        dimensions: { width: newWidth, height: newHeight }
      });

      return res.json({
        message: 'Photo rotated successfully (non-destructive)',
        photo: result.rows[0]
      });
    }

    // DESTRUCTIVE MODE: Physically rotate the file (backward compatibility)
    const filePath = path.join(__dirname, '..', photo.file_path);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Photo file not found on disk' });
    }

    // Rotate image using Sharp
    const buffer = await sharp(filePath)
      .rotate(degrees)
      .toBuffer();

    // Write rotated image back to same path
    await sharp(buffer).toFile(filePath);

    // Get new metadata (width/height may have swapped for 90/270 rotations)
    const metadata = await sharp(filePath).metadata();

    // Use a transaction for all database updates
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Backup original file path if not already backed up
      if (!photo.original_file_path) {
        await client.query(
          'UPDATE photos SET original_file_path = $1 WHERE id = $2',
          [photo.file_path, photoId]
        );
      }

      // Update photo dimensions, reset rotation, and edit tracking in database
      await client.query(
        `UPDATE photos
         SET width = $1, height = $2, file_size = $3,
             rotation_degrees = 0,
             is_edited = true, edited_at = NOW()
         WHERE id = $4`,
        [metadata.width, metadata.height, metadata.size, photoId]
      );

      await client.query('COMMIT');
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }

    logger.info('Photo rotated destructively', {
      photoId,
      albumId,
      degrees,
      newDimensions: { width: metadata.width, height: metadata.height }
    });

    res.json({
      message: 'Photo rotated successfully (destructive)',
      photo: { id: photoId, width: metadata.width, height: metadata.height }
    });

  } catch (error) {
    logger.error('Error rotating photo:', error);
    res.status(500).json({ error: 'Failed to rotate photo' });
  }
});

// POST /:albumId/photos/:photoId/crop - Crop a photo (destructive operation)
router.post('/:albumId/photos/:photoId/crop', validateId(['albumId', 'photoId']), authenticateToken, async (req, res) => {
  const { albumId, photoId } = req.params;
  const { crop, quality = 0.85 } = req.body;

  try {
    // Validate crop coordinates (percentages: 0-100)
    if (!crop || typeof crop !== 'object') {
      return res.status(400).json({ error: 'Crop coordinates are required' });
    }

    const { x, y, width, height } = crop;
    if (x == null || y == null || width == null || height == null) {
      return res.status(400).json({ error: 'Crop must include x, y, width, and height' });
    }

    if (width <= 0 || height <= 0 || width > 100 || height > 100) {
      return res.status(400).json({ error: 'Invalid crop dimensions' });
    }

    if (x < 0 || y < 0 || x + width > 100 || y + height > 100) {
      return res.status(400).json({ error: 'Crop coordinates out of bounds' });
    }

    // Validate quality parameter
    if (quality < 0.1 || quality > 1.0) {
      return res.status(400).json({ error: 'Quality must be between 0.1 and 1.0' });
    }

    // Get photo details from database
    const photoQuery = await pool.query(
      'SELECT * FROM photos WHERE id = $1 AND album_id = $2',
      [photoId, albumId]
    );

    if (photoQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const photo = photoQuery.rows[0];
    const filePath = path.join(__dirname, '..', photo.file_path);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Photo file not found on disk' });
    }

    // Get current image metadata
    const metadata = await sharp(filePath).metadata();

    // Convert percentage coordinates to pixels
    const cropPixels = {
      left: Math.round((x / 100) * metadata.width),
      top: Math.round((y / 100) * metadata.height),
      width: Math.round((width / 100) * metadata.width),
      height: Math.round((height / 100) * metadata.height)
    };

    // Validate pixel dimensions
    if (cropPixels.width < 10 || cropPixels.height < 10) {
      return res.status(400).json({ error: 'Cropped area is too small (minimum 10x10 pixels)' });
    }

    // Generate cropped file path
    const ext = path.extname(filePath);
    const baseName = path.basename(filePath, ext);
    const dirName = path.dirname(filePath);
    const croppedPath = path.join(dirName, `${baseName}_cropped_${Date.now()}${ext}`);

    // Perform the crop operation (file I/O outside transaction)
    await sharp(filePath)
      .extract(cropPixels)
      .jpeg({ quality: Math.round(quality * 100) })
      .toFile(croppedPath);

    // Get metadata of cropped image
    const croppedMetadata = await sharp(croppedPath).metadata();

    // Delete old file (since we're replacing it, with path traversal protection)
    if (photo.file_path !== photo.original_file_path) {
      safeUnlinkSync(filePath, logger);
    }

    // Convert file path to relative path for database
    const relativePath = croppedPath.replace(path.join(__dirname, '..'), '').replace(/^\//, '');

    // Use a transaction for all database updates
    const client = await pool.connect();
    let updateResult;
    let tagUpdateResult;
    try {
      await client.query('BEGIN');

      // Backup original file path if not already backed up
      if (!photo.original_file_path) {
        await client.query(
          'UPDATE photos SET original_file_path = $1 WHERE id = $2',
          [photo.file_path, photoId]
        );
        logger.info('Backed up original file path before crop', { photoId, originalPath: photo.file_path });
      }

      // Update photo record with new file path and dimensions
      updateResult = await client.query(
        `UPDATE photos
         SET file_path = $1,
             width = $2,
             height = $3,
             file_size = $4,
             is_edited = true,
             edited_at = NOW()
         WHERE id = $5
         RETURNING *`,
        [relativePath, croppedMetadata.width, croppedMetadata.height, croppedMetadata.size, photoId]
      );

      // Update tag coordinates proportionally
      tagUpdateResult = await client.query(
        `UPDATE photo_tags
         SET x_coordinate = ((x_coordinate - $1) * 100.0 / $2),
             y_coordinate = ((y_coordinate - $3) * 100.0 / $4),
             width = (width * 100.0 / $2),
             height = (height * 100.0 / $4)
         WHERE photo_id = $5
         RETURNING *`,
        [x, width, y, height, photoId]
      );

      // Remove tags that are now outside the cropped area
      await client.query(
        `DELETE FROM photo_tags
         WHERE photo_id = $1
         AND (x_coordinate < 0 OR y_coordinate < 0 OR x_coordinate > 100 OR y_coordinate > 100)`,
        [photoId]
      );

      await client.query('COMMIT');
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }

    logger.info('Photo cropped successfully', {
      photoId,
      albumId,
      cropArea: crop,
      originalDimensions: { width: metadata.width, height: metadata.height },
      newDimensions: { width: croppedMetadata.width, height: croppedMetadata.height },
      tagsUpdated: tagUpdateResult.rowCount,
      newFilePath: relativePath
    });

    res.json({
      success: true,
      message: 'Photo cropped successfully',
      photo: updateResult.rows[0],
      tagsUpdated: tagUpdateResult.rowCount
    });

  } catch (error) {
    logger.error('Error cropping photo:', error);
    res.status(500).json({ error: 'Failed to crop photo' });
  }
});

module.exports = router;