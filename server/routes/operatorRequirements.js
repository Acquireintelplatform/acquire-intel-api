// server/routes/operatorRequirements.js
//-------------------------------------------------------------
// Operator Requirements API Routes
//-------------------------------------------------------------
const express = require("express");
const router = express.Router();
const pool = require("../db/pool");

// ✅ GET all operator requirements
router.get("/operatorRequirements", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, sector, preferred_locations AS "preferredLocations",
              size_sqm AS "sizeSqm", notes, created_at AS "createdAt"
       FROM operator_requirements
       ORDER BY id DESC`
    );
    res.json({ ok: true, count: result.rows.length, items: result.rows });
  } catch (err) {
    console.error("GET /api/operatorRequirements error", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ✅ POST create new operator requirement
router.post("/operatorRequirements", async (req, res) => {
  try {
    const { name, sector, preferredLocation, sizeSqm, notes } = req.body;

    if (!name || !sector) {
      return res.status(400).json({ ok: false, error: "Missing required fields" });
    }

    const result = await pool.query(
      `INSERT INTO operator_requirements (name, sector, preferred_locations, size_sqm, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, name, sector, preferred_locations AS "preferredLocations", size_sqm AS "sizeSqm", notes, created_at AS "createdAt"`,
      [name, sector, preferredLocation || null, sizeSqm || null, notes || null]
    );

    res.json({ ok: true, item: result.rows[0] });
  } catch (err) {
    console.error("POST /api/operatorRequirements error", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ✅ DELETE operator requirement
router.delete("/operatorRequirements/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM operator_requirements WHERE id = $1", [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/operatorRequirements/:id error", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
