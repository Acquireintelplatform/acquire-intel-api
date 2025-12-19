const express = require("express");
const router = express.Router();
const pool = require("../db/pool");

// ✅ GET all operator requirements
router.get("/operatorRequirements", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM operator_requirements ORDER BY id DESC");
    res.json({ ok: true, count: result.rows.length, items: result.rows });
  } catch (error) {
    console.error("❌ Error fetching operator requirements:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ✅ POST a new operator requirement
router.post("/operatorRequirements", async (req, res) => {
  try {
    const {
      name,
      sector,
      category,
      min_sqft,
      max_sqft,
      use_class,
      preferred_locations,
      size_sqm,
      extraction_required,
      notes,
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO operator_requirements
      (name, sector, category, min_sqft, max_sqft, use_class, preferred_locations, size_sqm, extraction_required, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
      `,
      [
        name,
        sector,
        category,
        min_sqft,
        max_sqft,
        use_class,
        preferred_locations || [],
        size_sqm,
        extraction_required || false,
        notes,
      ]
    );

    res.json({ ok: true, item: result.rows[0] });
  } catch (error) {
    console.error("❌ Error inserting requirement:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

module.exports = router;
