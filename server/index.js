// server/index.js
/**
 * Acquire Intel API
 * - Health
 * - Google Maps pins (demo)
 * - Deal Flow: GET /api/deals, POST /api/deals, POST /api/deals/seed
 *
 * Requires env:
 *   - DATABASE_URL  (Render Postgres connection string)
 *   - CORS_ORIGIN   (your frontend origin, e.g. https://acquire-intel-engine-1.onrender.com)
 */

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const PORT = process.env.PORT || 10000;
const DATABASE_URL = process.env.DATABASE_URL;
const CORS_ORIGIN =
  process.env.CORS_ORIGIN || "https://acquire-intel-engine-1.onrender.com";

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);

/* ---------- PG Pool & bootstrap ---------- */
if (!DATABASE_URL) {
  console.warn(
    "[WARN] DATABASE_URL is not set. The API will still run, but DB calls will fail."
  );
}
const pool = DATABASE_URL
  ? new Pool({
      connectionString: DATABASE_URL,
      ssl:
        /render\.com|amazonaws\.com|herokuapp\.com/.test(DATABASE_URL) ||
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : false,
    })
  : null;

// create tables if they do not exist
async function bootstrap() {
  if (!pool) return;
  // deals
  await pool.query(`
    CREATE TABLE IF NOT EXISTS deals (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      stage TEXT NOT NULL,
      value_gbp NUMERIC NULL,
      sector TEXT NULL,
      location TEXT NULL,
      notes TEXT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // map pins (kept minimal; only for demo seeding)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS map_pins (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      lat DOUBLE PRECISION NOT NULL,
      lng DOUBLE PRECISION NOT NULL,
      address TEXT NULL
    );
  `);
}

/* ---------- helpers ---------- */
function toNumberOrNull(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function cleanDeal(body) {
  const title = (body?.title || "").trim();
  const stage = (body?.stage || "New").trim();
  const valueGBP = toNumberOrNull(body?.valueGBP);
  const sector = (body?.sector || "").trim() || null;
  const location = (body?.location || "").trim() || null;
  const notes = (body?.notes || "").trim() || null;

  return { title, stage, valueGBP, sector, location, notes };
}

/* ---------- routes ---------- */

// Health
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "acquire-intel-api", ts: Date.now() });
});

/* ====== DEAL FLOW ====== */

// GET all deals
app.get("/api/deals", async (_req, res) => {
  try {
    if (!pool) throw new Error("DB not configured");
    const { rows } = await pool.query(
      `SELECT
         id, title, stage,
         COALESCE(value_gbp, NULL) AS "valueGBP",
         sector, location, notes,
         updated_at AS "updatedAt"
       FROM deals
       ORDER BY updated_at DESC, id DESC`
    );
    res.json({ ok: true, count: rows.length, items: rows });
  } catch (err) {
    console.error("GET /api/deals error:", err);
    res.status(500).json({ ok: false, error: String(err.message || err) });
  }
});

// POST create a deal
app.post("/api/deals", async (req, res) => {
  try {
    if (!pool) throw new Error("DB not configured");

    const d = cleanDeal(req.body);
    if (!d.title) {
      return res.status(400).json({ ok: false, error: "Title is required" });
    }
    // basic stage fallback
    const stage = d.stage || "New";

    const insert = await pool.query(
      `INSERT INTO deals (title, stage, value_gbp, sector, location, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING
         id, title, stage,
         COALESCE(value_gbp, NULL) AS "valueGBP",
         sector, location, notes,
         updated_at AS "updatedAt"`,
      [d.title, stage, d.valueGBP, d.sector, d.location, d.notes]
    );

    res.json({ ok: true, item: insert.rows[0] });
  } catch (err) {
    console.error("POST /api/deals error:", err);
    res.status(500).json({ ok: false, error: String(err.message || err) });
  }
});

