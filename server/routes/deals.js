// server/routes/deals.js
//-------------------------------------------------------------
// Acquire Intel — Deals API Routes (CRUD + Seed)
//-------------------------------------------------------------
const express = require("express");
const router = express.Router();
const pool = require("../db/pool"); // ✅ Correct import

//-------------------------------------------------------------
// GET all deals
//-------------------------------------------------------------
router.get("/deals", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM deals ORDER BY id DESC");
    res.json({ ok: true, count: result.rowCount, items: result.rows });
  } catch (err) {
    console.error("GET /api/deals error", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

//-------------------------------------------------------------
// POST create new deal
//-------------------------------------------------------------
router.post("/deals", async (req, res) => {
  try {
    const { title, stage, value_gbp, sector, location, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO deals (title, stage, value_gbp, sector, location, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [title, stage, value_gbp, sector, location, notes]
    );
    res.json({ ok: true, item: result.rows[0] });
  } catch (err) {
    console.error("POST /api/deals error", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

//-------------------------------------------------------------
// PUT update deal
//-------------------------------------------------------------
router.put("/deals/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, stage, value_gbp, sector, location, notes } = req.body;

    const result = await pool.query(
      `UPDATE deals 
       SET title=$1, stage=$2, value_gbp=$3, sector=$4, location=$5, notes=$6, updated_at=NOW() 
       WHERE id=$7 RETURNING *`,
      [title, stage, value_gbp, sector, location, notes, id]
    );

    res.json({ ok: true, item: result.rows[0] });
  } catch (err) {
    console.error("PUT /api/deals/:id error", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

//-------------------------------------------------------------
// DELETE a deal
//-------------------------------------------------------------
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

//-------------------------------------------------------------
// SEED demo deals
//-------------------------------------------------------------
router.post("/deals/seed", async (req, res) => {
  try {
    await pool.query("DELETE FROM deals");
    const sampleData = [
      ["New build shell – Zone 2", "New", 3800000, "New properties", "Zone 2 London", "Shell & core; capex required."],
      ["Leisure box – Shopping mall", "Screening", 7200000, "Shopping malls", "Regional mall", "Anchor adjacencies strong."],
      ["High street double-front – Brighton", "Heads", 2100000, "Retail", "North Laine, Brighton", "Tourist trade, seasonal uplift."],
      ["City kiosk – Liverpool Street", "Underwriting", 900000, "Food & Beverage", "Liverpool Street Station", "Commuter trade; morning bias."],
      ["Retail park box – M25", "New", 11200000, "Retail", "M25 corridor", "Existing A1; potential rebuild."],
      ["Food hall unit – Westfield", "Review", 6500000, "Food & Beverage", "Westfield London", "Turnkey fitout; 6% yield guidance."],
      ["Drive-thru pad site – North Circular", "Negotiation", 4800000, "Drive-thru", "North Circular (A406)", "QSR covenant sought."],
      ["Prime retail corner – Oxford Circus", "New", 27500000, "Retail", "Oxford Circus, London", "High footfall; 10-year lease."]
    ];

    for (const d of sampleData) {
      await pool.query(
        `INSERT INTO deals (title, stage, value_gbp, sector, location, notes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        d
      );
    }

    const result = await pool.query("SELECT * FROM deals ORDER BY id DESC");
    res.json({ ok: true, count: result.rowCount, items: result.rows });
  } catch (err) {
    console.error("POST /api/deals/seed error", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
