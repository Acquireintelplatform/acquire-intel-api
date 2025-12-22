// api/operatorRequirements.js
const express = require("express");
const router = express.Router();
const pool = require("../db/pool"); // Connect to PostgreSQL

//-------------------------------------------------------------
// GET all operator requirements
//-------------------------------------------------------------
router.get("/operatorRequirements/manual", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, operator_id, sector, preferred_locations, size_sqm, notes, created_at 
       FROM operator_requirements 
       ORDER BY id DESC`
    );

    res.json({
      ok: true,
      count: result.rowCount,
      items: result.rows.map((r) => ({
        id: r.id,
        name: r.name,
        operatorId: r.operator_id,
        sector: r.sector,
        preferredLocations: r.preferred_locations,
        sizeSqm: r.size_sqm,
        notes: r.notes,
        createdAt: r.created_at,
        ts: new Date(r.created_at).getTime(),
      })),
    });
  } catch (err) {
    console.error("❌ Error fetching operator requirements:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

//-------------------------------------------------------------
// POST — Add a new operator requirement
//-------------------------------------------------------------
router.post("/operatorRequirements/manual", async (req, res) => {
  try {
    const { name, operatorId, sector, preferredLocations, sizeSqm, notes } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ ok: false, error: "Name is required" });
    }

    const result = await pool.query(
      `INSERT INTO operator_requirements 
        (name, operator_id, sector, preferred_locations, size_sqm, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, name, operator_id, sector, preferred_locations, size_sqm, notes, created_at`,
      [
        name.trim(),
        operatorId || null,
        sector || null,
        preferredLocations || null,
        sizeSqm || null,
        notes || null,
      ]
    );

    res.json({
      ok: true,
      item: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Error inserting operator requirement:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
