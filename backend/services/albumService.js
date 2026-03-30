/**
 * Album Service
 * Handles business logic for album, photo, and photo tag operations.
 */

const pool = require('../config/database');
const logger = require('../config/logger');

// ── Albums ─────────────────────────────────────────────

/**
 * Get all albums with cover photos, photo counts, tagged members, and recent photos.
 * Uses batch queries to avoid cartesian JOIN explosion.
 */
async function getAllAlbums() {
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
    return [];
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
  return albumsResult.rows.map(album => ({
    ...album,
    tagged_members: taggedByAlbum[album.id]
      ? [...new Map(taggedByAlbum[album.id].map(m => [m.id, m])).values()]
      : [],
    recent_photos: recentByAlbum[album.id] || []
  }));
}

/**
 * Get album by ID with all its photos.
 * @param {number} albumId
 * @returns {Promise<Object|null>}
 */
async function getAlbumById(albumId) {
  const albumResult = await pool.query(`
    SELECT a.*, p.file_path as cover_photo_path
    FROM albums a
    LEFT JOIN photos p ON a.cover_photo_id = p.id
    WHERE a.id::text = $1::text
  `, [albumId]);

  if (albumResult.rows.length === 0) return null;

  const photosResult = await pool.query(
    'SELECT * FROM photos WHERE album_id = $1 ORDER BY uploaded_at DESC',
    [albumId]
  );

  const album = albumResult.rows[0];
  album.photos = photosResult.rows;
  return album;
}

/**
 * Create a new album.
 * @param {Object} data - { title, description, event_date, is_public }
 * @returns {Promise<Object>}
 */
async function createAlbum({ title, description, event_date, is_public = true }) {
  if (!title) {
    const err = new Error('Album title is required');
    err.status = 400;
    throw err;
  }

  const result = await pool.query(`
    INSERT INTO albums (title, description, event_date, is_public)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `, [title, description, event_date || null, is_public]);

  return result.rows[0];
}

/**
 * Update an album.
 * @param {number} albumId
 * @param {Object} data - { title, description, event_date, is_public }
 * @returns {Promise<Object|null>}
 */
async function updateAlbum(albumId, { title, description, event_date, is_public }) {
  const result = await pool.query(`
    UPDATE albums
    SET title = $1, description = $2, event_date = $3, is_public = $4
    WHERE id = $5
    RETURNING *
  `, [title, description, event_date, is_public, albumId]);

  return result.rows[0] || null;
}

/**
 * Delete an album.
 * @param {number} albumId
 * @returns {Promise<Object|null>} Deleted album or null
 */
async function deleteAlbum(albumId) {
  const result = await pool.query('DELETE FROM albums WHERE id = $1 RETURNING *', [albumId]);
  return result.rows[0] || null;
}

/**
 * Set album cover photo.
 * @param {number} albumId
 * @param {number} photoId
 * @returns {Promise<Object|null>}
 */
async function setAlbumCover(albumId, photoId) {
  const result = await pool.query(`
    UPDATE albums SET cover_photo_id = $1 WHERE id = $2 RETURNING *
  `, [photoId, albumId]);

  return result.rows[0] || null;
}

// ── Photos ─────────────────────────────────────────────

/**
 * Insert a photo record into the database.
 * @param {Object} photoData - Processed photo data
 * @returns {Promise<Object>}
 */
async function insertPhoto({ album_id, filename, original_name, file_path, file_size, mime_type, width, height, caption }) {
  const result = await pool.query(`
    INSERT INTO photos (album_id, filename, original_name, file_path, file_size, mime_type, width, height, caption)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `, [album_id, filename, original_name, file_path, file_size, mime_type, width, height, caption || null]);

  return result.rows[0];
}

/**
 * Get a single photo with its tags.
 * @param {number} photoId
 * @returns {Promise<Object|null>}
 */
async function getPhotoWithTags(photoId) {
  const result = await pool.query(`
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
  `, [photoId]);

  return result.rows[0] || null;
}

/**
 * Get a photo by ID and album ID.
 * @param {number} photoId
 * @param {number} albumId
 * @returns {Promise<Object|null>}
 */
async function getPhotoByIdAndAlbum(photoId, albumId) {
  const result = await pool.query(
    'SELECT * FROM photos WHERE id = $1 AND album_id = $2',
    [photoId, albumId]
  );
  return result.rows[0] || null;
}

/**
 * Delete a photo.
 * @param {number} photoId
 * @returns {Promise<Object|null>} Deleted photo or null
 */
async function deletePhoto(photoId) {
  const result = await pool.query('DELETE FROM photos WHERE id = $1 RETURNING *', [photoId]);
  return result.rows[0] || null;
}

/**
 * Delete multiple photos by IDs.
 * @param {number[]} photoIds
 * @returns {Promise<number>} Count of deleted photos
 */
async function deletePhotos(photoIds) {
  if (!photoIds || photoIds.length === 0) return 0;
  const result = await pool.query('DELETE FROM photos WHERE id = ANY($1) RETURNING id', [photoIds]);
  return result.rowCount;
}

/**
 * Update a photo's caption.
 * @param {number} photoId
 * @param {string} caption
 * @returns {Promise<Object|null>}
 */
async function updatePhotoCaption(photoId, caption) {
  const result = await pool.query(
    'UPDATE photos SET caption = $1 WHERE id = $2 RETURNING *',
    [caption || null, photoId]
  );
  return result.rows[0] || null;
}

/**
 * Get all photos where a member is tagged.
 * @param {number} memberId
 * @returns {Promise<Array>}
 */
