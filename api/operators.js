// api/operators.js  — uses columns: id, name, sector, website, notes
const express = require('express');
const router = express.Router();
const db = require('../db.js');

// GET /api/operators
router.get('/', async (_req, res) => {
  try {
    const r = await db.query(
      `SELECT id, name, sector, website, notes, created_at, updated_at
         FROM operators
        ORDER BY id ASC;`
    );
    res.json(r.rows);
  } catch (err) {
    console.error('GET /operators error:', err);
    res.status(500).json({ error: 'Failed to fetch operators' });
  }
});

// POST /api/operators  (manual add)
router.post('/', async (req, res) => {
  try {
    const { name, sector, website, notes } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'name is required' });
    }

    const r = await db.query(
      `INSERT INTO operators (name, sector, website, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id, name, sector, website, notes, created_at, updated_at;`,
      [name.trim(), sector || null, website || null, notes || null]
    );

    res.json(r.rows[0]);
  } catch (err) {
    console.error('POST /operators error:', err);
    res.status(500).json({ error: 'Failed to create operator' });
  }
});

module.exports = router;
