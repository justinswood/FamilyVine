const express = require('express');
const router = express.Router();
const db = require('../config/database');
const logger = require('../config/logger');

// GET all world events
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, title, description, event_date, category, icon, created_at
       FROM world_events
       ORDER BY event_date ASC`
    );

    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching world events', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch world events' });
  }
});

// GET world events by date range
router.get('/range', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const result = await db.query(
      `SELECT id, title, description, event_date, category, icon, created_at
       FROM world_events
       WHERE event_date >= $1 AND event_date <= $2
       ORDER BY event_date ASC`,
      [startDate, endDate]
    );

    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching world events by range', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch world events' });
  }
});

// GET world events by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;

    const result = await db.query(
      `SELECT id, title, description, event_date, category, icon, created_at
       FROM world_events
       WHERE category = $1
       ORDER BY event_date ASC`,
      [category]
    );

    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching world events by category', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch world events' });
  }
});

module.exports = router;
