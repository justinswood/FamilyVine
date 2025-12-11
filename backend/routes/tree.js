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
        -- Partner 1 details
        json_build_object(
          'id', m1.id,
          'first_name', m1.first_name,
          'middle_name', m1.middle_name,
          'last_name', m1.last_name,
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
        -- Partner 1 details
        json_build_object(
          'id', m1.id,
          'first_name', m1.first_name,
          'middle_name', m1.middle_name,
          'last_name', m1.last_name,
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
// ============================================================================
router.get('/descendants', async (req, res) => {
  try {
    const {
      union_id = null,
      max_generations = 4,
      include_positions = false
    } = req.query;

    logger.debug('Fetching descendants', { union_id, max_generations });

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

    // Build generations recursively
    const generations = [];
    const processedUnions = new Set();
    const processedMembers = new Set();

    // Helper function to get union with details
    const getUnionDetails = async (unionId) => {
      const result = await pool.query(`
        SELECT
          u.id,
          u.union_type,
          u.union_date,
          u.divorce_date,
          u.is_primary,
          u.display_order,
          u.partner1_id,
          u.partner2_id,
          -- Partner 1
          json_build_object(
            'id', m1.id,
            'first_name', m1.first_name,
            'middle_name', m1.middle_name,
            'last_name', m1.last_name,
            'gender', m1.gender,
            'is_alive', m1.is_alive,
            'birth_date', m1.birth_date,
            'death_date', m1.death_date,
            'location', m1.location,
            'occupation', m1.occupation,
            'profile_image_url', m1.photo_url
          ) as partner1,
          -- Partner 2
          json_build_object(
            'id', m2.id,
            'first_name', m2.first_name,
            'middle_name', m2.middle_name,
            'last_name', m2.last_name,
            'gender', m2.gender,
            'is_alive', m2.is_alive,
            'birth_date', m2.birth_date,
            'death_date', m2.death_date,
            'location', m2.location,
            'occupation', m2.occupation,
            'profile_image_url', m2.photo_url
          ) as partner2
        FROM unions u
        JOIN members m1 ON u.partner1_id = m1.id
        JOIN members m2 ON u.partner2_id = m2.id
        WHERE u.id = $1
      `, [unionId]);

      if (result.rows.length === 0) return null;

      const union = result.rows[0];

      // Get children
      const childrenResult = await pool.query(`
        SELECT
          m.id,
          m.first_name,
          m.middle_name,
          m.last_name,
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
        WHERE uc.union_id = $1
        ORDER BY uc.birth_order
      `, [unionId]);

      union.children = childrenResult.rows;
      return union;
    };

    // Build generation 1 (starting union)
    const rootUnion = await getUnionDetails(startUnionId);
    if (!rootUnion) {
      return res.status(404).json({ error: 'Starting union not found' });
    }

    processedUnions.add(rootUnion.id);
    processedMembers.add(rootUnion.partner1_id);
    processedMembers.add(rootUnion.partner2_id);

    generations.push({
      generation: 1,
      unions: [rootUnion]
    });

    // Build subsequent generations
    for (let genNum = 2; genNum <= max_generations; genNum++) {
      const previousGen = generations[genNum - 2];
      const currentGenUnions = [];

      // For each child in the previous generation who has unions
      for (const union of previousGen.unions) {
        for (const child of union.children) {
          if (child.has_unions && !processedMembers.has(child.id)) {
            // Get all unions for this child
            const childUnionsResult = await pool.query(`
              SELECT id FROM unions
              WHERE partner1_id = $1 OR partner2_id = $1
              ORDER BY display_order, union_date
            `, [child.id]);

            for (const row of childUnionsResult.rows) {
              if (!processedUnions.has(row.id)) {
                const childUnion = await getUnionDetails(row.id);
                if (childUnion) {
                  currentGenUnions.push(childUnion);
                  processedUnions.add(childUnion.id);
                  processedMembers.add(childUnion.partner1_id);
                  processedMembers.add(childUnion.partner2_id);
                }
              }
            }
          }
        }
      }

      if (currentGenUnions.length === 0) {
        break; // No more generations to process
      }

      generations.push({
        generation: genNum,
        unions: currentGenUnions
      });
    }

    // Count unique members
    const totalMembers = processedMembers.size;
    const totalUnions = processedUnions.size;

    logger.info(`Fetched ${generations.length} generations with ${totalUnions} unions and ${totalMembers} members`);

    res.json({
      root_union_id: parseInt(startUnionId),
      max_generations: parseInt(max_generations),
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

    // Get children for each union
    const unionsWithChildren = await Promise.all(
      unionsResult.rows.map(async (union) => {
        const childrenResult = await pool.query(`
          SELECT
            m.id,
            m.first_name,
            m.middle_name,
            m.last_name,
            m.gender,
            m.is_alive,
            m.birth_date,
            uc.birth_order,
            uc.is_biological,
            uc.is_adopted,
            uc.is_step_child
          FROM union_children uc
          JOIN members m ON uc.child_id = m.id
          WHERE uc.union_id = $1
          ORDER BY uc.birth_order
        `, [union.id]);

        return {
          ...union,
          children: childrenResult.rows
        };
      })
    );

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
          first_name || ' ' || last_name as label
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

module.exports = router;
