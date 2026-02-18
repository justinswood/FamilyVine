/**
 * Member Service
 * Handles all business logic for member CRUD, search, statistics,
 * and map/migration data.
 */

const pool = require('../config/database');
const logger = require('../config/logger');
const { createSpouseRelationshipsAndUnion } = require('./relationshipService');

/**
 * Parse date strings to YYYY-MM-DD format, handling timezone issues.
 * @param {string} dateStr - Date string input
 * @returns {string|null} Parsed date or null
 */
function parseDate(dateStr) {
  if (!dateStr || dateStr === 'null' || dateStr === 'undefined') return null;

  let dateInput = dateStr.toString();

  if (dateInput.includes('T')) {
    dateInput = dateInput.split('T')[0];
  }

  if (dateInput.includes('Z') || dateInput.match(/[+-]\d{2}:\d{2}$/)) {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  }

  if (dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateInput;
  }

  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (e) {
    logger.warn('Could not parse date', { dateStr });
  }

  return null;
}

/**
 * Validate date format (YYYY-MM-DD).
 * @param {string} dateString
 * @returns {boolean}
 */
function isValidDate(dateString) {
  if (!dateString) return true;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date) && dateString.match(/^\d{4}-\d{2}-\d{2}$/);
}

/**
 * Get all members with optional pagination and filtering.
 * @param {Object} options - Query options
 * @param {number} [options.page] - Page number (enables pagination)
 * @param {number} [options.limit] - Items per page
 * @param {string} [options.is_alive] - Filter by alive status
 * @param {string} [options.gender] - Filter by gender
 * @param {string} [options.sort] - Sort column
 * @param {string} [options.order] - Sort order (asc/desc)
 * @returns {Promise<Array|Object>} Array of members or paginated result
 */
