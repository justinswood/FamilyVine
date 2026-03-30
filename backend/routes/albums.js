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
const albumService = require('../services/albumService');

// Use centralized multer config for gallery uploads
const upload = uploadConfigs.gallery;

// Get all albums
router.get('/', async (req, res) => {
  try {
    const albums = await albumService.getAllAlbums();
    res.json(albums);
  } catch (error) {
    logger.error('Error fetching albums:', error);
    res.status(500).json({ error: 'Failed to fetch albums' });
  }
});

// Get specific album with photos
router.get('/:id', validateId(), async (req, res) => {
  try {
    const album = await albumService.getAlbumById(req.params.id);
    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }
    res.json(album);
  } catch (error) {
    logger.error('Error fetching album:', error);
    res.status(500).json({ error: 'Failed to fetch album' });
  }
});

// Create new album
router.post('/', requireRole('editor'), async (req, res) => {
  try {
    const album = await albumService.createAlbum(req.body);
    res.status(201).json(album);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    logger.error('Error creating album:', error);
    res.status(500).json({ error: 'Failed to create album' });
  }
});

// Update album
router.put('/:id', validateId(), requireRole('editor'), async (req, res) => {
  try {
    const album = await albumService.updateAlbum(req.params.id, req.body);
    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }
    res.json(album);
  } catch (error) {
    logger.error('Error updating album:', error);
    res.status(500).json({ error: 'Failed to update album' });
  }
});

// Delete album
router.delete('/:id', validateId(), requireRole('editor'), async (req, res) => {
  try {
    const album = await albumService.deleteAlbum(req.params.id);
    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }
    res.json({ message: 'Album deleted successfully' });
  } catch (error) {
    logger.error('Error deleting album:', error);
    res.status(500).json({ error: 'Failed to delete album' });
  }
});

// Upload photos to album (file I/O stays in route)
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
        const finalPath = path.join('uploads/gallery/', `processed_${Date.now()}_${i}`);
        const processResult = await processImage(file, finalPath);

        if (!processResult.success) {
          logger.error(`Failed to process ${file.originalname}:`, { error: processResult.error });
          errors.push(`Failed to process ${file.originalname}: ${processResult.error}`);
          continue;
        }

        logger.info(`File processed successfully: ${processResult.filename}${processResult.wasConverted ? ' (converted from HEIC)' : ''}`);

        const photo = await albumService.insertPhoto({
          album_id: id,
          filename: processResult.filename,
          original_name: processResult.originalName,
          file_path: processResult.path,
          file_size: processResult.size,
          mime_type: processResult.mimetype,
          width: processResult.width,
          height: processResult.height,
          caption: caption || null
        });

        uploadedPhotos.push(photo);
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

// Update photo caption
router.put('/:albumId/photos/:photoId', validateId(['albumId', 'photoId']), requireRole('editor'), async (req, res) => {
  try {
    const photo = await albumService.updatePhotoCaption(req.params.photoId, req.body.caption);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    res.json(photo);
  } catch (error) {
    logger.error('Error updating photo:', error);
    res.status(500).json({ error: 'Failed to update photo' });
  }
});

// Bulk delete photos
router.delete('/:id/photos/bulk', validateId(), requireRole('editor'), async (req, res) => {
  try {
    const { photoIds } = req.body;
    if (!Array.isArray(photoIds) || photoIds.length === 0) {
      return res.status(400).json({ error: 'photoIds array is required' });
    }
    const count = await albumService.deletePhotos(photoIds);
    res.json({ message: `${count} photo(s) deleted`, count });
  } catch (error) {
    logger.error('Error bulk deleting photos:', error);
    res.status(500).json({ error: 'Failed to delete photos' });
  }
});

// Get specific photo
router.get('/:albumId/photos/:photoId', async (req, res) => {
  try {
    const photo = await albumService.getPhotoWithTags(req.params.photoId);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    res.json(photo);
  } catch (error) {
    logger.error('Error fetching photo:', error);
    res.status(500).json({ error: 'Failed to fetch photo' });
  }
});

