// api/operatorRequirements.js
const express = require("express");
const router = express.Router();
const pool = require("../db/pool");

//-------------------------------------------------------------
// GET all operator requirements
//-------------------------------------------------------------
router.get("/operatorRequirements/manual", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, operator, sector, locations, size_sqft, notes, created_at
      FROM operator_requirements
      ORDER BY id DESC
    `);

    res.json({
      ok: true,
      count: result.rowCount,
      items: result.rows.map((r) => ({
        id: r.id,
        operator: r.operator,
        sector: r.sector,
        locations: r.locations,
        sizeSqft: r.size_sqft,
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
// POST — Add new operator requirement
//-------------------------------------------------------------
router.post("/operatorRequirements/manual", async (req, res) => {
  try {
    const { operator, sector, locations, sizeSqft, notes } = req.body;

    if (!operator || !operator.trim()) {
      return res.status(400).json({ ok: false, error: "Operator is required" });
    }

    const result = await pool.query(
      `INSERT INTO operator_requirements 
       (operator, sector, locations, size_sqft, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, operator, sector, locations, size_sqft, notes, created_at`,
      [operator.trim(), sector || null, locations || null, sizeSqft || null, notes || null]
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
