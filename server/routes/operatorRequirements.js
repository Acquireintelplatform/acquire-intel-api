// server/routes/operatorRequirements.js
const express = require("express");
const router = express.Router();
const pool = require("../db/pool");

// ✅ Get all operator requirements
router.get("/operatorRequirements", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM operator_requirements ORDER BY id DESC");
    res.json({ ok: true, count: result.rows.length, items: result.rows });
  } catch (error) {
    console.error("❌ Error fetching operator requirements:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ✅ Add a new requirement
router.post("/operatorRequirements", async (req, res) => {
  try {
    const { name, sector, preferred_locations, size_sqm, notes } = req.body;

    const result = await pool.query(
      `
      INSERT INTO operator_requirements (name, sector, preferredLocations, sizeSqm, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
      `,
      [name, sector, preferred_locations, size_sqm, notes]
    );

    res.json({ ok: true, item: result.rows[0] });
  } catch (error) {
    console.error("❌ Error inserting requirement:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

module.exports = router;
