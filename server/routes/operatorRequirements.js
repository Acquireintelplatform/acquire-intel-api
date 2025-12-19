// server/routes/operatorRequirements.js
//-------------------------------------------------------------
// Simplified Operator Requirements Routes (Clean Schema)
//-------------------------------------------------------------
const express = require("express");
const router = express.Router();
const pool = require("../db/pool");

//-------------------------------------------------------------
// GET all operator requirements
//-------------------------------------------------------------
router.get("/operatorRequirements", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, sector, preferred_locations, size_sqm, notes
       FROM operator_requirements
       ORDER BY id DESC`
    );
    res.json({ ok: true, count: result.rows.length, items: result.rows });
  } catch (error) {
    console.error("❌ Error fetching operator requirements:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

//-------------------------------------------------------------
// POST a new operator requirement
//-------------------------------------------------------------
router.post("/operatorRequirements", async (req, res) => {
  try {
    const { name, sector, preferred_locations, size_sqm, notes } = req.body;

    // Validate simple fields
    if (!name) {
      return res.status(400).json({ ok: false, error: "Name is required" });
    }

    const result = await pool.query(
      `
      INSERT INTO operator_requirements (name, sector, preferred_locations, size_sqm, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, sector, preferred_locations, size_sqm, notes;
      `,
      [name, sector || null, preferred_locations || [], size_sqm || null, notes || null]
    );

    res.json({ ok: true, item: result.rows[0] });
  } catch (error) {
    console.error("❌ Error inserting operator requirement:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

module.exports = router;
