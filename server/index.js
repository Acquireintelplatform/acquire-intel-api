// server/index.js
/**
 * Acquire Intel API — SINGLE FILE CONSOLIDATED
 * Routes:
 *  - Health
 *  - Deals:       GET/POST/PUT/DELETE/SEED
 *  - Map Pins:    GET/POST/PUT/DELETE/SEED
 *  - Requirements GET/POST/PUT/DELETE/CSV (text)
 *  - SavedSearch  GET/POST/DELETE
 *
 * Env (Render):
 *  - DATABASE_URL
 *  - CORS_ORIGIN = https://acquire-intel-engine-1.onrender.com
 */

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const PORT = process.env.PORT || 10000;
const DATABASE_URL = process.env.DATABASE_URL;
const CORS_ORIGIN =
  process.env.CORS_ORIGIN || "https://acquire-intel-engine-1.onrender.com";

const app = express();
app.use(express.json({ limit: "2mb" })); // JSON & CSV text
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);

/* ---------- PG Pool & bootstrap ---------- */
if (!DATABASE_URL) {
  console.warn("[WARN] DATABASE_URL is not set");
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

  // map pins
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

  // operator requirements
  await pool.query(`
    CREATE TABLE IF NOT EXISTS operator_requirements (
      id SERIAL PRIMARY KEY,
      operator_id TEXT NULL,
      name TEXT NOT NULL,
      preferred_locations TEXT NULL,
      notes TEXT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // saved searches
  await pool.query(`
    CREATE TABLE IF NOT EXISTS saved_searches (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      location TEXT NULL,
      sector TEXT NULL,
      min_value_gbp NUMERIC NULL,
      max_value_gbp NUMERIC NULL,
      keywords TEXT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

/* ---------- helpers ---------- */
function n(v) {
  if (v === null || v === undefined || v === "") return null;
  const t = typeof v === "string" ? v.replace(/[, ]/g, "") : v;
  const num = Number(t);
  return Number.isFinite(num) ? num : null;
}
const s = (v) => (typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim());

/* ---------- health ---------- */
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "acquire-intel-api", ts: Date.now() });
});

