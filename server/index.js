// server/index.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { Pool } = require('pg');
const { parse } = require('csv-parse/sync');

const app = express();

/* ---------- Config ---------- */
const PORT = process.env.PORT || 10000;
const FRONTEND_ORIGIN = process.env.CORS_ORIGIN || 'https://acquire-intel-engine-1.onrender.com';

// Render Postgres URL (set on Render → acquire-intel-api → Environment)
const DB_URL =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRESQL_URL ||
  process.env.PG_CONNECTION_STRING;

if (!DB_URL) {
  console.warn('⚠️ DATABASE_URL env var is missing. Set it on Render.');
}

const pool = new Pool({
  connectionString: DB_URL,
  ssl: DB_URL && !DB_URL.includes('localhost') ? { rejectUnauthorized: false } : false,
});

/* ---------- Middleware ---------- */
app.use(cors({ origin: FRONTEND_ORIGIN === '*' ? true : FRONTEND_ORIGIN }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

/* ---------- Schema bootstrap ---------- */
async function ensureSchema() {
  await pool.query(`
    create table if not exists operator_requirements (
      id bigserial primary key,
      name text not null,
      category text,
      min_sqft integer,
      max_sqft integer,
      use_class text,
      preferred_locations text,  -- store as "London; Birmingham"
      notes text,
      created_at timestamptz default now()
    );
  `);
  console.log('✅ DB schema ready');
}

/* ---------- Helpers ---------- */
function toDbRow(input) {
  // accepts strings or numbers; trims and normalizes
  const clean = (v) => (typeof v === 'string' ? v.trim() : v);
  const n = (v) => {
    const x = Number(v);
    return Number.isFinite(x) ? x : null;
  };

  return {
    name: clean(input.name || input.operatorName || ''),
    category: clean(input.category || ''),
    min_sqft: n(input.minSqft),
    max_sqft: n(input.maxSqft),
    use_class: clean(input.useClass || ''),
    preferred_locations: Array.isArray(input.preferredLocations)
      ? input.preferredLocations.join('; ')
      : clean(input.preferredLocations || ''),
    notes: clean(input.notes || ''),
  };
}

async function insertRequirement(row) {
  const q = `
    insert into operator_requirements
      (name, category, min_sqft, max_sqft, use_class, preferred_locations, notes)
    values ($1,$2,$3,$4,$5,$6,$7)
    returning id, name, category, min_sqft, max_sqft, use_class, preferred_locations, notes, created_at
  `;
  const vals = [
    row.name,
    row.category || null,
    row.min_sqft,
    row.max_sqft,
    row.use_class || null,
    row.preferred_locations || null,
    row.notes || null,
  ];
  const { rows } = await pool.query(q, vals);
  return rows[0];
}

/* ---------- Routes ---------- */

// Health
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('select 1');
    res.json({ status: 'ok', base: 'production', db: 'ok', time: Date.now() });
  } catch (e) {
    res.status(500).json({ status: 'error', db: 'fail', error: String(e.message || e) });
  }
});

// Operators (stub for dropdown)
app.get('/api/operators', (_req, res) => {
  res.json([{ id: 1, name: "Nando's" }]);
});

// Manual list (latest 50)
app.get('/api/operatorRequirements/manual', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `select id, name, category, min_sqft, max_sqft, use_class, preferred_locations, notes, created_at
       from operator_requirements
       order by created_at desc
       limit 50`
    );
    res.json({ status: 'ok', items: rows });
  } catch (e) {
    res.status(500).json({ status: 'error', error: String(e.message || e) });
  }
});

// Manual create (saves to DB)
app.post('/api/operatorRequirements/manual', async (req, res) => {
  try {
    const row = toDbRow(req.body || {});
    if (!row.name) return res.status(400).json({ status: 'error', message: 'name is required' });
    const saved = await insertRequirement(row);
    res.json({ status: 'ok', item: saved });
  } catch (e) {
    res.status(500).json({ status: 'error', error: String(e.message || e) });
  }
});

// CSV upload (multipart/form-data with field "file")
app.post('/api/operatorCsvUpload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ status: 'error', message: 'No file uploaded' });

    const text = req.file.buffer.toString('utf8');
    const records = parse(text, {
      columns: (h) => h.map((x) => String(x).trim()),
      skip_empty_lines: true,
      trim: true,
    });

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ status: 'error', message: 'CSV has no rows' });
    }

    // Normalize headers (case-insensitive)
    const reqHeaders = ['name', 'category', 'minSqft', 'maxSqft', 'useClass', 'preferredLocations', 'notes'];
    const headerKeys = Object.keys(records[0]);
    const missing = reqHeaders.filter(
      (h) => !headerKeys.some((k) => k.replace(/\s+/g, '').toLowerCase() === h.toLowerCase())
    );
    if (missing.length) {
      return res.status(400).json({ status: 'error', message: 'Invalid CSV headers', missing, got: headerKeys });
    }

    // Insert rows
    let inserted = 0;
    for (const r of records) {
      const mapped = {
        name: r.name ?? r.Name ?? r.operatorName ?? r.operator_name,
        category: r.category ?? r.Category,
        minSqft: r.minSqft ?? r.min_sq_ft ?? r.min_sqft ?? r['min sq ft'],
        maxSqft: r.maxSqft ?? r.max_sq_ft ?? r.max_sqft ?? r['max sq ft'],
        useClass: r.useClass ?? r.use_class ?? r['use class'],
        preferredLocations:
          r.preferredLocations ??
          r.preferred_locations ??
          r['preferred locations'] ??
          r.locations ??
          '',
        notes: r.notes ?? r.Notes ?? '',
      };

      const row = toDbRow(mapped);
      if (!row.name) continue; // skip bad lines quietly
      await insertRequirement(row);
      inserted++;
    }

    res.json({ status: 'ok', imported: inserted });
  } catch (e) {
    res.status(500).json({ status: 'error', error: String(e.message || e) });
  }
});

// 404 fallback (debug)
app.use((req, res) => res.status(404).json({ status: 'error', message: 'Not Found', path: req.originalUrl }));

/* ---------- Start ---------- */
ensureSchema()
  .then(() => app.listen(PORT, () => console.log(`API listening on :${PORT}`)))
  .catch((e) => {
    console.error('Schema init failed:', e);
    process.exit(1);
  });

module.exports = app;
