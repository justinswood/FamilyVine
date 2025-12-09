/**
 * Album Service
 * Handles business logic for album and photo operations
 */

const pool = require('../config/database');

/**
 * Get all albums with photo counts and cover photos
 * @returns {Promise<Array>} Array of album objects
 */
async function getAllAlbums() {
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
  return result.rows;
}

/**
 * Get album by ID with all photos
 * @param {number} albumId - Album ID
 * @returns {Promise<Object|null>} Album object with photos array or null if not found
 */
async function getAlbumById(albumId) {
  // Get album details
  const albumQuery = `
    SELECT a.*, p.file_path as cover_photo_path
    FROM albums a
    LEFT JOIN photos p ON a.cover_photo_id = p.id
    WHERE a.id::text = $1::text
  `;

  const albumResult = await pool.query(albumQuery, [albumId]);

  if (albumResult.rows.length === 0) {
    return null;
  }

  const album = albumResult.rows[0];

  // Get all photos in album
  const photosQuery = `
    SELECT * FROM photos
    WHERE album_id::text = $1::text
    ORDER BY uploaded_at DESC
  `;

  const photosResult = await pool.query(photosQuery, [albumId]);
  album.photos = photosResult.rows;

  return album;
}

/**
 * Create a new album
 * @param {Object} albumData - Album data
 * @returns {Promise<Object>} Created album object
 */
async function createAlbum(albumData) {
  const { title, description } = albumData;

  const query = `
    INSERT INTO albums (title, description, created_at)
    VALUES ($1, $2, NOW())
    RETURNING *
  `;

  const result = await pool.query(query, [title, description || null]);
  return result.rows[0];
}

/**
 * Update an album
 * @param {number} albumId - Album ID
 * @param {Object} albumData - Updated album data
 * @returns {Promise<Object|null>} Updated album object or null if not found
 */
async function updateAlbum(albumId, albumData) {
  const { title, description, cover_photo_id } = albumData;

  const query = `
    UPDATE albums
    SET title = COALESCE($1, title),
        description = COALESCE($2, description),
        cover_photo_id = COALESCE($3, cover_photo_id)
    WHERE id = $4
    RETURNING *
  `;

  const result = await pool.query(query, [
    title,
    description,
    cover_photo_id,
    albumId
  ]);

  return result.rows[0] || null;
}

/**
 * Delete an album
 * @param {number} albumId - Album ID
 * @returns {Promise<boolean>} True if deleted successfully
 */
async function deleteAlbum(albumId) {
  const query = 'DELETE FROM albums WHERE id = $1';
  const result = await pool.query(query, [albumId]);
  return result.rowCount > 0;
}

/**
 * Add photo to album
 * @param {Object} photoData - Photo data
 * @returns {Promise<Object>} Created photo object
 */
async function addPhoto(photoData) {
  const {
    album_id,
    file_path,
    caption,
    member_id,
    width,
    height,
    file_size
  } = photoData;

  const query = `
    INSERT INTO photos (album_id, file_path, caption, member_id, width, height, file_size, uploaded_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    RETURNING *
  `;

  const result = await pool.query(query, [
    album_id,
    file_path,
    caption || null,
    member_id || null,
    width || null,
    height || null,
    file_size || null
  ]);

  return result.rows[0];
}

/**
 * Get photo by ID
 * @param {number} photoId - Photo ID
 * @returns {Promise<Object|null>} Photo object or null if not found
 */
async function getPhotoById(photoId) {
  const query = 'SELECT * FROM photos WHERE id = $1';
  const result = await pool.query(query, [photoId]);
  return result.rows[0] || null;
}

/**
 * Update photo caption and member association
 * @param {number} photoId - Photo ID
 * @param {Object} photoData - Updated photo data
 * @returns {Promise<Object|null>} Updated photo object or null if not found
 */
async function updatePhoto(photoId, photoData) {
  const { caption, member_id } = photoData;

  const query = `
    UPDATE photos
    SET caption = COALESCE($1, caption),
        member_id = $2
    WHERE id = $3
    RETURNING *
  `;

  const result = await pool.query(query, [caption, member_id, photoId]);
  return result.rows[0] || null;
}

/**
 * Delete a photo
 * @param {number} photoId - Photo ID
 * @returns {Promise<boolean>} True if deleted successfully
 */
async function deletePhoto(photoId) {
  const query = 'DELETE FROM photos WHERE id = $1';
  const result = await pool.query(query, [photoId]);
  return result.rowCount > 0;
}

/**
 * Update album cover photo
 * @param {number} albumId - Album ID
 * @param {number} photoId - Photo ID to set as cover
 * @returns {Promise<Object|null>} Updated album object or null if not found
 */
async function updateAlbumCover(albumId, photoId) {
  const query = `
    UPDATE albums
    SET cover_photo_id = $1
    WHERE id = $2
    RETURNING *
  `;

  const result = await pool.query(query, [photoId, albumId]);
  return result.rows[0] || null;
}

module.exports = {
  getAllAlbums,
  getAlbumById,
  createAlbum,
  updateAlbum,
  deleteAlbum,
  addPhoto,
  getPhotoById,
  updatePhoto,
  deletePhoto,
  updateAlbumCover
};
