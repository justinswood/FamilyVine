/**
 * Relationship Service
 * Handles business logic for relationship operations
 */

const pool = require('../config/database');
const {
  RELATIONSHIP_MAPPING,
  RELATIONSHIP_TYPES,
  getInverseRelationshipType,
  isValidRelationshipType
} = require('../constants/relationships');
const logger = require('../config/logger');

/**
 * Get the inverse relationship based on gender
 * @param {string} sourceType - Source relationship type
 * @param {number} member1_id - ID of first member
 * @param {number} member2_id - ID of second member (whose gender determines inverse)
 * @returns {Promise<string|null>} Inverse relationship type or null
 */
async function getInverseRelationship(sourceType, member1_id, member2_id) {
  const mapping = RELATIONSHIP_MAPPING[sourceType];
  if (!mapping) return null;

  try {
    // Get the gender of the target member (the one who will have the inverse relationship)
    const result = await pool.query('SELECT gender FROM members WHERE id = $1', [member2_id]);
    const gender = result.rows[0]?.gender;

    // Return the specific inverse based on gender
    if (gender && mapping.specific_inverse[gender]) {
      return mapping.specific_inverse[gender];
    }

    // Fallback to generic inverse if gender is not specified or mapping doesn't exist
    return mapping.inverse;
  } catch (error) {
    logger.error('Error getting inverse relationship:', error);
    return mapping.inverse;
  }
}

/**
 * Get all relationships
 * @returns {Promise<Array>} Array of relationship objects with member details
 */
async function getAllRelationships() {
  const query = `
    SELECT
      r.*,
      m1.first_name as member_first_name,
      m1.last_name as member_last_name,
      m1.gender as member_gender,
      m2.first_name as related_first_name,
      m2.last_name as related_last_name,
      m2.gender as related_gender
    FROM relationships r
    JOIN members m1 ON r.member1_id = m1.id
    JOIN members m2 ON r.member2_id = m2.id
    WHERE r.relationship_type = ANY($1)
    ORDER BY r.created_at DESC
  `;

  const result = await pool.query(query, [RELATIONSHIP_TYPES]);
  return result.rows;
}

/**
 * Get relationships for a specific member
 * @param {number} memberId - Member ID
 * @returns {Promise<Array>} Array of relationships (both outgoing and incoming)
 */
async function getMemberRelationships(memberId) {
  const query = `
    SELECT
      r.*,
      m2.first_name as related_first_name,
      m2.last_name as related_last_name,
      m2.photo_url as related_photo_url,
      m2.gender as related_gender,
      'outgoing' as direction
    FROM relationships r
    JOIN members m2 ON r.member2_id = m2.id
    WHERE r.member1_id = $1 AND r.relationship_type = ANY($2)

    UNION ALL

    SELECT
      r.*,
      m1.first_name as related_first_name,
      m1.last_name as related_last_name,
      m1.photo_url as related_photo_url,
      m1.gender as related_gender,
      'incoming' as direction
    FROM relationships r
    JOIN members m1 ON r.member1_id = m1.id
    WHERE r.member2_id = $1 AND r.relationship_type = ANY($2)

    ORDER BY relationship_type, created_at DESC
  `;

  const result = await pool.query(query, [memberId, RELATIONSHIP_TYPES]);
  return result.rows;
}

/**
 * Create a new relationship
 * @param {number} member1_id - ID of first member
 * @param {number} member2_id - ID of second member
 * @param {string} relationshipType - Type of relationship
 * @returns {Promise<Object>} Created relationship object
 */
async function createRelationship(member1_id, member2_id, relationshipType) {
  if (!isValidRelationshipType(relationshipType)) {
    throw new Error(`Invalid relationship type: ${relationshipType}`);
  }

  const query = `
    INSERT INTO relationships (member1_id, member2_id, relationship_type)
    VALUES ($1, $2, $3)
    RETURNING *
  `;

  const result = await pool.query(query, [member1_id, member2_id, relationshipType]);
  return result.rows[0];
}

/**
 * Delete a relationship
 * @param {number} relationshipId - Relationship ID
 * @returns {Promise<boolean>} True if deleted successfully
 */
async function deleteRelationship(relationshipId) {
  const query = 'DELETE FROM relationships WHERE id = $1';
  const result = await pool.query(query, [relationshipId]);
  return result.rowCount > 0;
}

/**
 * Sync child to union_children table
 * @param {number} parentId - Parent member ID
 * @param {number} childId - Child member ID
 * @returns {Promise<boolean>} True if synced successfully
 */
async function syncChildToUnion(parentId, childId) {
  try {
    // Find a union where this parent is a partner
    const unionResult = await pool.query(
      'SELECT id FROM unions WHERE partner1_id = $1 OR partner2_id = $1 LIMIT 1',
      [parentId]
    );

    if (unionResult.rows.length === 0) {
      logger.debug(`No union found for parent ${parentId} - child will not appear in tree until union is created`);
      return false;
    }

    const unionId = unionResult.rows[0].id;

    // Check if child is already in union_children
    const existingChild = await pool.query(
      'SELECT id FROM union_children WHERE union_id = $1 AND child_id = $2',
      [unionId, childId]
    );

    if (existingChild.rows.length > 0) {
      logger.debug(`Child ${childId} already exists in union ${unionId}`);
      return true;
    }

    // Add child to union_children
    await pool.query(
      'INSERT INTO union_children (union_id, child_id) VALUES ($1, $2)',
      [unionId, childId]
    );

    logger.info(`Added child ${childId} to union ${unionId}`);
    return true;
  } catch (error) {
    logger.error('Error syncing child to union:', error);
    return false;
  }
}

module.exports = {
  getInverseRelationship,
  getAllRelationships,
  getMemberRelationships,
  createRelationship,
  deleteRelationship,
  syncChildToUnion,
  RELATIONSHIP_TYPES,
  RELATIONSHIP_MAPPING
};
