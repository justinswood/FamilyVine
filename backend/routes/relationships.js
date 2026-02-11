const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const logger = require('../config/logger');

// Define relationships with explicit inverse mappings
// This is much clearer than trying to calculate them
const RELATIONSHIP_MAPPING = {
  // Parent-Child relationships
  'father': { inverse: 'child', specific_inverse: { 'Male': 'son', 'Female': 'daughter' } },
  'mother': { inverse: 'child', specific_inverse: { 'Male': 'son', 'Female': 'daughter' } },
  'son': { inverse: 'parent', specific_inverse: { 'Male': 'father', 'Female': 'mother' } },
  'daughter': { inverse: 'parent', specific_inverse: { 'Male': 'father', 'Female': 'mother' } },
  
  // Sibling relationships
  'brother': { inverse: 'sibling', specific_inverse: { 'Male': 'brother', 'Female': 'sister' } },
  'sister': { inverse: 'sibling', specific_inverse: { 'Male': 'brother', 'Female': 'sister' } },
  
  // Spouse relationships
  'husband': { inverse: 'spouse', specific_inverse: { 'Male': 'husband', 'Female': 'wife' } },
  'wife': { inverse: 'spouse', specific_inverse: { 'Male': 'husband', 'Female': 'wife' } },
  
  // Extended family
  'uncle': { inverse: 'niece_or_nephew', specific_inverse: { 'Male': 'nephew', 'Female': 'niece' } },
  'aunt': { inverse: 'niece_or_nephew', specific_inverse: { 'Male': 'nephew', 'Female': 'niece' } },
  'niece': { inverse: 'uncle_or_aunt', specific_inverse: { 'Male': 'uncle', 'Female': 'aunt' } },
  'nephew': { inverse: 'uncle_or_aunt', specific_inverse: { 'Male': 'uncle', 'Female': 'aunt' } },
  
  // Cousins
  'cousin': { inverse: 'cousin', specific_inverse: { 'Male': 'cousin', 'Female': 'cousin' } },
  
  // Grandparent-Grandchild relationships
  'grandfather': { inverse: 'grandchild', specific_inverse: { 'Male': 'grandson', 'Female': 'granddaughter' } },
  'grandmother': { inverse: 'grandchild', specific_inverse: { 'Male': 'grandson', 'Female': 'granddaughter' } },
  'grandson': { inverse: 'grandparent', specific_inverse: { 'Male': 'grandfather', 'Female': 'grandmother' } },
  'granddaughter': { inverse: 'grandparent', specific_inverse: { 'Male': 'grandfather', 'Female': 'grandmother' } },
};

// Get all available relationship types
const RELATIONSHIP_TYPES = Object.keys(RELATIONSHIP_MAPPING);

// Get the specific inverse relationship based on gender
const getInverseRelationship = async (sourceType, member1_id, member2_id) => {
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
};

// Get all relationship types
router.get('/types', async (req, res) => {
  res.json(RELATIONSHIP_TYPES.sort());
});

// Get all relationships (needed for visual family tree)
router.get('/', async (req, res) => {
  try {
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
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching all relationships:', error);
    res.status(500).json({ error: 'Failed to fetch relationships' });
  }
});

// Get all relationships for a specific member
router.get('/member/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
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
    
    const result = await pool.query(query, [id, RELATIONSHIP_TYPES]);
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching relationships:', error);
    res.status(500).json({ error: 'Failed to fetch relationships' });
  }
});

// Helper function to clean up old parent when re-parenting a child
// e.g., changing Selena's father from Tommy to Isiah removes Selena from Tommy's union
const cleanupOldParent = async (childId, newParentId, parentType) => {
  try {
    // Find any existing parent of the same type (father/mother) that isn't the new parent
    const oldParentRels = await pool.query(
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
      const oldUnions = await pool.query(
        `SELECT u.id FROM unions u
         WHERE u.partner1_id = $1 OR u.partner2_id = $1`,
        [oldParentId]
      );

      for (const union of oldUnions.rows) {
        await pool.query(
          'DELETE FROM union_children WHERE union_id = $1 AND child_id = $2',
          [union.id, childId]
        );
        logger.debug(`Removed child ${childId} from old union ${union.id}`);
      }

      // Remove old parent relationship and its inverse
      await pool.query(
        'DELETE FROM relationships WHERE member1_id = $1 AND member2_id = $2 AND relationship_type = $3',
        [oldParentId, childId, parentType]
      );
      await pool.query(
        `DELETE FROM relationships WHERE member1_id = $1 AND member2_id = $2
         AND relationship_type IN ('son', 'daughter')`,
        [childId, oldParentId]
      );
      logger.info(`Cleaned up old ${parentType} relationship: ${oldParentId} -> ${childId}`);
    }
  } catch (error) {
    logger.error('Error cleaning up old parent:', error);
    // Don't fail the main operation
  }
};