async function getAllMembers(options = {}) {
  const usePagination = options.page !== undefined || options.limit !== undefined;
  const page = Math.max(1, parseInt(options.page) || 1);
  const limit = Math.min(500, Math.max(1, parseInt(options.limit) || 50));
  const offset = (page - 1) * limit;

  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (options.is_alive !== undefined) {
    conditions.push(`m.is_alive = $${paramIndex++}`);
    params.push(options.is_alive === 'true');
  }

  if (options.gender) {
    conditions.push(`m.gender = $${paramIndex++}`);
    params.push(options.gender);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const allowedSorts = ['id', 'first_name', 'last_name', 'birth_date', 'created_at'];
  const sortColumn = 'm.' + (allowedSorts.includes(options.sort) ? options.sort : 'id');
  const sortOrder = (options.order || '').toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  // Derive spouse info from unions table (single source of truth)
  const spouseJoin = `
    LEFT JOIN LATERAL (
      SELECT u.id AS union_id, u.union_date,
        CASE WHEN u.partner1_id = m.id THEN u.partner2_id ELSE u.partner1_id END AS derived_spouse_id
      FROM unions u
      WHERE (u.partner1_id = m.id OR u.partner2_id = m.id)
        AND u.union_type = 'marriage'
        AND u.is_single_parent = false
      ORDER BY u.is_primary DESC, u.created_at DESC
      LIMIT 1
    ) spouse_union ON true
  `;

  const selectClause = `
    SELECT m.*,
      CASE WHEN spouse_union.union_id IS NOT NULL THEN true ELSE false END AS is_married,
      spouse_union.union_date AS marriage_date,
      spouse_union.derived_spouse_id AS spouse_id
    FROM members m
    ${spouseJoin}
  `;

  if (usePagination) {
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM members m ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `${selectClause} ${whereClause} ORDER BY ${sortColumn} ${sortOrder} LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      [...params, limit, offset]
    );

    return {
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  const result = await pool.query(
    `${selectClause} ${whereClause} ORDER BY ${sortColumn} ${sortOrder}`,
    params
  );
  return result.rows;
}

/**
 * Get memory counts (stories + photo tags) for all members.
 * @returns {Promise<Object>} Map of memberId -> { stories, photos }
 */
async function getMemoryCounts() {
  const result = await pool.query(`
    SELECT
      m.id AS member_id,
      COALESCE(s.story_count, 0) AS story_count,
      COALESCE(p.photo_count, 0) AS photo_count
    FROM members m
    LEFT JOIN (
      SELECT member_id, COUNT(*) AS story_count
      FROM story_members
      GROUP BY member_id
    ) s ON s.member_id = m.id
    LEFT JOIN (
      SELECT member_id, COUNT(*) AS photo_count
      FROM photo_tags
      GROUP BY member_id
    ) p ON p.member_id = m.id
    WHERE COALESCE(s.story_count, 0) > 0 OR COALESCE(p.photo_count, 0) > 0
  `);

  const counts = {};
  result.rows.forEach(row => {
    counts[row.member_id] = {
      stories: parseInt(row.story_count),
      photos: parseInt(row.photo_count)
    };
  });
  return counts;
}

/**
 * Search members by name, location, or birth place.
 * @param {string} query - Search query
 * @returns {Promise<Array>} Matching members (max 20)
 */
async function searchMembers(query) {
  if (!query || query.trim().length === 0) return [];

  const searchTerm = `%${query.trim().toLowerCase()}%`;

  const result = await pool.query(`
    SELECT id, first_name, middle_name, last_name, suffix, birth_date, birth_place, photo_url
    FROM members
    WHERE
      LOWER(first_name) LIKE $1 OR
      LOWER(last_name) LIKE $1 OR
      LOWER(middle_name) LIKE $1 OR
      LOWER(CONCAT(first_name, ' ', last_name)) LIKE $1 OR
      LOWER(birth_place) LIKE $1
    ORDER BY
      CASE
        WHEN LOWER(first_name) = LOWER($2) THEN 1
        WHEN LOWER(last_name) = LOWER($2) THEN 2
        WHEN LOWER(CONCAT(first_name, ' ', last_name)) = LOWER($2) THEN 3
        ELSE 4
      END,
      first_name, last_name
    LIMIT 20
  `, [searchTerm, query.trim()]);

  return result.rows;
}

/**
 * Get living members with geocoded coordinates for map display.
 * @returns {Promise<Array>} Location groups with member arrays
 */
async function getLivingWithCoordinates() {
  const result = await pool.query(`
    WITH member_locations AS (
      SELECT
        m.id,
        TRIM(CONCAT(COALESCE(m.first_name, ''), ' ', COALESCE(m.last_name, ''), CASE WHEN m.suffix IS NOT NULL AND m.suffix != '' THEN ' ' || m.suffix ELSE '' END)) as name,
        m.photo_url as photo,
        m.birth_date,
        TRIM(m.location) as location,
        TRIM(m.birth_place) as birth_place
      FROM members m
      WHERE (m.is_alive = true OR m.is_alive IS NULL)
        AND m.death_date IS NULL
        AND m.location IS NOT NULL
        AND TRIM(m.location) != ''
        AND LOWER(COALESCE(m.first_name, '')) NOT LIKE '%unknown%'
    )
    SELECT
      ml.location,
      gc.latitude as lat,
      gc.longitude as lon,
      gc.display_name,
      json_agg(
        json_build_object(
          'id', ml.id,
          'name', ml.name,
          'photo', ml.photo,
          'birth_date', ml.birth_date,
          'birth_place', ml.birth_place
        )
      ) as members
    FROM member_locations ml
    LEFT JOIN geocode_cache gc ON LOWER(TRIM(ml.location)) = gc.location_string
    WHERE gc.latitude IS NOT NULL
    GROUP BY ml.location, gc.latitude, gc.longitude, gc.display_name
    ORDER BY ml.location
  `);

  return result.rows;
}

/**
 * Get migration paths (birth_place -> current location) with coordinates.
 * @returns {Promise<Array>} Members with birth and current location coords
 */
async function getMigrationPaths() {
  const result = await pool.query(`
    SELECT
      m.id,
      TRIM(CONCAT(COALESCE(m.first_name, ''), ' ', COALESCE(m.last_name, ''), CASE WHEN m.suffix IS NOT NULL AND m.suffix != '' THEN ' ' || m.suffix ELSE '' END)) as name,
      TRIM(m.birth_place) as birth_place,
      TRIM(m.location) as current_location,
      gc_birth.latitude as birth_lat,
      gc_birth.longitude as birth_lon,
      gc_current.latitude as current_lat,
      gc_current.longitude as current_lon
    FROM members m
    LEFT JOIN geocode_cache gc_birth ON LOWER(TRIM(m.birth_place)) = gc_birth.location_string
    LEFT JOIN geocode_cache gc_current ON LOWER(TRIM(m.location)) = gc_current.location_string
    WHERE (m.is_alive = true OR m.is_alive IS NULL)
      AND m.death_date IS NULL
      AND m.birth_place IS NOT NULL AND TRIM(m.birth_place) != ''
      AND m.location IS NOT NULL AND TRIM(m.location) != ''
      AND LOWER(TRIM(m.birth_place)) != LOWER(TRIM(m.location))
      AND gc_birth.latitude IS NOT NULL
      AND gc_current.latitude IS NOT NULL
      AND LOWER(COALESCE(m.first_name, '')) NOT LIKE '%unknown%'
    ORDER BY m.id
  `);

  return result.rows;
}

/**
 * Get member by ID.
 * @param {number} memberId
 * @returns {Promise<Object|null>} Member or null
 */
async function getMemberById(memberId) {
  const result = await pool.query(`
    SELECT m.*,
      CASE WHEN spouse_union.union_id IS NOT NULL THEN true ELSE false END AS is_married,
      spouse_union.union_date AS marriage_date,
      spouse_union.derived_spouse_id AS spouse_id
    FROM members m
    LEFT JOIN LATERAL (
      SELECT u.id AS union_id, u.union_date,
        CASE WHEN u.partner1_id = m.id THEN u.partner2_id ELSE u.partner1_id END AS derived_spouse_id
      FROM unions u
      WHERE (u.partner1_id = m.id OR u.partner2_id = m.id)
        AND u.union_type = 'marriage'
        AND u.is_single_parent = false
      ORDER BY u.is_primary DESC, u.created_at DESC
      LIMIT 1
    ) spouse_union ON true
    WHERE m.id = $1
  `, [memberId]);
  return result.rows[0] || null;
}

/**
 * Create a new member with optional spouse linking.
 * Handles transaction for member insert + spouse/union/relationship creation.
 * @param {Object} memberData - Member fields from request body
 * @param {string|null} photoUrl - Processed photo URL (or null)
 * @returns {Promise<Object>} Created member
 */
async function createMember(memberData, photoUrl) {
  const {
    first_name, middle_name, last_name, nickname, suffix, relationship,
    gender, is_alive, birth_date, death_date,
    birth_place, death_place, location,
    occupation, pronouns, email, phone,
    is_married, marriage_date, spouse_id
  } = memberData;

  const client = await pool.connect();
  let newMember;
  try {
    await client.query('BEGIN');

    const result = await client.query(
      'INSERT INTO members (first_name, middle_name, last_name, nickname, suffix, relationship, gender, is_alive, birth_date, death_date, birth_place, death_place, location, occupation, pronouns, email, phone, photo_url) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *',
      [
        first_name, middle_name, last_name, nickname || null, suffix || null, relationship, gender, is_alive === 'true',
        parseDate(birth_date), parseDate(death_date),
        birth_place || null, death_place || null,
        location || null, occupation || null, pronouns || null, email || null, phone || null, photoUrl
      ]
    );

    newMember = result.rows[0];
    const newMemberId = newMember.id;
    const isMarriedBool = is_married === 'true' || is_married === true;
    const spouseIdInt = spouse_id ? parseInt(spouse_id) : null;

    if (isMarriedBool && spouseIdInt) {
      logger.debug('New member married — creating union', { newMemberId, spouseId: spouseIdInt });
      // Union creation is the single source of truth for marriage data
      await createSpouseRelationshipsAndUnion(newMemberId, spouseIdInt, gender, parseDate(marriage_date), client);
    }

    await client.query('COMMIT');
  } catch (txErr) {
    await client.query('ROLLBACK');
    throw txErr;
  } finally {
    client.release();
  }

  return newMember;
}

/**
 * Update an existing member with optional spouse linking.
 * @param {number} memberId
 * @param {Object} memberData - Updated member fields
 * @param {string|null} photoUrl - Processed photo URL (or null/existing)
 * @returns {Promise<Object>} Updated member
 */
async function updateMember(memberId, memberData, photoUrl) {
  const {
    first_name, middle_name, last_name, nickname, suffix, relationship,
    gender, is_alive, birth_date, death_date,
    birth_place, death_place, location,
    occupation, pronouns, email, phone,
    is_married, marriage_date, spouse_id
  } = memberData;

  const spouseIdInt = spouse_id ? parseInt(spouse_id) : null;
  const isMarriedBool = is_married === 'true' || is_married === true;

  const client = await pool.connect();
  let updatedMember;
  try {
    await client.query('BEGIN');

    const result = await client.query(
      'UPDATE members SET first_name = $1, middle_name = $2, last_name = $3, nickname = $4, suffix = $5, relationship = $6, gender = $7, is_alive = $8, birth_date = $9, death_date = $10, birth_place = $11, death_place = $12, location = $13, occupation = $14, pronouns = $15, email = $16, phone = $17, photo_url = $18 WHERE id = $19 RETURNING *',
      [
        first_name, middle_name, last_name, nickname || null, suffix || null,
        relationship, gender, is_alive === 'true',
        parseDate(birth_date), parseDate(death_date),
        birth_place || null, death_place || null,
        location || null, occupation || null, pronouns || null,
        email || null, phone || null, photoUrl,
        memberId
      ]
    );

    updatedMember = result.rows[0];

    if (isMarriedBool && spouseIdInt) {
      logger.debug('Creating/updating union', { memberId, spouseId: spouseIdInt });
      await createSpouseRelationshipsAndUnion(memberId, spouseIdInt, gender, parseDate(marriage_date), client);
    }

    await client.query('COMMIT');
  } catch (txErr) {
    await client.query('ROLLBACK');
    throw txErr;
  } finally {
    client.release();
  }

  return updatedMember;
}

/**
 * Delete a member by ID.
 * @param {number} memberId
 * @returns {Promise<Object|null>} Deleted member or null if not found
 */
async function deleteMember(memberId) {
  const result = await pool.query('DELETE FROM members WHERE id = $1 RETURNING *', [memberId]);
  return result.rows[0] || null;
}

/**
 * Import members from parsed CSV rows.
 * @param {Array<Object>} rows - Parsed and validated CSV rows
 * @returns {Promise<{imported: Array, errors: Array}>}
 */
async function importFromCSV(rows) {
  const insertedMembers = [];
  const insertErrors = [];
  const BATCH_SIZE = 100;

  // Process in batches for efficiency
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const validMembers = [];
    const valuesList = [];
    const params = [];
    let paramIdx = 1;

    for (const member of batch) {
      try {
        const values = [
          member.first_name, member.middle_name || null, member.last_name,
          member.nickname || null, member.suffix || null, member.gender || null,
          parseDate(member.birth_date), member.birth_place || null,
          parseDate(member.death_date), member.death_place || null,
          member.location || null, member.occupation || null,
          member.email || null, member.phone || null,
          member.is_alive, member.relationship || null, member.pronouns || null
        ];
        const placeholders = values.map((_, j) => `$${paramIdx + j}`).join(', ');
        valuesList.push(`(${placeholders})`);
        params.push(...values);
        validMembers.push(member);
        paramIdx += values.length;
      } catch (error) {
        insertErrors.push({
          member: `${member.first_name} ${member.last_name}`,
          error: error.message
        });
      }
    }

    if (valuesList.length === 0) continue;

    try {
      const result = await pool.query(`
        INSERT INTO members (
          first_name, middle_name, last_name, nickname, suffix, gender, birth_date, birth_place,
          death_date, death_place, location, occupation, email, phone,
          is_alive, relationship, pronouns
        ) VALUES ${valuesList.join(', ')}
        RETURNING id
      `, params);

      result.rows.forEach((row, idx) => {
        insertedMembers.push({
          id: row.id,
          name: `${validMembers[idx].first_name} ${validMembers[idx].last_name}`
        });
      });
    } catch (error) {
      // If batch fails, fall back to individual inserts for this batch
      logger.warn('Batch insert failed, falling back to individual inserts', { error: error.message });
      for (const member of validMembers) {
        try {
          const result = await pool.query(`
            INSERT INTO members (
              first_name, middle_name, last_name, nickname, suffix, gender, birth_date, birth_place,
              death_date, death_place, location, occupation, email, phone,
              is_alive, relationship, pronouns
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
            RETURNING id
          `, [
            member.first_name, member.middle_name || null, member.last_name,
            member.nickname || null, member.suffix || null, member.gender || null,
            parseDate(member.birth_date), member.birth_place || null,
            parseDate(member.death_date), member.death_place || null,
            member.location || null, member.occupation || null,
            member.email || null, member.phone || null,
            member.is_alive, member.relationship || null, member.pronouns || null
          ]);
          insertedMembers.push({ id: result.rows[0].id, name: `${member.first_name} ${member.last_name}` });
        } catch (err) {
          logger.error('Database insert error', { error: err.message });
          insertErrors.push({ member: `${member.first_name} ${member.last_name}`, error: err.message });
        }
      }
    }
  }

  return { imported: insertedMembers, errors: insertErrors };
}

/**
 * Set a tagged photo as a member's profile picture.
 * Verifies the member is tagged in the photo before updating.
 * @param {number} memberId
 * @param {number} photoId
 * @returns {Promise<Object>} Updated member
 * @throws {Error} If member not tagged or photo/member not found
 */
async function setProfilePhotoFromTag(memberId, photoId) {
  const tagCheck = await pool.query(
    'SELECT id FROM photo_tags WHERE photo_id = $1 AND member_id = $2',
    [photoId, memberId]
  );

  if (tagCheck.rows.length === 0) {
    const error = new Error('Member is not tagged in this photo');
    error.status = 400;
    throw error;
  }

  const photoResult = await pool.query(
    'SELECT file_path FROM photos WHERE id = $1',
    [photoId]
  );

  if (photoResult.rows.length === 0) {
    const error = new Error('Photo not found');
    error.status = 404;
    throw error;
  }

  const photoPath = photoResult.rows[0].file_path;
  const result = await pool.query(
    'UPDATE members SET photo_url = $1 WHERE id = $2 RETURNING *',
    [photoPath, memberId]
  );

  if (result.rows.length === 0) {
    const error = new Error('Member not found');
    error.status = 404;
    throw error;
  }

  return result.rows[0];
}

module.exports = {
  parseDate,
  isValidDate,
  getAllMembers,
  getMemoryCounts,
  searchMembers,
  getLivingWithCoordinates,
  getMigrationPaths,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  importFromCSV,
  setProfilePhotoFromTag
};
