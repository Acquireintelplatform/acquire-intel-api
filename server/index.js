// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// CORS — allow your frontend only
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: '5mb' }));
// Accept raw CSV text sent with Content-Type: text/csv
app.use(express.text({ type: ['text/csv', 'text/plain'], limit: '5mb' }));

// ----------------------------------------------------
// In-memory store (simple + good enough for now)
// Everything (manual entries + CSV imports) lands here
// so the “Recent Manual Entries” table can display them.
// ----------------------------------------------------
const requirementsStore = [];

// small helper to normalize a requirement row
function normalizeReq(row) {
  // expected columns:
  // name,category,minSqft,maxSqft,useClass,preferredLocations,notes
  return {
    name: (row.name || '').trim(),
    category: (row.category || '').trim(),
    minSqft: Number(row.minSqft || 0) || 0,
    maxSqft: Number(row.maxSqft || 0) || 0,
    useClass: (row.useClass || '').trim(),
    preferredLocations: (row.preferredLocations || '').trim(),
    notes: (row.notes || '').trim(),
    createdUtc: new Date().toISOString()
  };
}

// very basic CSV parser for our known header
function parseCsv(csvText) {
  // normalize newlines
  const lines = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim() !== '');
  if (lines.length < 2) return [];

  const header = lines[0].split(',').map(h => h.trim());
  const idx = {
    name: header.indexOf('name'),
    category: header.indexOf('category'),
    minSqft: header.indexOf('minSqft'),
    maxSqft: header.indexOf('maxSqft'),
    useClass: header.indexOf('useClass'),
    preferredLocations: header.indexOf('preferredLocations'),
    notes: header.indexOf('notes')
  };

  // guard: required columns present
  if (idx.name === -1 || idx.category === -1 || idx.minSqft === -1 || idx.maxSqft === -1) {
    return [];
  }

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(','); // (simple split; our sample CSV doesn’t have quoted commas)
    const row = {
      name: cols[idx.name] ?? '',
      category: cols[idx.category] ?? '',
      minSqft: cols[idx.minSqft] ?? '',
      maxSqft: cols[idx.maxSqft] ?? '',
      useClass: idx.useClass >= 0 ? (cols[idx.useClass] ?? '') : '',
      preferredLocations: idx.preferredLocations >= 0 ? (cols[idx.preferredLocations] ?? '') : '',
      notes: idx.notes >= 0 ? (cols[idx.notes] ?? '') : ''
    };
    rows.push(normalizeReq(row));
  }
  return rows;
}

// --------------------
// Health + operators
// --------------------
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', base: process.env.RENDER ? 'production' : 'local', time: Date.now() });
});

// TEMP operator list for dropdown
app.get('/api/operators', (req, res) => {
  res.json([{ id: 1, name: "Nando's" }]);
});

// ---------------------------------------
// Manual requirements (UI already uses it)
// ---------------------------------------
app.get('/api/operatorRequirements/manual', (req, res) => {
  res.json(requirementsStore);
});

app.post('/api/operatorRequirements/manual', (req, res) => {
  const body = req.body || {};
  const row = normalizeReq(body);
  requirementsStore.push(row);
  res.json({ ok: true, added: 1 });
});

// ---------------------------------------
// CSV upload (now REAL: parses & inserts)
// The frontend sends text with Content-Type: text/csv
// ---------------------------------------
app.post('/api/operatorCsvUpload', (req, res) => {
  // req.body will be the CSV text (because of express.text above)
  const csvText = typeof req.body === 'string' ? req.body : '';
  if (!csvText.trim()) {
    return res.status(400).json({ ok: false, error: 'No CSV body' });
  }

  const rows = parseCsv(csvText);
  if (rows.length === 0) {
    return res.status(400).json({ ok: false, error: 'CSV empty or invalid header' });
  }
  for (const r of rows) requirementsStore.push(r);

  res.json({ ok: true, imported: rows.length });
});

// ----------------------------------------------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`API listening on :${PORT}`);
});
