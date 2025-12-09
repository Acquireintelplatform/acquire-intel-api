// api/extraction.js

const express = require('express');
const router = express.Router();
const db = require('../db.js');

// Extracted text → create operator requirement profile
router.post('/operator-requirement', async (req, res) => {
  try {
    const {
      operator_id,
      extracted_raw_text,
      min_sqft,
      max_sqft,
      preferred_locations,
      excluded_locations,
      format_type,
      use_class,
      frontage_min,
      power_supply,
      extraction_required,
      alcohol_license,
      notes
    } = req.body;

    const result = await db.query(
      `
      INSERT INTO operator_requirement_profiles (
        operator_id,
        extracted_raw_text,
        min_sqft,
        max_sqft,
        preferred_locations,
        excluded_locations,
        format_type,
        use_class,
        frontage_min,
        power_supply,
        extraction_required,
        alcohol_license,
        notes,
        created_at,
        updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13,
        NOW(), NOW()
      )
      RETURNING *;
      `,
      [
        operator_id,
        extracted_raw_text,
        min_sqft,
        max_sqft,
        preferred_locations,
        excluded_locations,
        format_type,
        use_class,
        frontage_min,
        power_supply,
        extraction_required,
        alcohol_license,
        notes
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('POST /extraction/operator-requirement error:', err);
    res.status(500).json({ error: 'Failed to save extracted operator requirement' });
  }
});

module.exports = router;
