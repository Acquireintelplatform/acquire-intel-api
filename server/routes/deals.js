// server/routes/deals.js
//------------------------------------------------
// Deal Flow routes for Acquire Intel
//------------------------------------------------
const express = require("express");
const router = express.Router();
const pool = require("../db"); // adjust path if your db file lives elsewhere

//------------------------------------------------
// GET all deals
//------------------------------------------------
router.get("/deals", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM deals ORDER BY id DESC");
    res.json({ ok: true, count: result.rowCount, items: result.rows });
  } catch (err) {
    console.error("GET /api/deals error", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

//------------------------------------------------
// POST new deal
//------------------------------------------------
router.post("/deals", async (req, res) => {
  try {
    const { title, stage, value_gbp, sector, location, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO deals (title, stage, value_gbp, sector, location, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [title, stage, value_gbp, sector, location, notes]
    );
    res.json({ ok: true, item: result.rows[0] });
  } catch (err) {
    console.error("POST /api/deals error", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

//------------------------------------------------
// PUT update existing deal
//------------------------------------------------
router.put("/deals/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, stage, value_gbp, sector, location, notes } = req.body;

    const result = await pool.query(
      `UPDATE deals
         SET title=$1, stage=$2, value_gbp=$3, sector=$4,
             location=$5, notes=$6, updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [title, stage, value_gbp, sector, location, notes, id]
    );

    res.json({ ok: true, item: result.rows[0] });
  } catch (err) {
    console.error("PUT /api/deals/:id error", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

//------------------------------------------------
// DELETE deal by id
//------------------------------------------------
router.delete("/deals/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM deals WHERE id=$1", [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/deals/:id error", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

//------------------------------------------------
module.exports = router;
