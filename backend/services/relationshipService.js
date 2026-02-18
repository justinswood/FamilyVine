/**
 * Relationship Service
 * Handles all business logic for relationship operations including
 * bidirectional relationships, union sync, and re-parenting.
 */

const pool = require('../config/database');
const {
  RELATIONSHIP_MAPPING,
  RELATIONSHIP_TYPES,
  isValidRelationshipType
} = require('../constants/relationships');
const logger = require('../config/logger');

/**
 * Get the inverse relationship based on gender of the source member.
 * Accepts optional queryRunner to participate in caller's transaction.
 * @param {string} sourceType - The relationship type being created
 * @param {number} member1_id - ID of the member who has the relationship
 * @param {number} member2_id - ID of the related member (whose gender determines inverse)
 * @param {Object} queryRunner - Database client or pool (default: pool)
 * @returns {Promise<string|null>} Inverse relationship type
 */
async function getInverseRelationship(sourceType, member1_id, member2_id, queryRunner = pool) {
  const mapping = RELATIONSHIP_MAPPING[sourceType];
  if (!mapping) return null;

  try {
    const result = await queryRunner.query('SELECT gender FROM members WHERE id = $1', [member2_id]);
    const gender = result.rows[0]?.gender;

    if (gender && mapping.specific_inverse[gender]) {
      return mapping.specific_inverse[gender];
    }

    return mapping.inverse;
  } catch (error) {
    logger.error('Error getting inverse relationship:', error);
    return mapping.inverse;
  }
}

/**
 * Clean up old parent relationships when re-parenting a child.
 * Removes the child from the old parent's union and deletes old parent relationships.
 * @param {number} childId - Child member ID
 * @param {number} newParentId - New parent member ID
 * @param {string} parentType - 'father' or 'mother'
 * @param {Object} queryRunner - Database client or pool (default: pool)
 */
async function cleanupOldParent(childId, newParentId, parentType, queryRunner = pool) {
  try {
    const oldParentRels = await queryRunner.query(
      `SELECT r.id, r.member1_id as old_parent_id
       FROM relationships r
       WHERE r.member2_id = $1 AND r.relationship_type = $2 AND r.member1_id != $3`,
      [childId, parentType, newParentId]
    );

    if (oldParentRels.rows.length === 0) return;

    for (const rel of oldParentRels.rows) {
      const oldParentId = rel.old_parent_id;
      logger.info(`Re-parenting: removing old ${parentType} ${oldParentId} for child ${childId}`);

      // Remove child from old parent's unions
      const oldUnions = await queryRunner.query(
        `SELECT u.id FROM unions u
         WHERE u.partner1_id = $1 OR u.partner2_id = $1`,
        [oldParentId]
      );

      for (const union of oldUnions.rows) {
        await queryRunner.query(
          'DELETE FROM union_children WHERE union_id = $1 AND child_id = $2',
          [union.id, childId]
        );
        logger.debug(`Removed child ${childId} from old union ${union.id}`);
      }

      // Remove old parent relationship and its inverse
      await queryRunner.query(
        'DELETE FROM relationships WHERE member1_id = $1 AND member2_id = $2 AND relationship_type = $3',
        [oldParentId, childId, parentType]
      );
      await queryRunner.query(
        `DELETE FROM relationships WHERE member1_id = $1 AND member2_id = $2
         AND relationship_type IN ('son', 'daughter')`,
        [childId, oldParentId]
      );
      logger.info(`Cleaned up old ${parentType} relationship: ${oldParentId} -> ${childId}`);
    }
  } catch (error) {
    logger.error('Error cleaning up old parent:', error);
    throw error;
  }
}

/**
 * Sync a child to the union_children table. Creates a single-parent union
 * with an Unknown Parent placeholder if no union exists for the parent.
 * @param {number} parentId - Parent member ID
 * @param {number} childId - Child member ID
 * @param {Object} queryRunner - Database client or pool (default: pool)
 * @returns {Promise<boolean>} True if synced successfully
 */