/* =========================================================
   DEALS
========================================================= */
app.get("/api/deals", async (_req, res) => {
  try {
    if (!pool) throw new Error("DB not configured");
    const { rows } = await pool.query(
      `SELECT id, title, stage,
              COALESCE(value_gbp, NULL) AS "valueGBP",
              sector, location, notes,
              updated_at AS "updatedAt"
       FROM deals
       ORDER BY updated_at DESC, id DESC`
    );
    res.json({ ok: true, count: rows.length, items: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});

app.post("/api/deals", async (req, res) => {
  try {
    if (!pool) throw new Error("DB not configured");
    const title = s(req.body?.title);
    if (!title) return res.status(400).json({ ok: false, error: "Title required" });
    const stage = s(req.body?.stage) || "New";
    const value_gbp = n(req.body?.valueGBP);
    const sector = s(req.body?.sector) || null;
    const location = s(req.body?.location) || null;
    const notes = s(req.body?.notes) || null;

    const q = await pool.query(
      `INSERT INTO deals (title, stage, value_gbp, sector, location, notes)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, title, stage,
         COALESCE(value_gbp, NULL) AS "valueGBP",
         sector, location, notes, updated_at AS "updatedAt"`,
      [title, stage, value_gbp, sector, location, notes]
    );
    res.json({ ok: true, item: q.rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});

app.put("/api/deals/:id", async (req, res) => {
  try {
    if (!pool) throw new Error("DB not configured");
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ ok: false, error: "Bad id" });

    const title = s(req.body?.title);
    const stage = s(req.body?.stage) || "New";
    const value_gbp = n(req.body?.valueGBP);
    const sector = s(req.body?.sector) || null;
    const location = s(req.body?.location) || null;
    const notes = s(req.body?.notes) || null;

    const q = await pool.query(
      `UPDATE deals SET
         title = $1, stage = $2, value_gbp = $3, sector = $4, location = $5, notes = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING id, title, stage,
         COALESCE(value_gbp, NULL) AS "valueGBP",
         sector, location, notes, updated_at AS "updatedAt"`,
      [title, stage, value_gbp, sector, location, notes, id]
    );
    res.json({ ok: true, item: q.rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});

app.delete("/api/deals/:id", async (req, res) => {
  try {
    if (!pool) throw new Error("DB not configured");
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ ok: false, error: "Bad id" });
    const del = await pool.query(`DELETE FROM deals WHERE id = $1`, [id]);
    res.json({ ok: true, deleted: del.rowCount });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});

app.post("/api/deals/seed", async (_req, res) => {
  try {
    if (!pool) throw new Error("DB not configured");
    await pool.query("DELETE FROM deals");
    const demo = [
      ["Prime retail corner — Oxford Circus", "New", 27500000, "Retail", "Oxford Circus, London", "High footfall; 10-year lease."],
      ["Drive-thru pad site — A406", "Negotiation", 4800000, "Drive-thru", "North Circular (A406)", "QSR covenant required."],
      ["Food hall unit — Westfield", "Review", 6500000, "Food & Beverage", "Westfield London", "Turnkey fitout; 6% yield guidance."],
      ["Retail park box — M25 corridor", "New", 11200000, "Retail", "M25 corridor", "Existing A1; potential subdivision."],
      ["City kiosk — Liverpool Street", "Underwriting", 900000, "Food & Beverage", "Liverpool Street Station", "Commuter trade; morning bias."],
      ["High street double-front — Brighton", "Heads", 2100000, "Retail", "North Laine, Brighton", "Tourist trade; seasonal uplift."],
      ["Leisure box — Shopping mall", "Screening", 7200000, "Shopping malls", "Regional mall", "Anchor adjacencies strong."],
      ["New build shell — Zone 2", "New", 3800000, "New properties", "Zone 2 London", "Shell & core; capex required."],
    ];
    const text = "INSERT INTO deals (title, stage, value_gbp, sector, location, notes) VALUES ($1,$2,$3,$4,$5,$6)";
    for (const row of demo) await pool.query(text, row);

    const { rows } = await pool.query(
      `SELECT id, title, stage, COALESCE(value_gbp,NULL) AS "valueGBP",
              sector, location, notes, updated_at AS "updatedAt"
       FROM deals ORDER BY updated_at DESC, id DESC`
    );
    res.json({ ok: true, count: rows.length, items: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});

/* =========================================================
   MAP PINS
========================================================= */
app.get("/api/mapPins", async (_req, res) => {
  try {
    if (!pool) return res.json({ ok: true, count: 0, pins: [] });
    const { rows } = await pool.query(`SELECT id, title, type, lat, lng, address FROM map_pins`);
    res.json({ ok: true, count: rows.length, pins: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});

app.post("/api/mapPins", async (req, res) => {
  try {
    if (!pool) throw new Error("DB not configured");
    const title = s(req.body?.title);
    const type = s(req.body?.type);
    const lat = Number(req.body?.lat);
    const lng = Number(req.body?.lng);
    const address = s(req.body?.address) || null;
    if (!title || !type || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ ok: false, error: "title,type,lat,lng required" });
    }
    const q = await pool.query(
      `INSERT INTO map_pins (title, type, lat, lng, address)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, title, type, lat, lng, address`,
      [title, type, lat, lng, address]
    );
    res.json({ ok: true, pin: q.rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});

app.put("/api/mapPins/:id", async (req, res) => {
  try {
    if (!pool) throw new Error("DB not configured");
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ ok: false, error: "Bad id" });

    const title = s(req.body?.title);
    const type = s(req.body?.type);
    const lat = Number(req.body?.lat);
    const lng = Number(req.body?.lng);
    const address = s(req.body?.address) || null;

    const q = await pool.query(
      `UPDATE map_pins SET title=$1,type=$2,lat=$3,lng=$4,address=$5
       WHERE id=$6
       RETURNING id, title, type, lat, lng, address`,
      [title, type, lat, lng, address, id]
    );
    res.json({ ok: true, pin: q.rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});

app.delete("/api/mapPins/:id", async (req, res) => {
  try {
    if (!pool) throw new Error("DB not configured");
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ ok: false, error: "Bad id" });
    const del = await pool.query(`DELETE FROM map_pins WHERE id=$1`, [id]);
    res.json({ ok: true, deleted: del.rowCount });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});

app.post("/api/mapPins/seed", async (_req, res) => {
  try {
    if (!pool) throw new Error("DB not configured");
    await pool.query("DELETE FROM map_pins");
    const demoPins = [
      ["New properties demo", "newProperties", 51.5079, -0.0877, "City"],
      ["Shopping malls demo", "shoppingMalls", 51.5136, -0.1586, "Marble Arch"],
      ["Drive-thru demo", "driveThru", 51.5009, -0.1246, "Westminster"],
      ["Retail demo", "retail", 51.508, -0.1281, "Trafalgar Square"],
      ["F&B demo", "foodBeverage", 51.509, -0.1337, "Piccadilly"],
      ["Lease expiring demo", "leaseExpiring", 51.5155, -0.1419, "Oxford Circus"],
      ["Late filings demo", "lateFilings", 51.5107, -0.1167, "Strand"],
    ];
    const sql = "INSERT INTO map_pins (title, type, lat, lng, address) VALUES ($1,$2,$3,$4,$5)";
    for (const p of demoPins) await pool.query(sql, p);

    const { rows } = await pool.query(`SELECT id, title, type, lat, lng, address FROM map_pins`);
    res.json({ ok: true, count: rows.length, pins: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});

/* =========================================================
   REQUIREMENTS
========================================================= */
app.get("/api/operatorRequirements", async (_req, res) => {
  try {
    if (!pool) throw new Error("DB not configured");
    const { rows } = await pool.query(
      `SELECT id,
              operator_id  AS "operatorId",
              name,
              preferred_locations AS "preferredLocations",
              notes,
              created_at AS "createdAt"
       FROM operator_requirements
       ORDER BY created_at DESC, id DESC`
    );
    res.json({ ok: true, count: rows.length, items: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});

app.post("/api/operatorRequirements", async (req, res) => {
  try {
    if (!pool) throw new Error("DB not configured");
    const name = s(req.body?.name);
    if (!name) return res.status(400).json({ ok: false, error: "name required" });
    const operatorId = s(req.body?.operatorId) || null;
    const preferredLocations = s(req.body?.preferredLocations) || null;
    const notes = s(req.body?.notes) || null;

    const q = await pool.query(
      `INSERT INTO operator_requirements (operator_id, name, preferred_locations, notes)
       VALUES ($1,$2,$3,$4)
       RETURNING id, operator_id AS "operatorId", name, preferred_locations AS "preferredLocations",
                 notes, created_at AS "createdAt"`,
      [operatorId, name, preferredLocations, notes]
    );
    res.json({ ok: true, item: q.rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});

app.put("/api/operatorRequirements/:id", async (req, res) => {
  try {
    if (!pool) throw new Error("DB not configured");
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ ok: false, error: "Bad id" });
    const name = s(req.body?.name);
    if (!name) return res.status(400).json({ ok: false, error: "name required" });
    const operatorId = s(req.body?.operatorId) || null;
    const preferredLocations = s(req.body?.preferredLocations) || null;
    const notes = s(req.body?.notes) || null;

    const q = await pool.query(
      `UPDATE operator_requirements
       SET operator_id=$1, name=$2, preferred_locations=$3, notes=$4
       WHERE id=$5
       RETURNING id, operator_id AS "operatorId", name, preferred_locations AS "preferredLocations",
                 notes, created_at AS "createdAt"`,
      [operatorId, name, preferredLocations, notes, id]
    );
    res.json({ ok: true, item: q.rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});

app.delete("/api/operatorRequirements/:id", async (req, res) => {
  try {
    if (!pool) throw new Error("DB not configured");
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ ok: false, error: "Bad id" });
    const del = await pool.query(`DELETE FROM operator_requirements WHERE id=$1`, [id]);
    res.json({ ok: true, deleted: del.rowCount });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});

// CSV upload (simple: body = { csv: "<text>" })
app.post("/api/operatorRequirements/uploadCsv", async (req, res) => {
  try {
    if (!pool) throw new Error("DB not configured");
    const csv = s(req.body?.csv);
    if (!csv) return res.status(400).json({ ok: false, error: "csv text required" });

    const rows = parseCsvSimple(csv); // [{name, operatorId, preferredLocations, notes}]
    let inserted = 0;
    for (const r of rows) {
      const name = s(r.name);
      if (!name) continue;
      const operatorId = s(r.operatorId) || null;
      const preferredLocations = s(r.preferredLocations) || null;
      const notes = s(r.notes) || null;
      await pool.query(
        `INSERT INTO operator_requirements (operator_id, name, preferred_locations, notes)
         VALUES ($1,$2,$3,$4)`,
        [operatorId, name, preferredLocations, notes]
      );
      inserted++;
    }
    res.json({ ok: true, inserted });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});

function parseCsvSimple(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) return [];
  const header = splitCsvLine(lines[0]).map((h) => h.trim());
  const out = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    const o = {};
    header.forEach((h, idx) => (o[h] = cols[idx] ?? ""));
    out.push(o);
  }
  return out;
}
function splitCsvLine(line) {
  const arr = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' && (i === 0 || line[i - 1] !== "\\")) {
      q = !q;
      continue;
    }
    if (ch === "," && !q) {
      arr.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  arr.push(cur);
  return arr.map((x) => x.replace(/\\"/g, '"').trim());
}

/* =========================================================
   SAVED SEARCHES
========================================================= */
app.get("/api/searches", async (_req, res) => {
  try {
    if (!pool) throw new Error("DB not configured");
    const { rows } = await pool.query(
      `SELECT id, title, location, sector,
              COALESCE(min_value_gbp,NULL) AS "minValueGBP",
              COALESCE(max_value_gbp,NULL) AS "maxValueGBP",
              keywords, created_at AS "createdAt"
       FROM saved_searches
       ORDER BY created_at DESC, id DESC`
    );
    res.json({ ok: true, count: rows.length, items: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});

app.post("/api/searches", async (req, res) => {
  try {
    if (!pool) throw new Error("DB not configured");
    const title = s(req.body?.title);
    if (!title) return res.status(400).json({ ok: false, error: "title required" });
    const location = s(req.body?.location) || null;
    const sector = s(req.body?.sector) || null;
    const minValue = n(req.body?.minValueGBP);
    const maxValue = n(req.body?.maxValueGBP);
    const keywords = s(req.body?.keywords) || null;

    const q = await pool.query(
      `INSERT INTO saved_searches (title, location, sector, min_value_gbp, max_value_gbp, keywords)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, title, location, sector,
                 COALESCE(min_value_gbp,NULL) AS "minValueGBP",
                 COALESCE(max_value_gbp,NULL) AS "maxValueGBP",
                 keywords, created_at AS "createdAt"`,
      [title, location, sector, minValue, maxValue, keywords]
    );
    res.json({ ok: true, item: q.rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});

app.delete("/api/searches/:id", async (req, res) => {
  try {
    if (!pool) throw new Error("DB not configured");
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ ok: false, error: "Bad id" });
    const del = await pool.query(`DELETE FROM saved_searches WHERE id=$1`, [id]);
    res.json({ ok: true, deleted: del.rowCount });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});

/* ---------- start ---------- */
bootstrap()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[server] listening on ${PORT} • CORS origin: ${CORS_ORIGIN}`);
    });
  })
  .catch((err) => {
    console.error("Bootstrap error:", err);
    app.listen(PORT, () => {
      console.log(`[server] listening on ${PORT} • CORS origin: ${CORS_ORIGIN}`);
    });
  });
