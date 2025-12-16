// server/routes/deals.js
// CRUD for "deals" (opportunities) backed by Postgres

const express = require("express");
const { Pool } = require("pg");

const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Render PG usually needs SSL in prod:
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

// Ensure table exists
async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS deals (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      stage TEXT,
      address TEXT,
      lat DOUBLE PRECISION,
      lng DOUBLE PRECISION,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}
ensureTable().catch((e) => console.error("[deals] ensureTable error:", e));

// Helpers
const cleanStr = (v) => (typeof v === "string" ? v.trim() : "");
const cleanNum = (v) => (v === null || v === undefined || v === "" ? null : Number(v));

// LIST
router.get("/", async (_req, res) => {
  try {
    const r = await pool.query(`SELECT * FROM deals ORDER BY created_at DESC, id DESC;`);
    res.json({ ok: true, count: r.rowCount, items: r.rows });
  } catch (e) {
    console.error("[deals] GET error:", e);
    res.status(500).json({ ok: false, error: "list_failed" });
  }
});

// CREATE
router.post("/", express.json(), async (req, res) => {
  try {
    const { title, stage, address, lat, lng, notes } = req.body || {};
    const t = cleanStr(title);
    if (!t) return res.status(400).json({ ok: false, error: "title_required" });

    const r = await pool.query(
      `INSERT INTO deals (title, stage, address, lat, lng, notes)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *;`,
      [t, cleanStr(stage), cleanStr(address), cleanNum(lat), cleanNum(lng), cleanStr(notes)]
    );
    res.status(201).json({ ok: true, item: r.rows[0] });
  } catch (e) {
    console.error("[deals] POST error:", e);
    res.status(500).json({ ok: false, error: "create_failed" });
  }
});

// UPDATE
router.put("/:id", express.json(), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ ok: false, error: "bad_id" });

    const { title, stage, address, lat, lng, notes } = req.body || {};
    const r = await pool.query(
      `UPDATE deals
       SET title = COALESCE($1, title),
           stage = COALESCE($2, stage),
           address = COALESCE($3, address),
           lat = COALESCE($4, lat),
           lng = COALESCE($5, lng),
           notes = COALESCE($6, notes)
       WHERE id = $7
       RETURNING *;`,
      [
        title !== undefined ? cleanStr(title) : null,
        stage !== undefined ? cleanStr(stage) : null,
        address !== undefined ? cleanStr(address) : null,
        lat !== undefined ? cleanNum(lat) : null,
        lng !== undefined ? cleanNum(lng) : null,
        notes !== undefined ? cleanStr(notes) : null,
        id,
      ]
    );
    if (r.rowCount === 0) return res.status(404).json({ ok: false, error: "not_found" });
    res.json({ ok: true, item: r.rows[0] });
  } catch (e) {
    console.error("[deals] PUT error:", e);
    res.status(500).json({ ok: false, error: "update_failed" });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ ok: false, error: "bad_id" });
    const r = await pool.query(`DELETE FROM deals WHERE id = $1;`, [id]);
    if (r.rowCount === 0) return res.status(404).json({ ok: false, error: "not_found" });
    res.json({ ok: true });
  } catch (e) {
    console.error("[deals] DELETE error:", e);
    res.status(500).json({ ok: false, error: "delete_failed" });
  }
});

module.exports = router;
