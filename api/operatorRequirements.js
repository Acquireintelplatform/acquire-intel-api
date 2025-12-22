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
    const result = await pool.query(
      `SELECT id, operator AS name, sector, locations, size_sqft, notes, created_at
       FROM operator_requirements
       ORDER BY id DESC`
    );

    res.json({
      ok: true,
      count: result.rows.length,
      items: result.rows.map((r) => ({
        id: r.id,
        name: r.name || "",
        sector: r.sector || "",
        preferredLocations: r.locations || "",
        size_sqft: r.size_sqft || "",
        notes: r.notes || "",
        ts: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
      })),
    });
  } catch (err) {
    console.error("Error fetching requirements:", err);
    res.status(500).json({ ok: false, error: "Database fetch failed." });
  }
});

//-------------------------------------------------------------
// POST /api/operatorRequirements/manual
// Add a new operator requirement
//-------------------------------------------------------------
router.post("/operatorRequirements/manual", async (req, res) => {
  try {
    const { name, operatorId, preferredLocations, notes } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ ok: false, error: "Name is required." });
    }

    const sector = req.body.sector || "";
    const size_sqft = req.body.size_sqft || "";
    const locations = preferredLocations || "";

    const insert = await pool.query(
      `INSERT INTO operator_requirements (operator, sector, locations, size_sqft, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, operator, sector, locations, size_sqft, notes, created_at`,
      [name.trim(), sector.trim(), locations.trim(), size_sqft.trim(), notes.trim()]
    );

    const row = insert.rows[0];
    res.json({
      ok: true,
      item: {
        id: row.id,
        name: row.operator,
        sector: row.sector,
        preferredLocations: row.locations,
        size_sqft: row.size_sqft,
        notes: row.notes,
        ts: new Date(row.created_at).getTime(),
      },
    });
  } catch (err) {
    console.error("Error saving requirement:", err);
    res.status(500).json({ ok: false, error: "Database insert failed." });
  }
});

module.exports = router;