// Delete photo
router.delete('/:albumId/photos/:photoId', validateId(['albumId', 'photoId']), requireRole('editor'), async (req, res) => {
  try {
    const photo = await albumService.deletePhoto(req.params.photoId);
    if (!photo) {
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
    const album = await albumService.setAlbumCover(req.params.id, req.params.photoId);
    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }
    res.json(album);
  } catch (error) {
    logger.error('Error setting cover photo:', error);
    res.status(500).json({ error: 'Failed to set cover photo' });
  }
});

// Add tag to photo
router.post('/:albumId/photos/:photoId/tags', validateId(['albumId', 'photoId']), authenticateToken, async (req, res) => {
  try {
    const { member_id, x_coordinate = null, y_coordinate = null, width = null, height = null, confidence = null, is_verified = true } = req.body;

    if (!member_id) {
      return res.status(400).json({ error: 'Member ID is required' });
    }

    const tag = await albumService.addPhotoTag({
      photo_id: req.params.photoId,
      member_id,
      x_coordinate,
      y_coordinate,
      width,
      height,
      confidence,
      is_verified,
      tagged_by: req.user?.id || null
    });

    logger.info('Photo tag created', { tagId: tag.id, photoId: req.params.photoId, memberId: member_id });
    res.status(201).json(tag);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    logger.error('Error adding photo tag:', error);
    res.status(500).json({ error: 'Failed to add tag' });
  }
});

// Get all tags for a specific photo
router.get('/:albumId/photos/:photoId/tags', async (req, res) => {
  try {
    const tags = await albumService.getPhotoTags(req.params.photoId);
    res.json(tags);
  } catch (error) {
    logger.error('Error fetching photo tags:', error);
    res.status(500).json({ error: 'Failed to fetch photo tags' });
  }
});

// Update/edit a tag
router.put('/:albumId/photos/:photoId/tags/:tagId', validateId(['albumId', 'photoId', 'tagId']), requireRole('editor'), async (req, res) => {
  try {
    const tag = await albumService.updatePhotoTag(req.params.tagId, req.body);
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }
    res.json(tag);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    logger.error('Error updating tag:', error);
    res.status(500).json({ error: 'Failed to update tag' });
  }
});

// Remove tag from photo
router.delete('/:albumId/photos/:photoId/tags/:tagId', validateId(['albumId', 'photoId', 'tagId']), requireRole('editor'), async (req, res) => {
  try {
    const tag = await albumService.deletePhotoTag(req.params.tagId);
    if (!tag) {
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
    const photos = await albumService.getTaggedPhotos(req.params.memberId);
    res.json(photos);
  } catch (error) {
    logger.error('Error fetching tagged photos:', error);
    res.status(500).json({ error: 'Failed to fetch tagged photos' });
  }
});

// PUT /:albumId/photos/:photoId/rotate - Rotate a photo
router.put('/:albumId/photos/:photoId/rotate', validateId(['albumId', 'photoId']), authenticateToken, async (req, res) => {
  const { albumId, photoId } = req.params;
  const { degrees = 90, destructive = true } = req.body;

  try {
    const validDegrees = [90, 180, 270, -90];
    if (!validDegrees.includes(degrees)) {
      return res.status(400).json({ error: 'Invalid rotation degrees' });
    }

    const photo = await albumService.getPhotoByIdAndAlbum(photoId, albumId);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // NON-DESTRUCTIVE MODE: Store rotation as metadata
    if (!destructive) {
      const normalizedDegrees = degrees < 0 ? 360 + degrees : degrees;
      const newRotation = (photo.rotation_degrees + normalizedDegrees) % 360;
      const effectiveRotation = (normalizedDegrees % 180) !== 0;
      const newWidth = effectiveRotation ? photo.height : photo.width;
      const newHeight = effectiveRotation ? photo.width : photo.height;

      const updated = await albumService.updatePhotoMetadata(photoId, {
        rotation_degrees: newRotation,
        width: newWidth,
        height: newHeight,
        edited_at: new Date()
      });

      logger.info('Photo rotated non-destructively', { photoId, albumId, degrees: normalizedDegrees, newRotation });
      return res.json({ message: 'Photo rotated successfully (non-destructive)', photo: updated });
    }

    // DESTRUCTIVE MODE: Physically rotate the file
    const filePath = path.join(__dirname, '..', photo.file_path);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Photo file not found on disk' });
    }

    const buffer = await sharp(filePath).rotate(degrees).toBuffer();
    await sharp(buffer).toFile(filePath);
    const metadata = await sharp(filePath).metadata();

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (!photo.original_file_path) {
        await client.query('UPDATE photos SET original_file_path = $1 WHERE id = $2', [photo.file_path, photoId]);
      }

      await client.query(
        `UPDATE photos SET width = $1, height = $2, file_size = $3, rotation_degrees = 0, is_edited = true, edited_at = NOW() WHERE id = $4`,
        [metadata.width, metadata.height, metadata.size, photoId]
      );

      await client.query('COMMIT');
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }

    logger.info('Photo rotated destructively', { photoId, albumId, degrees });
    res.json({ message: 'Photo rotated successfully (destructive)', photo: { id: photoId, width: metadata.width, height: metadata.height } });

  } catch (error) {
    logger.error('Error rotating photo:', error);
    res.status(500).json({ error: 'Failed to rotate photo' });
  }
});