async function getTaggedPhotos(memberId) {
  const result = await pool.query(`
    SELECT p.*, a.title as album_title, a.id as album_id
    FROM photos p
    JOIN photo_tags pt ON p.id = pt.photo_id
    JOIN albums a ON p.album_id = a.id
    WHERE pt.member_id = $1
    ORDER BY p.uploaded_at DESC
  `, [memberId]);

  return result.rows;
}

/**
 * Update photo metadata (rotation, dimensions, edit tracking).
 * @param {number} photoId
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object|null>}
 */
async function updatePhotoMetadata(photoId, updates) {
  const fields = [];
  const values = [];
  let idx = 1;

  for (const [key, val] of Object.entries(updates)) {
    fields.push(`${key} = $${idx++}`);
    values.push(val);
  }

  if (fields.length === 0) return null;

  values.push(photoId);
  const result = await pool.query(
    `UPDATE photos SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );

  return result.rows[0] || null;
}

// ── Photo Tags ─────────────────────────────────────────

/**
 * Format a tag row for API response (parse decimals).
 */
function formatTag(tag) {
  return {
    id: tag.id,
    member_id: tag.member_id,
    member_name: tag.member_name || (tag.first_name
      ? `${tag.first_name} ${tag.last_name}${tag.suffix ? ' ' + tag.suffix : ''}`
      : undefined),
    x_coordinate: tag.x_coordinate ? parseFloat(tag.x_coordinate) : null,
    y_coordinate: tag.y_coordinate ? parseFloat(tag.y_coordinate) : null,
    width: tag.width ? parseFloat(tag.width) : null,
    height: tag.height ? parseFloat(tag.height) : null,
    confidence: tag.confidence ? parseFloat(tag.confidence) : null,
    is_verified: tag.is_verified,
    tagged_by: tag.tagged_by,
    tagged_at: tag.tagged_at,
    photo_id: tag.photo_id
  };
}

/**
 * Add a tag to a photo.
 * @returns {Promise<Object>} Tag with member_name
 */
async function addPhotoTag({ photo_id, member_id, x_coordinate, y_coordinate, width, height, confidence, is_verified, tagged_by }) {
  // Check for duplicate
  const existing = await pool.query(
    'SELECT id FROM photo_tags WHERE photo_id = $1 AND member_id = $2',
    [photo_id, member_id]
  );

  if (existing.rows.length > 0) {
    const err = new Error('Member is already tagged in this photo');
    err.status = 400;
    throw err;
  }

  const result = await pool.query(`
    INSERT INTO photo_tags (photo_id, member_id, x_coordinate, y_coordinate, width, height, confidence, is_verified, tagged_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `, [photo_id, member_id, x_coordinate, y_coordinate, width, height, confidence, is_verified, tagged_by]);

  // Get member name
  const memberResult = await pool.query(
    'SELECT first_name, last_name, suffix FROM members WHERE id = $1',
    [member_id]
  );
  const member = memberResult.rows[0];

  const tag = result.rows[0];
  return formatTag({
    ...tag,
    member_name: `${member.first_name} ${member.last_name}${member.suffix ? ' ' + member.suffix : ''}`
  });
}

/**
 * Get all tags for a photo.
 * @param {number} photoId
 * @returns {Promise<Array>}
 */
async function getPhotoTags(photoId) {
  const result = await pool.query(`
    SELECT pt.*, m.first_name, m.last_name, m.suffix, m.photo_url
    FROM photo_tags pt
    JOIN members m ON pt.member_id = m.id
    WHERE pt.photo_id = $1
    ORDER BY pt.tagged_at DESC
  `, [photoId]);

  return result.rows.map(formatTag);
}

/**
 * Update a photo tag.
 * @param {number} tagId
 * @param {Object} updates
 * @returns {Promise<Object|null>} Updated tag with member_name
 */
async function updatePhotoTag(tagId, updates) {
  const fields = [];
  const values = [];
  let idx = 1;

  for (const key of ['is_verified', 'x_coordinate', 'y_coordinate', 'width', 'height', 'confidence']) {
    if (updates[key] !== undefined) {
      fields.push(`${key} = $${idx++}`);
      values.push(updates[key]);
    }
  }

  if (fields.length === 0) {
    const err = new Error('No fields to update');
    err.status = 400;
    throw err;
  }

  values.push(tagId);
  const result = await pool.query(
    `UPDATE photo_tags SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );

  if (result.rows.length === 0) return null;

  const tag = result.rows[0];
  const memberResult = await pool.query(
    'SELECT first_name, last_name, suffix FROM members WHERE id = $1',
    [tag.member_id]
  );
  const member = memberResult.rows[0];

  return formatTag({
    ...tag,
    member_name: `${member.first_name} ${member.last_name}${member.suffix ? ' ' + member.suffix : ''}`
  });
}

/**
 * Delete a photo tag.
 * @param {number} tagId
 * @returns {Promise<Object|null>} Deleted tag or null
 */
async function deletePhotoTag(tagId) {
  const result = await pool.query('DELETE FROM photo_tags WHERE id = $1 RETURNING *', [tagId]);
  return result.rows[0] || null;
}

module.exports = {
  // Albums
  getAllAlbums,
  getAlbumById,
  createAlbum,
  updateAlbum,
  deleteAlbum,
  setAlbumCover,
  // Photos
  insertPhoto,
  getPhotoWithTags,
  getPhotoByIdAndAlbum,
  deletePhoto,
  deletePhotos,
  updatePhotoCaption,
  getTaggedPhotos,
  updatePhotoMetadata,
  // Tags
  formatTag,
  addPhotoTag,
  getPhotoTags,
  updatePhotoTag,
  deletePhotoTag
};
