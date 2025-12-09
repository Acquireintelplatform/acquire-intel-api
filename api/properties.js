// api/properties.js

const express = require('express');
const router = express.Router();
const db = require('../db.js');

// GET all properties
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM properties ORDER BY id ASC`);
    res.json(result.rows);
  } catch (err) {
    console.error('GET /properties error:', err);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

// CREATE property
router.post('/', async (req, res) => {
  try {
    const {
      address,
      postcode,
      sqft,
      use_class,
      frontage,
      rent,
      lease_expiry,
      agent,
      url,
      notes
    } = req.body;

    const result = await db.query(
      `
      INSERT INTO properties (
        address,
        postcode,
        sqft,
        use_class,
        frontage,
        rent,
        lease_expiry,
        agent,
        url,
        notes,
        created_at,
        updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10,
        NOW(), NOW()
      )
      RETURNING *;
      `,
      [
        address,
        postcode,
        sqft,
        use_class,
        frontage,
        rent,
        lease_expiry,
        agent,
        url,
        notes
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('POST /properties error:', err);
    res.status(500).json({ error: 'Failed to create property' });
  }
});

module.exports = router;
