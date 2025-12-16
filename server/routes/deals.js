// server/routes/deals.js
const express = require("express");
const router = express.Router();
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Helpers
const cleanGBP = (v) => {
  if (v === null || v === undefined) return null;
  // keep digits only
  const n = String(v).replace(/[^\d]/g, "");
  return n ? Number(n) : null;
};

// GET /api/deals  -> list
router.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, title, stage, valuegbp, sector, location, notes, updatedat
       FROM deals
       ORDER BY updatedat DESC NULLS LAST, id DESC`
    );
    return res.json({ ok: true, count: rows.length, items: rows });
  } catch (err) {
    console.error("GET /deals error", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

// POST /api/deals -> create
router.post("/", express.json(), async (req, res) => {
  try {
    const { title, stage, valueGBP, sector, location, notes } = req.body || {};
    if (!title || !String(title).trim()) {
      return res.status(400).json({ ok: false, error: "Title is required" });
    }
    const value = cleanGBP(valueGBP);
    const { rows } = await pool.query(
      `INSERT INTO deals (title, stage, valuegbp, sector, location, notes, updatedat)
       VALUES ($1,$2,$3,$4,$5,$6, NOW())
       RETURNING id, title, stage, valuegbp, sector, location, notes, updatedat`,
      [title?.trim(), stage || "New", value, sector || null, location || null, notes || null]
    );
    return res.status(201).json({ ok: true, item: rows[0] });
  } catch (err) {
    console.error("POST /deals error", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

// DELETE /api/deals/:id -> delete
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ ok: false, error: "Invalid id" });

    const { rows } = await pool.query(
      `DELETE FROM deals WHERE id = $1 RETURNING id`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ ok: false, error: "Not found" });
    return res.json({ ok: true, deletedId: id });
  } catch (err) {
    console.error("DELETE /deals/:id error", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

module.exports = router;
