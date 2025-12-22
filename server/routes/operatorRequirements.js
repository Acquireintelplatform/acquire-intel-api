// server/routes/operatorRequirements.js
//-------------------------------------------------------------
// Operator Requirements API — Acquire Intel
//-------------------------------------------------------------
const express = require("express");
const router = express.Router();
const pool = require("../db/pool");

//-------------------------------------------------------------
// GET /api/operatorRequirements/manual
// Fetch all operator requirements
//-------------------------------------------------------------
router.get("/operatorRequirements/manual", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, sector, preferred_locations, size_sqm, notes, created_at
      FROM operator_requirements
      ORDER BY id DESC
    `);

    res.json({
      ok: true,
      count: result.rows.length,
      items: result.rows,
    });
  } catch (err) {
    console.error("❌ Error fetching operator requirements:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

//-------------------------------------------------------------
// POST /api/operatorRequirements/manual
// Save a new operator requirement
//-------------------------------------------------------------
router.post("/operatorRequirements/manual", async (req, res) => {
  try {
    const { name, sector, preferredLocations, size_sqm, notes } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ ok: false, error: "Name is required" });
    }

    const result = await pool.query(
      `
      INSERT INTO operator_requirements (name, sector, preferred_locations, size_sqm, notes, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
      `,
      [name.trim(), sector || null, preferredLocations || null, size_sqm || null, notes || null]
    );

    res.json({ ok: true, item: result.rows[0] });
  } catch (err) {
    console.error("❌ Error saving operator requirement:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

//-------------------------------------------------------------
// Export router
//-------------------------------------------------------------
module.exports = router;
