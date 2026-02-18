const express = require('express');
const router = express.Router();
const logger = require('../config/logger');
const relationshipService = require('../services/relationshipService');
const { RELATIONSHIP_TYPES } = require('../constants/relationships');

// Get all available relationship types
router.get('/types', async (req, res) => {
  res.json(RELATIONSHIP_TYPES.sort());
});

// Get all relationships (needed for visual family tree)
router.get('/', async (req, res) => {
  try {
    const relationships = await relationshipService.getAllRelationships();
    res.json(relationships);
  } catch (error) {
    logger.error('Error fetching all relationships:', error);
    res.status(500).json({ error: 'Failed to fetch relationships' });
  }
});

// Get all relationships for a specific member
router.get('/member/:id', async (req, res) => {
  try {
    const relationships = await relationshipService.getMemberRelationships(req.params.id);
    res.json(relationships);
  } catch (error) {
    logger.error('Error fetching relationships:', error);
    res.status(500).json({ error: 'Failed to fetch relationships' });
  }
});

// Add a new relationship
router.post('/', async (req, res) => {
  try {
    const { member1_id, member2_id, relationship_type } = req.body;

    // Input validation
    if (!member1_id || !member2_id || !relationship_type) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (member1_id === member2_id) {
      return res.status(400).json({ error: 'Cannot create relationship with self' });
    }

    const relationship = await relationshipService.createRelationship(member1_id, member2_id, relationship_type);
    res.status(201).json(relationship);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    logger.error('Error creating relationship:', error);
    res.status(500).json({ error: 'Failed to create relationship' });
  }
});

// Delete a relationship
router.delete('/:id', async (req, res) => {
  try {
    await relationshipService.deleteRelationship(req.params.id);
    res.json({ message: 'Relationship deleted successfully' });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    logger.error('Error deleting relationship:', error);
    res.status(500).json({ error: 'Failed to delete relationship' });
  }
});

// Get family tree data for visualization
router.get('/tree/:id', async (req, res) => {
  try {
    const treeData = await relationshipService.getTreeData(parseInt(req.params.id));
    res.json(treeData);
  } catch (error) {
    logger.error('Error generating family tree:', error);
    res.status(500).json({ error: 'Failed to generate family tree' });
  }
});

module.exports = router;
