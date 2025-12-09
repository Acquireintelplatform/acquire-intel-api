// api/distress.js

const express = require('express');
const router = express.Router();
const db = require('../db.js');

// GET distress signals
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM distress_signals ORDER BY id ASC`);
    res.json(result.rows);
  } catch (err) {
    console.error('GET /distress error:', err);
    res.status(500).json({ error: 'Failed to fetch distress signals' });
  }
});

// CREATE distress signal
router.post('/', async (req, res) => {
  try {
    const { company_name, signal_type, url, notes } = req.body;

    const result = await db.query(
      `
      INSERT INTO distress_signals (
        company_name,
        signal_type,
        url,
        notes,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *;
      `,
      [company_name, signal_type, url, notes]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('POST /distress error:', err);
    res.status(500).json({ error: 'Failed to create distress signal' });
  }
});

module.exports = router;
