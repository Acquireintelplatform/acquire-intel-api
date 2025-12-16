// server/routes/mapPins.js
const express = require("express");
const router = express.Router();
const { pool } = require("../db/pool");

// Safe JSON reader
const s = v => (typeof v === "string" ? v.trim() : "");
const toCategory = (v) =>
  ["lateFilings","leaseExpiring","foodBeverage","retail","driveThru","shoppingMalls","newProperties"]
    .includes(v) ? v : "retail";

// Ensure table exists on module load
async function ensureTable() {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS map_pins (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      address TEXT DEFAULT '',
      lat DOUBLE PRECISION NOT NULL,
      lng DOUBLE PRECISION NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS map_pins_type_idx ON map_pins(type);
    CREATE INDEX IF NOT EXISTS map_pins_latlng_idx ON map_pins(lat, lng);
  `);
}
ensureTable().catch(err => console.error("[db] ensureTable error:", err));

// GET /api/mapPins
router.get("/", async (_req, res) => {
  try {
    if (!pool) return res.json({ ok: true, count: 0, pins: [] });
    const { rows } = await pool.query(
      "SELECT id, title, type, address, lat, lng FROM map_pins ORDER BY id DESC LIMIT 1000"
    );
    return res.json({ ok: true, count: rows.length, pins: rows });
  } catch (e) {
    console.error("GET /mapPins error", e);
    return res.status(500).json({ ok: false, error: "db error" });
  }
});

// POST /api/mapPins
router.post("/", express.json(), async (req, res) => {
  try {
    if (!pool) return res.status(503).json({ ok: false, error: "db not ready" });
    const { title, type, lat, lng, address } = req.body || {};
    const clean = {
      title: s(title),
      type: toCategory(s(type)),
      address: s(address),
      lat: Number(lat),
      lng: Number(lng),
    };
    if (!clean.title) return res.status(400).json({ ok: false, error: "title required" });
    if (!Number.isFinite(clean.lat) || !Number.isFinite(clean.lng)) {
      return res.status(400).json({ ok: false, error: "lat/lng required" });
    }
    const { rows } = await pool.query(
      `INSERT INTO map_pins (title, type, address, lat, lng)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, title, type, address, lat, lng`,
      [clean.title, clean.type, clean.address, clean.lat, clean.lng]
    );
    return res.status(201).json({ ok: true, pin: rows[0] });
  } catch (e) {
    console.error("POST /mapPins error", e);
    return res.status(500).json({ ok: false, error: "db error" });
  }
});

// POST /api/mapPins/seed-demo-set
router.post("/seed-demo-set", async (_req, res) => {
  try {
    if (!pool) return res.status(503).json({ ok: false, error: "db not ready" });

    const demo = [
      { title: "Late filings demo",    type: "lateFilings",    lat: 51.5107, lng: -0.1167, address: "Strand" },
      { title: "Lease expiring demo",  type: "leaseExpiring",  lat: 51.5155, lng: -0.1419, address: "Oxford Circus" },
      { title: "F&B demo",             type: "foodBeverage",   lat: 51.5090, lng: -0.1337, address: "Piccadilly" },
      { title: "Retail demo",          type: "retail",         lat: 51.5080, lng: -0.1281, address: "Trafalgar Square" },
      { title: "Drive-thru demo",      type: "driveThru",      lat: 51.5009, lng: -0.1246, address: "Westminster" },
      { title: "Shopping malls demo",  type: "shoppingMalls",  lat: 51.5136, lng: -0.1586, address: "Marble Arch" },
      { title: "New properties demo",  type: "newProperties",  lat: 51.5079, lng: -0.0877, address: "City" },
    ];

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const d of demo) {
        await client.query(
          `INSERT INTO map_pins (title, type, address, lat, lng)
           VALUES ($1,$2,$3,$4,$5)`,
          [d.title, d.type, d.address, d.lat, d.lng]
        );
      }
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
    return res.json({ ok: true, inserted: demo.length });
  } catch (e) {
    console.error("POST /mapPins/seed-demo-set error", e);
    return res.status(500).json({ ok: false, error: "db error" });
  }
});

module.exports = router;
