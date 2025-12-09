const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get node positions for a specific tree type
router.get('/', async (req, res) => {
  try {
    const { tree_type = 'reactflow' } = req.query;
    
    const result = await pool.query(
      'SELECT member_id, x_position, y_position FROM tree_node_positions WHERE tree_type = $1',
      [tree_type]
    );
    
    // Convert to object format for easy lookup
    const positions = {};
    result.rows.forEach(row => {
      positions[row.member_id] = {
        x: parseFloat(row.x_position),
        y: parseFloat(row.y_position)
      };
    });
    
    console.log(`📍 Loaded ${result.rows.length} saved node positions for ${tree_type}`);
    res.json(positions);
  } catch (error) {
    console.error('Error fetching node positions:', error);
    res.status(500).json({ error: 'Failed to fetch node positions' });
  }
});

// Save/update node positions
router.post('/', async (req, res) => {
  try {
    const { positions, tree_type = 'reactflow' } = req.body;
    
    if (!positions || typeof positions !== 'object') {
      return res.status(400).json({ error: 'Invalid positions data' });
    }
    
    console.log(`💾 Saving ${Object.keys(positions).length} node positions for ${tree_type}`);
    
    // Use transaction to ensure consistency
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Upsert each position
      for (const [memberId, position] of Object.entries(positions)) {
        if (!position.x || !position.y) continue;
        
        await client.query(`
          INSERT INTO tree_node_positions (member_id, x_position, y_position, tree_type, updated_at)
          VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
          ON CONFLICT (member_id, tree_type) 
          DO UPDATE SET 
            x_position = EXCLUDED.x_position,
            y_position = EXCLUDED.y_position,
            updated_at = CURRENT_TIMESTAMP
        `, [parseInt(memberId), position.x, position.y, tree_type]);
      }
      
      await client.query('COMMIT');
      console.log('✅ Node positions saved successfully');
      
      res.json({ 
        success: true, 
        message: `Saved ${Object.keys(positions).length} node positions` 
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error saving node positions:', error);
    res.status(500).json({ error: 'Failed to save node positions' });
  }
});

// Save a single node position (for real-time updates during dragging)
router.put('/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;
    const { x, y, tree_type = 'reactflow' } = req.body;
    
    if (typeof x !== 'number' || typeof y !== 'number') {
      return res.status(400).json({ error: 'Invalid position coordinates' });
    }
    
    await pool.query(`
      INSERT INTO tree_node_positions (member_id, x_position, y_position, tree_type, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (member_id, tree_type) 
      DO UPDATE SET 
        x_position = EXCLUDED.x_position,
        y_position = EXCLUDED.y_position,
        updated_at = CURRENT_TIMESTAMP
    `, [parseInt(memberId), x, y, tree_type]);
    
    console.log(`📌 Updated position for member ${memberId}: (${x}, ${y})`);
    res.json({ success: true });
    
  } catch (error) {
    console.error('Error updating node position:', error);
    res.status(500).json({ error: 'Failed to update node position' });
  }
});

// Reset all positions for a tree type
router.delete('/', async (req, res) => {
  try {
    const { tree_type = 'reactflow' } = req.query;
    
    const result = await pool.query(
      'DELETE FROM tree_node_positions WHERE tree_type = $1',
      [tree_type]
    );
    
    console.log(`🗑️ Deleted ${result.rowCount} positions for ${tree_type}`);
    res.json({ 
      success: true, 
      message: `Reset ${result.rowCount} node positions` 
    });
    
  } catch (error) {
    console.error('Error resetting node positions:', error);
    res.status(500).json({ error: 'Failed to reset node positions' });
  }
});

module.exports = router;