async function syncChildToUnion(parentId, childId, queryRunner = pool) {
  try {
    const unionResult = await queryRunner.query(
      'SELECT id FROM unions WHERE partner1_id = $1 OR partner2_id = $1 LIMIT 1',
      [parentId]
    );

    let unionId;

    if (unionResult.rows.length === 0) {
      logger.info(`No union found for parent ${parentId} - creating single-parent union`);

      let unknownParentResult = await queryRunner.query(
        `SELECT id FROM members WHERE first_name = 'Unknown' AND last_name = 'Parent' LIMIT 1`
      );

      let unknownParentId;
      if (unknownParentResult.rows.length === 0) {
        const createResult = await queryRunner.query(
          `INSERT INTO members (first_name, last_name, gender, is_alive)
           VALUES ('Unknown', 'Parent', 'Male', false)
           RETURNING id`
        );
        unknownParentId = createResult.rows[0].id;
        logger.info(`Created Unknown Parent placeholder with ID ${unknownParentId}`);
      } else {
        unknownParentId = unknownParentResult.rows[0].id;
      }

      const newUnionResult = await queryRunner.query(
        `INSERT INTO unions (partner1_id, partner2_id, union_type, is_single_parent, is_visible_on_tree, notes)
         VALUES ($1, $2, 'single-parent', true, false, 'Auto-created single-parent union')
         RETURNING id`,
        [parentId, unknownParentId]
      );

      unionId = newUnionResult.rows[0].id;
      logger.info(`Created single-parent union ${unionId} for parent ${parentId}`);
    } else {
      unionId = unionResult.rows[0].id;
    }

    const existingChild = await queryRunner.query(
      'SELECT id FROM union_children WHERE union_id = $1 AND child_id = $2',
      [unionId, childId]
    );

    if (existingChild.rows.length > 0) {
      logger.debug(`Child ${childId} already in union ${unionId}`);
      return true;
    }

    const orderResult = await queryRunner.query(
      'SELECT COALESCE(MAX(birth_order), 0) + 1 as next_order FROM union_children WHERE union_id = $1',
      [unionId]
    );
    const nextOrder = orderResult.rows[0].next_order;

    await queryRunner.query(
      'INSERT INTO union_children (union_id, child_id, birth_order, is_biological) VALUES ($1, $2, $3, true)',
      [unionId, childId, nextOrder]
    );

    logger.info(`Added child ${childId} to union ${unionId}`, { birth_order: nextOrder });
    return true;
  } catch (error) {
    logger.error('Error syncing child to union:', error);
    throw error;
  }
}

/**
 * Get all relationships with member details.
 * @returns {Promise<Array>} Array of relationship objects
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
      m2.suffix as related_suffix,
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
 * Get all relationships for a specific member (both directions).
 * @param {number} memberId - Member ID
 * @returns {Promise<Array>} Array of relationships with direction info
 */