// Helper function to sync child to union_children table
const syncChildToUnion = async (parentId, childId) => {
  try {
    // Find a union where this parent is a partner
    const unionResult = await pool.query(
      'SELECT id FROM unions WHERE partner1_id = $1 OR partner2_id = $1 LIMIT 1',
      [parentId]
    );

    let unionId;

    if (unionResult.rows.length === 0) {
      // No union found - create a single-parent union automatically
      logger.info(`No union found for parent ${parentId} - creating single-parent union`);

      // Get or create the "Unknown Parent" placeholder member
      let unknownParentResult = await pool.query(
        `SELECT id FROM members WHERE first_name = 'Unknown' AND last_name = 'Parent' LIMIT 1`
      );

      let unknownParentId;
      if (unknownParentResult.rows.length === 0) {
        // Create Unknown Parent placeholder if it doesn't exist
        const createResult = await pool.query(
          `INSERT INTO members (first_name, last_name, gender, is_alive)
           VALUES ('Unknown', 'Parent', 'Male', false)
           RETURNING id`
        );
        unknownParentId = createResult.rows[0].id;
        logger.info(`Created Unknown Parent placeholder with ID ${unknownParentId}`);
      } else {
        unknownParentId = unknownParentResult.rows[0].id;
      }

      // Create single-parent union with Unknown Parent as partner2
      const newUnionResult = await pool.query(
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

    // Check if child is already in this union
    const existingChild = await pool.query(
      'SELECT id FROM union_children WHERE union_id = $1 AND child_id = $2',
      [unionId, childId]
    );

    if (existingChild.rows.length > 0) {
      logger.debug(`Child ${childId} already in union ${unionId}`);
      return true;
    }

    // Get the next birth order
    const orderResult = await pool.query(
      'SELECT COALESCE(MAX(birth_order), 0) + 1 as next_order FROM union_children WHERE union_id = $1',
      [unionId]
    );
    const nextOrder = orderResult.rows[0].next_order;

    // Add child to union_children
    await pool.query(
      'INSERT INTO union_children (union_id, child_id, birth_order, is_biological) VALUES ($1, $2, $3, true)',
      [unionId, childId, nextOrder]
    );

    logger.info(`Added child ${childId} to union ${unionId}`, { birth_order: nextOrder });
    return true;
  } catch (error) {
    logger.error('Error syncing child to union:', error);
    return false;
  }
};

// Add a new relationship
router.post('/', async (req, res) => {
  try {
    const { member1_id, member2_id, relationship_type } = req.body;

    // Validation
    if (!member1_id || !member2_id || !relationship_type) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (member1_id === member2_id) {
      return res.status(400).json({ error: 'Cannot create relationship with self' });
    }

    if (!RELATIONSHIP_TYPES.includes(relationship_type)) {
      return res.status(400).json({ error: 'Invalid relationship type' });
    }

    // Check if relationship already exists
    const existing = await pool.query(
      'SELECT id FROM relationships WHERE member1_id = $1 AND member2_id = $2 AND relationship_type = $3',
      [member1_id, member2_id, relationship_type]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Relationship already exists' });
    }

    // Get member names for debugging
    const [member1Info, member2Info] = await Promise.all([
      pool.query('SELECT first_name, gender FROM members WHERE id = $1', [member1_id]),
      pool.query('SELECT first_name, gender FROM members WHERE id = $1', [member2_id])
    ]);

    logger.debug('Creating relationship', {
      member1: `${member1Info.rows[0]?.first_name} (${member1Info.rows[0]?.gender})`,
      relationshipType: relationship_type,
      member2: `${member2Info.rows[0]?.first_name} (${member2Info.rows[0]?.gender})`
    });

    // Insert the relationship
    const result = await pool.query(
      'INSERT INTO relationships (member1_id, member2_id, relationship_type) VALUES ($1, $2, $3) RETURNING *',
      [member1_id, member2_id, relationship_type]
    );

    // Create the inverse relationship
    const inverseType = await getInverseRelationship(relationship_type, member1_id, member2_id);

    logger.debug('Creating inverse relationship', {
      member2: member2Info.rows[0]?.first_name,
      inverseType,
      member1: member1Info.rows[0]?.first_name
    });

    if (inverseType && RELATIONSHIP_TYPES.includes(inverseType)) {
      // Check if inverse already exists
      const existingInverse = await pool.query(
        'SELECT id FROM relationships WHERE member1_id = $1 AND member2_id = $2 AND relationship_type = $3',
        [member2_id, member1_id, inverseType]
      );

      if (existingInverse.rows.length === 0) {
        await pool.query(
          'INSERT INTO relationships (member1_id, member2_id, relationship_type) VALUES ($1, $2, $3)',
          [member2_id, member1_id, inverseType]
        );
        logger.debug(`Created inverse relationship: ${inverseType}`);
      } else {
        logger.debug('Inverse relationship already exists');
      }
    }

    // SYNC TO UNION_CHILDREN: If this is a parent-child relationship, add child to union_children
    // Parent relationship types: father, mother (member1 is parent, member2 is child)
    // Child relationship types: son, daughter (member1 is child, member2 is parent)
    if (['father', 'mother'].includes(relationship_type)) {
      // member1 is parent, member2 is child
      // Clean up old parent of the same type (re-parenting)
      await cleanupOldParent(member2_id, member1_id, relationship_type);
      await syncChildToUnion(member1_id, member2_id);
    } else if (['son', 'daughter'].includes(relationship_type)) {
      // member1 is child, member2 is parent
      // Determine the parent type from the parent's gender
      const parentGender = member2Info.rows[0]?.gender;
      const parentType = parentGender === 'Female' ? 'mother' : 'father';
      await cleanupOldParent(member1_id, member2_id, parentType);
      await syncChildToUnion(member2_id, member1_id);
    }

    // SYNC TO UNIONS: If this is a spouse relationship, auto-create a union
    if (['husband', 'wife'].includes(relationship_type)) {
      const partner1 = Math.min(member1_id, member2_id);
      const partner2 = Math.max(member1_id, member2_id);

      const existingUnion = await pool.query(
        'SELECT id FROM unions WHERE partner1_id = $1 AND partner2_id = $2',
        [partner1, partner2]
      );

      if (existingUnion.rows.length === 0) {
        await pool.query(
          'INSERT INTO unions (partner1_id, partner2_id, union_type, is_primary) VALUES ($1, $2, $3, true)',
          [partner1, partner2, 'marriage']
        );
        logger.info(`Auto-created union for spouse relationship: ${partner1} <-> ${partner2}`);
      }
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error creating relationship:', error);
    res.status(500).json({ error: 'Failed to create relationship' });
  }
});

// Delete a relationship
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the relationship details
    const relationship = await pool.query(
      'SELECT r.*, m1.gender as member1_gender, m2.gender as member2_gender FROM relationships r JOIN members m1 ON r.member1_id = m1.id JOIN members m2 ON r.member2_id = m2.id WHERE r.id = $1',
      [id]
    );
    
    if (relationship.rows.length === 0) {
      return res.status(404).json({ error: 'Relationship not found' });
    }
    
    const { member1_id, member2_id, relationship_type } = relationship.rows[0];
    
    // Delete the relationship
    await pool.query('DELETE FROM relationships WHERE id = $1', [id]);
    
    // Delete the inverse relationship if it exists
    const inverseType = await getInverseRelationship(relationship_type, member1_id, member2_id);
    if (inverseType && RELATIONSHIP_TYPES.includes(inverseType)) {
      await pool.query(
        'DELETE FROM relationships WHERE member1_id = $1 AND member2_id = $2 AND relationship_type = $3',
        [member2_id, member1_id, inverseType]
      );
    }
    
    res.json({ message: 'Relationship deleted successfully' });
  } catch (error) {
    logger.error('Error deleting relationship:', error);
    res.status(500).json({ error: 'Failed to delete relationship' });
  }
});

