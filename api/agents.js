// api/agents.js

const express = require('express');
const router = express.Router();
const db = require('../db.js');

// GET all agents
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`SELECT *  FROM agents ORDER BY id ASC`);
    res.json(result.rows);
  } catch (err) {
    console.error('GET /agents error:', err);
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

// CREATE agent
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, notes } = req.body;

    const result = await db.query(
      `
      INSERT INTO agents (
        name,
        email,
        phone,
        notes,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *;
      `,
      [name, email, phone, notes]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('POST /agents error:', err);
    res.status(500).json({ error: 'Failed to create agent' });
  }
});

module.exports = router;
