// server/routes/operatorRequirements.js
//-------------------------------------------------------------
// Operator Requirements Routes (CRUD + JSON only)
//-------------------------------------------------------------
const express = require("express");
const router = express.Router();
const pool = require("../db/pool");

//-------------------------------------------------------------
// GET all operator requirements
//-------------------------------------------------------------
router.get("/operatorRequirements", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM operator_requirements ORDER BY id DESC");
    res.json({ ok: true, count: result.rowCount, items: result.rows });
  } catch (err) {
    console.error("GET /api/operatorRequirements error", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

//-------------------------------------------------------------
// POST create new requirement
//-------------------------------------------------------------
router.post("/operatorRequirements", async (req, res) => {
  try {
    const { operator_name, sector, locations, size_sqft, notes } = req.body;

    const result = await pool.query(
      `INSERT INTO operator_requirements (operator_name, sector, locations, size_sqft, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [operator_name, sector, locations, size_sqft, notes]
    );

    res.json({ ok: true, item: result.rows[0] });
  } catch (err) {
    console.error("POST /api/operatorRequirements error", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

//-------------------------------------------------------------
// PUT update existing requirement
//-------------------------------------------------------------
router.put("/operatorRequirements/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { operator_name, sector, locations, size_sqft, notes } = req.body;

    const result = await pool.query(
      `UPDATE operator_requirements
       SET operator_name=$1, sector=$2, locations=$3, size_sqft=$4, notes=$5, updated_at=NOW()
       WHERE id=$6 RETURNING *`,
      [operator_name, sector, locations, size_sqft, notes, id]
    );

    res.json({ ok: true, item: result.rows[0] });
  } catch (err) {
    console.error("PUT /api/operatorRequirements/:id error", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

//-------------------------------------------------------------
// DELETE a requirement
//-------------------------------------------------------------
router.delete("/operatorRequirements/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM operator_requirements WHERE id=$1", [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/operatorRequirements/:id error", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
