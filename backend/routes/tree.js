const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const logger = require('../config/logger');

// ============================================================================
// GET /api/tree/root-union
// Returns the definitive root union (Philip & Elizabeth)
// ============================================================================
router.get('/root-union', async (req, res) => {
  try {
    logger.debug('Fetching root union');

    const result = await pool.query(`
      SELECT
        u.id as union_id,
        u.union_type,
        u.union_date,
        u.union_location,
        u.notes,
        u.is_single_parent,
        u.is_visible_on_tree,
        -- Partner 1 details
        json_build_object(
          'id', m1.id,
          'first_name', m1.first_name,
          'middle_name', m1.middle_name,
          'last_name', m1.last_name,
          'suffix', m1.suffix,
          'gender', m1.gender,
          'is_alive', m1.is_alive,
          'birth_date', m1.birth_date,
          'death_date', m1.death_date,
          'birth_place', m1.birth_place,
          'location', m1.location,
          'occupation', m1.occupation,
          'profile_image_url', m1.photo_url
        ) as partner1,
        -- Partner 2 details
        json_build_object(
          'id', m2.id,
          'first_name', m2.first_name,
          'middle_name', m2.middle_name,
          'last_name', m2.last_name,
          'suffix', m2.suffix,
          'gender', m2.gender,
          'is_alive', m2.is_alive,
          'birth_date', m2.birth_date,
          'death_date', m2.death_date,
          'birth_place', m2.birth_place,
          'location', m2.location,
          'occupation', m2.occupation,
          'profile_image_url', m2.photo_url
        ) as partner2,
        -- Children count
        (SELECT COUNT(*) FROM union_children WHERE union_id = u.id) as children_count
      FROM unions u
      JOIN members m1 ON u.partner1_id = m1.id
      JOIN members m2 ON u.partner2_id = m2.id
      WHERE u.notes LIKE '%ROOT UNION%'
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Root union not found' });
    }

    logger.info(`Root union found: ID ${result.rows[0].union_id}`);
    res.json(result.rows[0]);

  } catch (error) {
    logger.error('Error fetching root union:', error);
    res.status(500).json({ error: 'Failed to fetch root union' });
  }
});

// ============================================================================
// GET /api/tree/unions
// Returns all unions with basic info (for stats/metrics)
// ============================================================================
router.get('/unions', async (req, res) => {
  try {
    logger.debug('Fetching all unions');

    const result = await pool.query(`
      SELECT
        u.id,
        u.union_type,
        u.union_date,
        u.divorce_date,
        u.partner1_id,
        u.partner2_id,
        u.is_single_parent,
        m1.first_name as partner1_first_name,
        m1.last_name as partner1_last_name,
        m2.first_name as partner2_first_name,
        m2.last_name as partner2_last_name
      FROM unions u
      LEFT JOIN members m1 ON u.partner1_id = m1.id
      LEFT JOIN members m2 ON u.partner2_id = m2.id
      ORDER BY u.union_date NULLS LAST
    `);

    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching unions:', error);
    res.status(500).json({ error: 'Failed to fetch unions' });
  }
});

// ============================================================================
// GET /api/tree/union/:id
// Returns detailed information about a specific union
// ============================================================================
router.get('/union/:id', async (req, res) => {
  try {
    const { id } = req.params;
    logger.debug(`Fetching union ${id}`);

    // Get union details
    const unionResult = await pool.query(`
      SELECT
        u.id,
        u.union_type,
        u.union_date,
        u.union_location,
        u.divorce_date,
        u.end_reason,
        u.is_primary,
        u.display_order,
        u.notes,
        u.is_single_parent,
        u.is_visible_on_tree,
        -- Partner 1 details
        json_build_object(
          'id', m1.id,
          'first_name', m1.first_name,
          'middle_name', m1.middle_name,
          'last_name', m1.last_name,
          'suffix', m1.suffix,
          'gender', m1.gender,
          'is_alive', m1.is_alive,
          'birth_date', m1.birth_date,
          'death_date', m1.death_date,
          'birth_place', m1.birth_place,
          'location', m1.location,
          'occupation', m1.occupation,
          'pronouns', m1.pronouns,
          'profile_image_url', m1.photo_url
        ) as partner1,
        -- Partner 2 details
        json_build_object(
          'id', m2.id,
          'first_name', m2.first_name,
          'middle_name', m2.middle_name,
          'last_name', m2.last_name,
          'suffix', m2.suffix,
          'gender', m2.gender,
          'is_alive', m2.is_alive,
          'birth_date', m2.birth_date,
          'death_date', m2.death_date,
          'birth_place', m2.birth_place,
          'location', m2.location,
          'occupation', m2.occupation,
          'pronouns', m2.pronouns,
          'profile_image_url', m2.photo_url
        ) as partner2
      FROM unions u
      JOIN members m1 ON u.partner1_id = m1.id
      JOIN members m2 ON u.partner2_id = m2.id
      WHERE u.id = $1
    `, [id]);

    if (unionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Union not found' });
    }

    // Get children
    const childrenResult = await pool.query(`
      SELECT
        m.id,
        m.first_name,
        m.middle_name,
        m.last_name,
        m.suffix,
        m.gender,
        m.is_alive,
        m.birth_date,
        m.death_date,
        m.location,
        m.occupation,
        uc.birth_order,
        uc.is_biological,
        uc.is_adopted,
        uc.is_step_child,
        -- Check if this child has their own unions
        EXISTS(SELECT 1 FROM unions WHERE partner1_id = m.id OR partner2_id = m.id) as has_unions,
        (SELECT COUNT(*) FROM unions WHERE partner1_id = m.id OR partner2_id = m.id) as unions_count
      FROM union_children uc
      JOIN members m ON uc.child_id = m.id
      WHERE uc.union_id = $1
      ORDER BY uc.birth_order
    `, [id]);

    const response = {
      union: unionResult.rows[0],
      children: childrenResult.rows
    };

    logger.info(`Union ${id} fetched with ${childrenResult.rows.length} children`);
    res.json(response);

  } catch (error) {
    logger.error('Error fetching union:', error);
    res.status(500).json({ error: 'Failed to fetch union details' });
  }
});

// ============================================================================
// GET /api/tree/descendants
// Returns descendants starting from a union, with generation filtering
// Query params: union_id, max_generations, include_positions
// OPTIMIZED: Uses CTE to fetch entire tree in 2 queries instead of N+1
// ============================================================================
router.get('/descendants', async (req, res) => {
  try {
    const {
      union_id = null,
      max_generations = 4,
      include_positions = false
    } = req.query;

    const maxGen = parseInt(max_generations) || 4;
    logger.debug('Fetching descendants', { union_id, max_generations: maxGen });

    // If no union_id provided, get root union
    let startUnionId = union_id;
    if (!startUnionId) {
      const rootResult = await pool.query(`
        SELECT id FROM unions WHERE notes LIKE '%ROOT UNION%' LIMIT 1
      `);
      if (rootResult.rows.length === 0) {
        return res.status(404).json({ error: 'Root union not found' });
      }
      startUnionId = rootResult.rows[0].id;
    }

    // OPTIMIZED: Single CTE query to fetch all unions and their generations
    const unionsResult = await pool.query(`
      WITH RECURSIVE tree_unions AS (
        -- Base case: starting union (generation 1)
        SELECT
          u.id,
          u.union_type,
          u.union_date,
          u.divorce_date,
          u.is_primary,
          u.display_order,
          u.partner1_id,
          u.partner2_id,
          u.is_single_parent,
          u.is_visible_on_tree,
          1 as generation
        FROM unions u
        WHERE u.id = $1

        UNION ALL

        -- Recursive case: unions of children from previous generation
        SELECT DISTINCT
          u.id,
          u.union_type,
          u.union_date,
          u.divorce_date,
          u.is_primary,
          u.display_order,
          u.partner1_id,
          u.partner2_id,
          u.is_single_parent,
          u.is_visible_on_tree,
          tu.generation + 1 as generation
        FROM tree_unions tu
        JOIN union_children uc ON uc.union_id = tu.id
        JOIN unions u ON (u.partner1_id = uc.child_id OR u.partner2_id = uc.child_id)
        WHERE tu.generation < $2
      )
      SELECT
        tu.*,
        json_build_object(
          'id', m1.id,
          'first_name', m1.first_name,
          'middle_name', m1.middle_name,
          'last_name', m1.last_name,
          'suffix', m1.suffix,
          'gender', m1.gender,
          'is_alive', m1.is_alive,
          'birth_date', m1.birth_date,
          'death_date', m1.death_date,
          'location', m1.location,
          'occupation', m1.occupation,
          'profile_image_url', m1.photo_url
        ) as partner1,
        json_build_object(
          'id', m2.id,
          'first_name', m2.first_name,
          'middle_name', m2.middle_name,
          'last_name', m2.last_name,
          'suffix', m2.suffix,
          'gender', m2.gender,
          'is_alive', m2.is_alive,
          'birth_date', m2.birth_date,
          'death_date', m2.death_date,
          'location', m2.location,
          'occupation', m2.occupation,
          'profile_image_url', m2.photo_url
        ) as partner2
      FROM tree_unions tu
      JOIN members m1 ON tu.partner1_id = m1.id
      JOIN members m2 ON tu.partner2_id = m2.id
      ORDER BY tu.generation, tu.display_order, tu.union_date
    `, [startUnionId, maxGen]);

    if (unionsResult.rows.length === 0) {
      return res.status(404).json({ error: 'Starting union not found' });
    }

    // Get all union IDs for batch children fetch
    const unionIds = unionsResult.rows.map(u => u.id);

    // OPTIMIZED: Single query to fetch ALL children for all unions
    const childrenResult = await pool.query(`
      SELECT
        uc.union_id,
        m.id,
        m.first_name,
        m.middle_name,
        m.last_name,
        m.suffix,
        m.gender,
        m.is_alive,
        m.birth_date,
        m.death_date,
        m.location,
        m.occupation,
        m.photo_url as profile_image_url,
        uc.birth_order,
        uc.is_biological,
        uc.is_adopted,
        uc.is_step_child,
        EXISTS(SELECT 1 FROM unions WHERE partner1_id = m.id OR partner2_id = m.id) as has_unions
      FROM union_children uc
      JOIN members m ON uc.child_id = m.id
      WHERE uc.union_id = ANY($1)
      ORDER BY uc.union_id, uc.birth_order
    `, [unionIds]);

    // Group children by union_id
    const childrenByUnion = {};
    for (const child of childrenResult.rows) {
      if (!childrenByUnion[child.union_id]) {
        childrenByUnion[child.union_id] = [];
      }
      childrenByUnion[child.union_id].push(child);
    }

    // Build generations structure
    const generationsMap = {};
    const processedMembers = new Set();
    const processedUnions = new Set();

    for (const union of unionsResult.rows) {
      const gen = union.generation;
      if (!generationsMap[gen]) {
        generationsMap[gen] = [];
      }

      // Attach children to union
      union.children = childrenByUnion[union.id] || [];

      generationsMap[gen].push(union);
      processedUnions.add(union.id);
      processedMembers.add(union.partner1_id);
      processedMembers.add(union.partner2_id);

      // Add children to member count
      for (const child of union.children) {
        processedMembers.add(child.id);
      }
    }

    // Convert to array format
    const generations = Object.keys(generationsMap)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(gen => ({
        generation: parseInt(gen),
        unions: generationsMap[gen]
      }));

    // Exclude Unknown Parent placeholder from count
    const unknownParentResult = await pool.query(
      `SELECT id FROM members WHERE first_name = 'Unknown' AND last_name = 'Parent' LIMIT 1`
    );
    const unknownParentId = unknownParentResult.rows[0]?.id;
    if (unknownParentId && processedMembers.has(unknownParentId)) {
      processedMembers.delete(unknownParentId);
    }

    const totalMembers = processedMembers.size;
    const totalUnions = processedUnions.size;

    logger.info(`Fetched ${generations.length} generations with ${totalUnions} unions and ${totalMembers} members (optimized)`);

    res.json({
      root_union_id: parseInt(startUnionId),
      max_generations: maxGen,
      generations,
      total_members: totalMembers,
      total_unions: totalUnions
    });

  } catch (error) {
    logger.error('Error fetching descendants:', error);
    res.status(500).json({ error: 'Failed to fetch descendants' });
  }
});

// ============================================================================
// GET /api/tree/member/:id/unions
// Returns all unions for a given member (handles multiple marriages)
// ============================================================================
router.get('/member/:id/unions', async (req, res) => {
  try {
    const { id } = req.params;
    logger.debug(`Fetching unions for member ${id}`);

    // Get member details
    const memberResult = await pool.query(`
      SELECT * FROM members WHERE id = $1
    `, [id]);

    if (memberResult.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Get all unions for this member
    const unionsResult = await pool.query(`
      SELECT
        u.id,
        u.union_type,
        u.union_date,
        u.union_location,
        u.divorce_date,
        u.end_reason,
        u.is_primary,
        u.display_order,
        u.notes,
        -- Get the partner (the one who isn't this member)
        CASE
          WHEN u.partner1_id = $1 THEN json_build_object(
            'id', m2.id,
            'first_name', m2.first_name,
            'middle_name', m2.middle_name,
            'last_name', m2.last_name,
            'suffix', m2.suffix,
            'gender', m2.gender,
            'is_alive', m2.is_alive,
            'birth_date', m2.birth_date,
            'death_date', m2.death_date,
            'location', m2.location,
            'occupation', m2.occupation,
            'profile_image_url', m2.photo_url
          )
          ELSE json_build_object(
            'id', m1.id,
            'first_name', m1.first_name,
            'middle_name', m1.middle_name,
            'last_name', m1.last_name,
            'suffix', m1.suffix,
            'gender', m1.gender,
            'is_alive', m1.is_alive,
            'birth_date', m1.birth_date,
            'death_date', m1.death_date,
            'location', m1.location,
            'occupation', m1.occupation,
            'profile_image_url', m1.photo_url
          )
        END as partner
      FROM unions u
      JOIN members m1 ON u.partner1_id = m1.id
      JOIN members m2 ON u.partner2_id = m2.id
      WHERE u.partner1_id = $1 OR u.partner2_id = $1
      ORDER BY u.display_order, u.union_date NULLS LAST
    `, [id]);

    // Batch-fetch children for ALL unions in a single query (avoids N+1)
    const unionIds = unionsResult.rows.map(u => u.id);
    let childrenByUnion = {};
    if (unionIds.length > 0) {
      const childrenResult = await pool.query(`
        SELECT
          uc.union_id,
          m.id,
          m.first_name,
          m.middle_name,
          m.last_name,
          m.suffix,
          m.gender,
          m.is_alive,
          m.birth_date,
          uc.birth_order,
          uc.is_biological,
          uc.is_adopted,
          uc.is_step_child
        FROM union_children uc
        JOIN members m ON uc.child_id = m.id
        WHERE uc.union_id = ANY($1)
        ORDER BY uc.union_id, uc.birth_order
      `, [unionIds]);

      for (const row of childrenResult.rows) {
        if (!childrenByUnion[row.union_id]) childrenByUnion[row.union_id] = [];
        childrenByUnion[row.union_id].push(row);
      }
    }

    const unionsWithChildren = unionsResult.rows.map(union => ({
      ...union,
      children: childrenByUnion[union.id] || []
    }));

    logger.info(`Found ${unionsWithChildren.length} unions for member ${id}`);

    res.json({
      member: memberResult.rows[0],
      unions: unionsWithChildren
    });

  } catch (error) {
    logger.error('Error fetching member unions:', error);
    res.status(500).json({ error: 'Failed to fetch member unions' });
  }
});

// ============================================================================
// GET /api/tree/breadcrumbs
// Returns navigation breadcrumb trail
// Query params: union_id or member_id
// ============================================================================
router.get('/breadcrumbs', async (req, res) => {
  try {
    const { union_id, member_id } = req.query;
    logger.debug('Fetching breadcrumbs', { union_id, member_id });

    const breadcrumbs = [];

    // Always start with root union
    const rootResult = await pool.query(`
      SELECT
        u.id,
        m1.first_name || ' & ' || m2.first_name as label
      FROM unions u
      JOIN members m1 ON u.partner1_id = m1.id
      JOIN members m2 ON u.partner2_id = m2.id
      WHERE u.notes LIKE '%ROOT UNION%'
      LIMIT 1
    `);

    if (rootResult.rows.length > 0) {
      breadcrumbs.push({
        type: 'union',
        id: rootResult.rows[0].id,
        label: rootResult.rows[0].label,
        is_root: true
      });
    }

    // If focusing on a specific union, trace path from root
    if (union_id && union_id != rootResult.rows[0]?.id) {
      const unionResult = await pool.query(`
        SELECT
          u.id,
          m1.first_name || ' & ' || m2.first_name as label
        FROM unions u
        JOIN members m1 ON u.partner1_id = m1.id
        JOIN members m2 ON u.partner2_id = m2.id
        WHERE u.id = $1
      `, [union_id]);

      if (unionResult.rows.length > 0) {
        breadcrumbs.push({
          type: 'union',
          id: parseInt(union_id),
          label: unionResult.rows[0].label,
          is_current: true
        });
      }
    }

    // If focusing on a member, add them to breadcrumb
    if (member_id) {
      const memberResult = await pool.query(`
        SELECT
          id,
          first_name || ' ' || last_name || COALESCE(' ' || NULLIF(suffix, ''), '') as label
        FROM members
        WHERE id = $1
      `, [member_id]);

      if (memberResult.rows.length > 0) {
        breadcrumbs.push({
          type: 'member',
          id: parseInt(member_id),
          label: memberResult.rows[0].label,
          is_current: !union_id
        });
      }
    }

    logger.debug(`Generated ${breadcrumbs.length} breadcrumbs`);
    res.json({ breadcrumbs });

  } catch (error) {
    logger.error('Error fetching breadcrumbs:', error);
    res.status(500).json({ error: 'Failed to fetch breadcrumbs' });
  }
});

// ============================================================================
// POST /api/tree/union-positions
// Save union and member positions for custom layouts
// ============================================================================
router.post('/union-positions', async (req, res) => {
  try {
    const { positions, tree_type = 'reactflow' } = req.body;

    if (!positions || typeof positions !== 'object') {
      return res.status(400).json({ error: 'Invalid positions data' });
    }

    logger.info(`Saving ${Object.keys(positions).length} positions for tree type: ${tree_type}`);

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      for (const [key, position] of Object.entries(positions)) {
        if (!position.x || !position.y) continue;

        // Check if it's a union or member position
        if (key.startsWith('union_')) {
          const unionId = parseInt(key.replace('union_', ''));

          await client.query(`
            INSERT INTO union_positions (union_id, x_position, y_position, tree_type, updated_at)
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
            ON CONFLICT (union_id, tree_type)
            DO UPDATE SET
              x_position = EXCLUDED.x_position,
              y_position = EXCLUDED.y_position,
              updated_at = CURRENT_TIMESTAMP
          `, [unionId, position.x, position.y, tree_type]);

        } else if (key.startsWith('member_')) {
          const memberId = parseInt(key.replace('member_', ''));

          await client.query(`
            INSERT INTO tree_node_positions (member_id, x_position, y_position, tree_type, updated_at)
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
            ON CONFLICT (member_id, tree_type)
            DO UPDATE SET
              x_position = EXCLUDED.x_position,
              y_position = EXCLUDED.y_position,
              updated_at = CURRENT_TIMESTAMP
          `, [memberId, position.x, position.y, tree_type]);
        }
      }

      await client.query('COMMIT');
      logger.info('Positions saved successfully', { count: Object.keys(positions).length });

      res.json({
        success: true,
        message: `Saved ${Object.keys(positions).length} positions`
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    logger.error('Error saving positions:', error);
    res.status(500).json({ error: 'Failed to save positions' });
  }
});

// ============================================================================
// GET /api/tree/unions/:id
// Returns full details for a specific union (partners + children)
// ============================================================================
router.get('/unions/:id', async (req, res) => {
  try {
    const unionId = parseInt(req.params.id);
    if (isNaN(unionId)) {
      return res.status(400).json({ error: 'Invalid union ID' });
    }

    logger.debug('Fetching union detail', { unionId });

    const result = await pool.query(`
      SELECT
        u.id,
        u.union_type,
        u.union_date,
        u.union_location,
        u.notes,
        u.is_single_parent,
        -- Partner 1
        json_build_object(
          'id', p1.id,
          'first_name', p1.first_name,
          'last_name', p1.last_name,
          'gender', p1.gender,
          'birth_date', p1.birth_date,
          'death_date', p1.death_date,
          'photo_url', p1.photo_url
        ) AS partner1,
        -- Partner 2
        json_build_object(
          'id', p2.id,
          'first_name', p2.first_name,
          'last_name', p2.last_name,
          'gender', p2.gender,
          'birth_date', p2.birth_date,
          'death_date', p2.death_date,
          'photo_url', p2.photo_url
        ) AS partner2,
        -- Children aggregated as JSON array
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', c.id,
                'first_name', c.first_name,
                'last_name', c.last_name,
                'gender', c.gender,
                'birth_date', c.birth_date,
                'death_date', c.death_date,
                'photo_url', c.photo_url
              ) ORDER BY c.birth_date NULLS LAST
            )
            FROM union_children uc
            JOIN members c ON uc.member_id = c.id
            WHERE uc.union_id = u.id
          ),
          '[]'::json
        ) AS children
      FROM unions u
      LEFT JOIN members p1 ON u.partner1_id = p1.id
      LEFT JOIN members p2 ON u.partner2_id = p2.id
      WHERE u.id = $1
    `, [unionId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Union not found' });
    }

    res.json(result.rows[0]);

  } catch (error) {
    logger.error('Error fetching union detail:', error);
    res.status(500).json({ error: 'Failed to fetch union details' });
  }
});

// ============================================================================
// GET /api/tree/shared-heritage
// Returns shared heritage data between two members (shared photos, stories, same city)
// Query params: member1, member2
// ============================================================================
router.get('/shared-heritage', async (req, res) => {
  try {
    const { member1, member2 } = req.query;

    if (!member1 || !member2) {
      return res.status(400).json({ error: 'Both member1 and member2 are required' });
    }

    const memberId1 = parseInt(member1);
    const memberId2 = parseInt(member2);

    if (isNaN(memberId1) || isNaN(memberId2)) {
      return res.status(400).json({ error: 'Invalid member IDs' });
    }

    logger.debug('Fetching shared heritage', { member1: memberId1, member2: memberId2 });

    // Get shared photos (photos where both members are tagged)
    const sharedPhotosResult = await pool.query(`
      SELECT COUNT(DISTINCT p.id) as shared_photos
      FROM photos p
      JOIN photo_tags pt1 ON pt1.photo_id = p.id AND pt1.member_id = $1
      JOIN photo_tags pt2 ON pt2.photo_id = p.id AND pt2.member_id = $2
    `, [memberId1, memberId2]);

    // Get shared stories (stories that mention both members)
    const sharedStoriesResult = await pool.query(`
      SELECT COUNT(DISTINCT s.id) as shared_stories
      FROM stories s
      JOIN story_members sm1 ON sm1.story_id = s.id AND sm1.member_id = $1
      JOIN story_members sm2 ON sm2.story_id = s.id AND sm2.member_id = $2
    `, [memberId1, memberId2]);

    // Check if members share same city
    const sameCityResult = await pool.query(`
      SELECT
        m1.location as location1,
        m2.location as location2,
        CASE
          WHEN m1.location IS NOT NULL
            AND m2.location IS NOT NULL
            AND LOWER(TRIM(m1.location)) = LOWER(TRIM(m2.location))
          THEN true
          ELSE false
        END as same_city
      FROM members m1, members m2
      WHERE m1.id = $1 AND m2.id = $2
    `, [memberId1, memberId2]);

    const sharedPhotos = parseInt(sharedPhotosResult.rows[0]?.shared_photos) || 0;
    const sharedStories = parseInt(sharedStoriesResult.rows[0]?.shared_stories) || 0;
    const sameCity = sameCityResult.rows[0]?.same_city || false;

    logger.info(`Shared heritage between ${memberId1} and ${memberId2}: ${sharedPhotos} photos, ${sharedStories} stories, sameCity=${sameCity}`);

    res.json({
      member1Id: memberId1,
      member2Id: memberId2,
      sharedPhotos,
      sharedStories,
      sameCity,
      location: sameCity ? sameCityResult.rows[0]?.location1 : null
    });

  } catch (error) {
    logger.error('Error fetching shared heritage:', error);
    res.status(500).json({ error: 'Failed to fetch shared heritage' });
  }
});

module.exports = router;