// Get family tree data for visualization
router.get('/tree/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const visited = new Set();
    const nodes = [];
    const edges = [];
    
    const addMemberAndRelations = async (memberId, depth = 0, maxDepth = 3) => {
      if (visited.has(memberId) || depth > maxDepth) return;
      
      visited.add(memberId);
      
      // Get member info
      const memberResult = await pool.query(
        'SELECT * FROM members WHERE id = $1',
        [memberId]
      );
      
      if (memberResult.rows.length === 0) return;
      
      const member = memberResult.rows[0];
      nodes.push({
        id: member.id,
        label: `${member.first_name} ${member.last_name}${member.suffix ? ' ' + member.suffix : ''}`,
        ...member
      });

      // Get all relationships
      const relationsResult = await pool.query(`
        SELECT r.*, m.first_name, m.last_name, m.suffix
        FROM relationships r
        JOIN members m ON (r.member2_id = m.id)
        WHERE r.member1_id = $1 AND r.relationship_type = ANY($2)
      `, [memberId, RELATIONSHIP_TYPES]);
      
      for (const relation of relationsResult.rows) {
        edges.push({
          from: relation.member1_id,
          to: relation.member2_id,
          label: relation.relationship_type
        });
        
        // Recursively add related members
        await addMemberAndRelations(relation.member2_id, depth + 1, maxDepth);
      }
    };
    
    await addMemberAndRelations(parseInt(id));
    
    res.json({ nodes, edges });
  } catch (error) {
    logger.error('Error generating family tree:', error);
    res.status(500).json({ error: 'Failed to generate family tree' });
  }
});

module.exports = router;