async function getMemberRelationships(memberId) {
  const query = `
    SELECT
      r.*,
      m2.first_name as related_first_name,
      m2.last_name as related_last_name,
      m2.suffix as related_suffix,
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
      m1.suffix as related_suffix,
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
 * Check if a relationship already exists.
 * @param {number} member1_id
 * @param {number} member2_id
 * @param {string} relationship_type
 * @returns {Promise<boolean>}
 */
async function relationshipExists(member1_id, member2_id, relationship_type) {
  const result = await pool.query(
    'SELECT id FROM relationships WHERE member1_id = $1 AND member2_id = $2 AND relationship_type = $3',
    [member1_id, member2_id, relationship_type]
  );
  return result.rows.length > 0;
}

/**
 * Create a relationship with automatic inverse, union sync, and re-parenting.
 * All operations are wrapped in a single transaction.
 * @param {number} member1_id - Source member ID
 * @param {number} member2_id - Target member ID
 * @param {string} relationship_type - Relationship type
 * @returns {Promise<Object>} Created relationship object
 * @throws {Error} If validation fails or DB error occurs
 */
async function createRelationship(member1_id, member2_id, relationship_type) {
  if (!isValidRelationshipType(relationship_type)) {
    const error = new Error(`Invalid relationship type: ${relationship_type}`);
    error.status = 400;
    throw error;
  }

  // Pre-transaction read checks (can use pool)
  const exists = await relationshipExists(member1_id, member2_id, relationship_type);
  if (exists) {
    const error = new Error('Relationship already exists');
    error.status = 400;
    throw error;
  }

  const [member1Info, member2Info] = await Promise.all([
    pool.query('SELECT first_name, gender FROM members WHERE id = $1', [member1_id]),
    pool.query('SELECT first_name, gender FROM members WHERE id = $1', [member2_id])
  ]);

  logger.debug('Creating relationship', {
    member1: `${member1Info.rows[0]?.first_name} (${member1Info.rows[0]?.gender})`,
    relationshipType: relationship_type,
    member2: `${member2Info.rows[0]?.first_name} (${member2Info.rows[0]?.gender})`
  });

  const client = await pool.connect();
  let createdRelationship;
  try {
    await client.query('BEGIN');

    // Insert the primary relationship
    const result = await client.query(
      'INSERT INTO relationships (member1_id, member2_id, relationship_type) VALUES ($1, $2, $3) RETURNING *',
      [member1_id, member2_id, relationship_type]
    );
    createdRelationship = result.rows[0];

    // Create inverse relationship
    const inverseType = await getInverseRelationship(relationship_type, member1_id, member2_id, client);

    logger.debug('Creating inverse relationship', {
      member2: member2Info.rows[0]?.first_name,
      inverseType,
      member1: member1Info.rows[0]?.first_name
    });

    if (inverseType && RELATIONSHIP_TYPES.includes(inverseType)) {
      const existingInverse = await client.query(
        'SELECT id FROM relationships WHERE member1_id = $1 AND member2_id = $2 AND relationship_type = $3',
        [member2_id, member1_id, inverseType]
      );

      if (existingInverse.rows.length === 0) {
        await client.query(
          'INSERT INTO relationships (member1_id, member2_id, relationship_type) VALUES ($1, $2, $3)',
          [member2_id, member1_id, inverseType]
        );
        logger.debug(`Created inverse relationship: ${inverseType}`);
      }
    }

    // Sync to union_children for parent-child relationships
    if (['father', 'mother'].includes(relationship_type)) {
      await cleanupOldParent(member2_id, member1_id, relationship_type, client);
      await syncChildToUnion(member1_id, member2_id, client);
    } else if (['son', 'daughter'].includes(relationship_type)) {
      const parentGender = member2Info.rows[0]?.gender;
      const parentType = parentGender === 'Female' ? 'mother' : 'father';
      await cleanupOldParent(member1_id, member2_id, parentType, client);
      await syncChildToUnion(member2_id, member1_id, client);
    }

    // Auto-create union for spouse relationships
    if (['husband', 'wife'].includes(relationship_type)) {
      const partner1 = Math.min(member1_id, member2_id);
      const partner2 = Math.max(member1_id, member2_id);

      const existingUnion = await client.query(
        'SELECT id FROM unions WHERE partner1_id = $1 AND partner2_id = $2',
        [partner1, partner2]
      );

      if (existingUnion.rows.length === 0) {
        await client.query(
          'INSERT INTO unions (partner1_id, partner2_id, union_type, is_primary) VALUES ($1, $2, $3, true)',
          [partner1, partner2, 'marriage']
        );
        logger.info(`Auto-created union for spouse relationship: ${partner1} <-> ${partner2}`);
      }
    }

    await client.query('COMMIT');
  } catch (txErr) {
    await client.query('ROLLBACK');
    throw txErr;
  } finally {
    client.release();
  }

  return createdRelationship;
}

/**
 * Delete a relationship and its inverse. All operations are transactional.
 * @param {number} relationshipId - Relationship ID to delete
 * @returns {Promise<void>}
 * @throws {Error} If relationship not found or DB error
 */
async function deleteRelationship(relationshipId) {
  // Get relationship details (pre-transaction read)
  const relationship = await pool.query(
    `SELECT r.*, m1.gender as member1_gender, m2.gender as member2_gender
     FROM relationships r
     JOIN members m1 ON r.member1_id = m1.id
     JOIN members m2 ON r.member2_id = m2.id
     WHERE r.id = $1`,
    [relationshipId]
  );

  if (relationship.rows.length === 0) {
    const error = new Error('Relationship not found');
    error.status = 404;
    throw error;
  }

  const { member1_id, member2_id, relationship_type } = relationship.rows[0];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query('DELETE FROM relationships WHERE id = $1', [relationshipId]);

    const inverseType = await getInverseRelationship(relationship_type, member1_id, member2_id, client);
    if (inverseType && RELATIONSHIP_TYPES.includes(inverseType)) {
      await client.query(
        'DELETE FROM relationships WHERE member1_id = $1 AND member2_id = $2 AND relationship_type = $3',
        [member2_id, member1_id, inverseType]
      );
    }

    await client.query('COMMIT');
  } catch (txErr) {
    await client.query('ROLLBACK');
    throw txErr;
  } finally {
    client.release();
  }
}

/**
 * Get family tree data for visualization starting from a member.
 * @param {number} memberId - Root member ID
 * @param {number} maxDepth - Maximum traversal depth (default: 3)
 * @returns {Promise<{nodes: Array, edges: Array}>}
 */
async function getTreeData(memberId, maxDepth = 3) {
  // Use recursive CTE to fetch all connected members in 2 queries instead of O(2^depth)
  const traversalResult = await pool.query(`
    WITH RECURSIVE tree AS (
      SELECT member1_id, member2_id, relationship_type, 0 as depth
      FROM relationships
      WHERE member1_id = $1 AND relationship_type = ANY($2)
      UNION
      SELECT r.member1_id, r.member2_id, r.relationship_type, t.depth + 1
      FROM relationships r
      INNER JOIN tree t ON r.member1_id = t.member2_id
      WHERE t.depth < $3
        AND r.relationship_type = ANY($2)
    )
    SELECT DISTINCT member1_id, member2_id, relationship_type FROM tree
  `, [memberId, RELATIONSHIP_TYPES, maxDepth]);

  // Collect all unique member IDs
  const memberIds = new Set([memberId]);
  const edges = [];
  for (const row of traversalResult.rows) {
    memberIds.add(row.member1_id);
    memberIds.add(row.member2_id);
    edges.push({
      from: row.member1_id,
      to: row.member2_id,
      label: row.relationship_type
    });
  }

  // Batch-fetch all members in a single query
  const membersResult = await pool.query(
    'SELECT * FROM members WHERE id = ANY($1)',
    [[...memberIds]]
  );

  const nodes = membersResult.rows.map(member => ({
    id: member.id,
    label: `${member.first_name} ${member.last_name}${member.suffix ? ' ' + member.suffix : ''}`,
    ...member
  }));

  return { nodes, edges };
}

/**
 * Create spouse relationships and union between two members.
 * Used by member creation/update when marriage info is provided.
 * @param {number} memberId - Member ID
 * @param {number} spouseId - Spouse member ID
 * @param {string} memberGender - Gender of the member
 * @param {string} marriageDate - Parsed marriage date (YYYY-MM-DD or null)
 * @param {Object} queryRunner - Database client for transaction participation
 */
async function createSpouseRelationshipsAndUnion(memberId, spouseId, memberGender, marriageDate, queryRunner) {
  // Order partner IDs (unions table requires partner1_id < partner2_id)
  const partner1 = Math.min(memberId, spouseId);
  const partner2 = Math.max(memberId, spouseId);

  // Create or update union
  const existingUnion = await queryRunner.query(
    'SELECT id FROM unions WHERE partner1_id = $1 AND partner2_id = $2',
    [partner1, partner2]
  );

  if (existingUnion.rows.length === 0) {
    await queryRunner.query(
      'INSERT INTO unions (partner1_id, partner2_id, union_type, union_date, is_primary) VALUES ($1, $2, $3, $4, true)',
      [partner1, partner2, 'marriage', marriageDate]
    );
    logger.debug('Created union', { partner1, partner2 });
  } else if (marriageDate) {
    await queryRunner.query(
      'UPDATE unions SET union_date = $1 WHERE partner1_id = $2 AND partner2_id = $3',
      [marriageDate, partner1, partner2]
    );
    logger.debug('Updated union date', { partner1, partner2 });
  }

  // Get spouse gender for relationship type
  const spouseInfo = await queryRunner.query('SELECT gender FROM members WHERE id = $1', [spouseId]);
  const spouseGender = spouseInfo.rows[0]?.gender;

  const memberRelType = memberGender === 'Male' ? 'husband' : 'wife';
  const spouseRelType = spouseGender === 'Male' ? 'husband' : 'wife';

  // Member -> Spouse relationship
  const existingRel1 = await queryRunner.query(
    'SELECT id FROM relationships WHERE member1_id = $1 AND member2_id = $2 AND relationship_type IN ($3, $4)',
    [memberId, spouseId, 'husband', 'wife']
  );
  if (existingRel1.rows.length === 0) {
    await queryRunner.query(
      'INSERT INTO relationships (member1_id, member2_id, relationship_type) VALUES ($1, $2, $3)',
      [memberId, spouseId, memberRelType]
    );
  }

  // Spouse -> Member relationship
  const existingRel2 = await queryRunner.query(
    'SELECT id FROM relationships WHERE member1_id = $1 AND member2_id = $2 AND relationship_type IN ($3, $4)',
    [spouseId, memberId, 'husband', 'wife']
  );
  if (existingRel2.rows.length === 0) {
    await queryRunner.query(
      'INSERT INTO relationships (member1_id, member2_id, relationship_type) VALUES ($1, $2, $3)',
      [spouseId, memberId, spouseRelType]
    );
  }

  // Marriage data now derived from unions table — no member-level update needed
  logger.debug('Linked spouse via union and relationships', { memberId, spouseId });
}

module.exports = {
  getInverseRelationship,
  cleanupOldParent,
  syncChildToUnion,
  getAllRelationships,
  getMemberRelationships,
  relationshipExists,
  createRelationship,
  deleteRelationship,
  getTreeData,
  createSpouseRelationshipsAndUnion,
  RELATIONSHIP_TYPES,
  RELATIONSHIP_MAPPING
};
