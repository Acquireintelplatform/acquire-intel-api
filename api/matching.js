// api/matching.js

const express = require('express');
const router = express.Router();
const db = require('../db.js');

// PROPERTY → OPERATOR MATCHING ENDPOINT
router.post('/run', async (req, res) => {
  try {
    const { property } = req.body;

    if (!property) {
      return res.status(400).json({ error: 'Missing property data' });
    }

    const { sqft, location, use_class, frontage } = property;

    const requirements = await db.query(`
      SELECT 
        p.*, 
        o.name AS operator_name
      FROM operator_requirement_profiles p
      LEFT JOIN operators o 
        ON p.operator_id = o.id
      ORDER BY p.id ASC;
    `);

    const profiles = requirements.rows;

    const matches = profiles.map((req) => {
      let score = 0;

      if (sqft >= req.min_sqft && sqft <= req.max_sqft) score += 40;
      if (req.preferred_locations && req.preferred_locations.includes(location)) score += 20;
      if (req.excluded_locations && req.excluded_locations.includes(location)) score -= 20;
      if (use_class && req.use_class && use_class === req.use_class) score += 15;
      if (frontage && req.frontage_min && frontage >= req.frontage_min) score += 10;

      return {
        operator_name: req.operator_name,
        requirement_id: req.id,
        score,
        details: req,
      };
    });

    res.json(matches);
  } catch (err) {
    console.error('POST /matching/run error:', err);
    res.status(500).json({ error: 'Failed to run matching engine' });
  }
});

module.exports = router;