// POST seed demo deals
app.post("/api/deals/seed", async (_req, res) => {
  try {
    if (!pool) throw new Error("DB not configured");

    const demo = [
      [
        "Prime retail corner — Oxford Circus",
        "New",
        27500000,
        "Retail",
        "Oxford Circus, London",
        "High footfall; 10-year lease.",
      ],
      [
        "Drive-thru pad site — A406",
        "Negotiation",
        4800000,
        "Drive-thru",
        "North Circular (A406)",
        "QSR covenant required.",
      ],
      [
        "Food hall unit — Westfield",
        "Review",
        6500000,
        "Food & Beverage",
        "Westfield London",
        "Turnkey fitout; 6% yield guidance.",
      ],
      [
        "Retail park box — M25 corridor",
        "New",
        11200000,
        "Retail",
        "M25 corridor",
        "Existing A1; potential subdivision.",
      ],
      [
        "City kiosk — Liverpool Street",
        "Underwriting",
        900000,
        "Food & Beverage",
        "Liverpool Street Station",
        "Commuter trade; morning bias.",
      ],
      [
        "High street double-front — Brighton",
        "Heads",
        2100000,
        "Retail",
        "North Laine, Brighton",
        "Tourist trade; seasonal uplift.",
      ],
      [
        "Leisure box — Shopping mall",
        "Screening",
        7200000,
        "Shopping malls",
        "Regional mall",
        "Anchor adjacencies strong.",
      ],
      [
        "New build shell — Zone 2",
        "New",
        3800000,
        "New properties",
        "Zone 2 London",
        "Shell & core; capex required.",
      ],
    ];

    // optional: clear first to avoid duplicates
    await pool.query("DELETE FROM deals");

    const text =
      "INSERT INTO deals (title, stage, value_gbp, sector, location, notes) VALUES ($1,$2,$3,$4,$5,$6)";
    for (const row of demo) {
      await pool.query(text, row);
    }

    const { rows } = await pool.query(
      `SELECT
         id, title, stage,
         COALESCE(value_gbp, NULL) AS "valueGBP",
         sector, location, notes,
         updated_at AS "updatedAt"
       FROM deals
       ORDER BY updated_at DESC, id DESC`
    );

    res.json({ ok: true, count: rows.length, items: rows });
  } catch (err) {
    console.error("POST /api/deals/seed error:", err);
    res.status(500).json({ ok: false, error: String(err.message || err) });
  }
});

/* ====== (minimal) MAP PINS endpoints kept so your UI won’t break ====== */

// GET pins
app.get("/api/mapPins", async (_req, res) => {
  try {
    if (!pool) return res.json({ ok: true, count: 0, pins: [] });
    const { rows } = await pool.query(
      `SELECT id, title, type, lat, lng, address FROM map_pins`
    );
    res.json({ ok: true, count: rows.length, pins: rows });
  } catch (err) {
    console.error("GET /api/mapPins error:", err);
    res.status(500).json({ ok: false, error: String(err.message || err) });
  }
});

// POST seed pins (same demo set used earlier)
app.post("/api/mapPins/seed", async (_req, res) => {
  try {
    if (!pool) throw new Error("DB not configured");
    await pool.query("DELETE FROM map_pins");
    const demoPins = [
      ["New properties demo", "newProperties", 51.5079, -0.0877, "City"],
      ["Shopping malls demo", "shoppingMalls", 51.5136, -0.1586, "Marble Arch"],
      ["Drive-thru demo", "driveThru", 51.5089, -0.1246, "Westminster"],
      ["Retail demo", "retail", 51.508, -0.1281, "Trafalgar Square"],
      ["F&B demo", "foodBeverage", 51.509, -0.1337, "Piccadilly"],
      ["Lease expiring demo", "leaseExpiring", 51.5155, -0.1419, "Oxford Circus"],
      ["Late filings demo", "lateFilings", 51.5107, -0.1167, "Strand"],
    ];
    const sql =
      "INSERT INTO map_pins (title, type, lat, lng, address) VALUES ($1,$2,$3,$4,$5)";
    for (const p of demoPins) await pool.query(sql, p);

    const { rows } = await pool.query(
      `SELECT id, title, type, lat, lng, address FROM map_pins`
    );
    res.json({ ok: true, count: rows.length, pins: rows });
  } catch (err) {
    console.error("POST /api/mapPins/seed error:", err);
    res.status(500).json({ ok: false, error: String(err.message || err) });
  }
});

/* ---------- start ---------- */
bootstrap()
  .then(() => {
    app.listen(PORT, () => {
      console.log(
        `[server] listening on ${PORT} • CORS origin: ${CORS_ORIGIN}`
      );
    });
  })
  .catch((err) => {
    console.error("Bootstrap error:", err);
    app.listen(PORT, () => {
      console.log(
        `[server] listening on ${PORT} • CORS origin: ${CORS_ORIGIN}`
      );
    });
  });