// POST /:albumId/photos/:photoId/crop - Crop a photo (destructive)
router.post('/:albumId/photos/:photoId/crop', validateId(['albumId', 'photoId']), authenticateToken, async (req, res) => {
  const { albumId, photoId } = req.params;
  const { crop, quality = 0.85 } = req.body;

  try {
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
    if (quality < 0.1 || quality > 1.0) {
      return res.status(400).json({ error: 'Quality must be between 0.1 and 1.0' });
    }

    const photo = await albumService.getPhotoByIdAndAlbum(photoId, albumId);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const filePath = path.join(__dirname, '..', photo.file_path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Photo file not found on disk' });
    }

    const metadata = await sharp(filePath).metadata();
    const cropPixels = {
      left: Math.round((x / 100) * metadata.width),
      top: Math.round((y / 100) * metadata.height),
      width: Math.round((width / 100) * metadata.width),
      height: Math.round((height / 100) * metadata.height)
    };

    if (cropPixels.width < 10 || cropPixels.height < 10) {
      return res.status(400).json({ error: 'Cropped area is too small (minimum 10x10 pixels)' });
    }

    const ext = path.extname(filePath);
    const baseName = path.basename(filePath, ext);
    const dirName = path.dirname(filePath);
    const croppedPath = path.join(dirName, `${baseName}_cropped_${Date.now()}${ext}`);

    await sharp(filePath).extract(cropPixels).jpeg({ quality: Math.round(quality * 100) }).toFile(croppedPath);
    const croppedMetadata = await sharp(croppedPath).metadata();

    if (photo.file_path !== photo.original_file_path) {
      safeUnlinkSync(filePath, logger);
    }

    const relativePath = croppedPath.replace(path.join(__dirname, '..'), '').replace(/^\//, '');

    const client = await pool.connect();
    let updateResult;
    let tagUpdateResult;
    try {
      await client.query('BEGIN');

      if (!photo.original_file_path) {
        await client.query('UPDATE photos SET original_file_path = $1 WHERE id = $2', [photo.file_path, photoId]);
        logger.info('Backed up original file path before crop', { photoId, originalPath: photo.file_path });
      }

      updateResult = await client.query(
        `UPDATE photos SET file_path = $1, width = $2, height = $3, file_size = $4, is_edited = true, edited_at = NOW() WHERE id = $5 RETURNING *`,
        [relativePath, croppedMetadata.width, croppedMetadata.height, croppedMetadata.size, photoId]
      );

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

      await client.query(
        `DELETE FROM photo_tags WHERE photo_id = $1 AND (x_coordinate < 0 OR y_coordinate < 0 OR x_coordinate > 100 OR y_coordinate > 100)`,
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
      photoId, albumId, cropArea: crop,
      originalDimensions: { width: metadata.width, height: metadata.height },
      newDimensions: { width: croppedMetadata.width, height: croppedMetadata.height },
      tagsUpdated: tagUpdateResult.rowCount
    });

    res.json({ success: true, message: 'Photo cropped successfully', photo: updateResult.rows[0], tagsUpdated: tagUpdateResult.rowCount });

  } catch (error) {
    logger.error('Error cropping photo:', error);
    res.status(500).json({ error: 'Failed to crop photo' });
  }
});

module.exports = router;
