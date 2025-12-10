// server/index.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 10000;

// CORS: allow your deployed frontend
const FRONTEND = process.env.CORS_ORIGIN || 'https://acquire-intel-engine-1.onrender.com';
app.use(cors({ origin: FRONTEND === '*' ? true : FRONTEND }));
app.use(express.json({ limit: '10mb' }));

/* ---------------- In-memory store (works immediately) ---------------- */
const requirementsStore = []; // ← both Manual + CSV go here

function normalizeReq(row = {}) {
  const clean = v => (typeof v === 'string' ? v.trim() : v);
  const num = v => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  return {
    id: requirementsStore.length + 1,
    name: clean(row.name || row.operatorName || ''),
    category: clean(row.category || ''),
    minSqft: num(row.minSqft),
    maxSqft: num(row.maxSqft),
    useClass: clean(row.useClass || ''),
    preferredLocations: clean(
      Array.isArray(row.preferredLocations) ? row.preferredLocations.join('; ') : row.preferredLocations || ''
    ),
    notes: clean(row.notes || ''),
    createdAt: new Date().toISOString(),
  };
}

/* ---------------- Health + dropdown (keep UI happy) ------------------ */
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', base: 'production', time: Date.now() });
});
app.get('/api/operators', (_req, res) => {
  res.json([{ id: 1, name: "Nando's" }]);
});

/* ---------------- Manual requirements (UI uses these) ----------------- */
// IMPORTANT: return a plain ARRAY (UI expects array, not wrapped)
app.get('/api/operatorRequirements/manual', (_req, res) => {
  res.json(requirementsStore.slice(-50).reverse());
});

app.post('/api/operatorRequirements/manual', (req, res) => {
  const item = normalizeReq(req.body || {});
  if (!item.name) return res.status(400).json({ message: 'name is required' });
  requirementsStore.push(item);
  return res.json({ ok: true, item });
});

/* ---------------- CSV upload (multipart: field name "file") ----------- */
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

app.post('/api/operatorCsvUpload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded (field must be "file")' });

  const text = req.file.buffer.toString('utf8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = text.split('\n').filter(l => l.trim() !== '');
  if (lines.length < 2) return res.status(400).json({ message: 'CSV has no data rows' });

  // expected header:
  // name,category,minSqft,maxSqft,useClass,preferredLocations,notes
  const header = lines[0].split(',').map(h => h.trim());
  const idx = {
    name: header.indexOf('name'),
    category: header.indexOf('category'),
    minSqft: header.indexOf('minSqft'),
    maxSqft: header.indexOf('maxSqft'),
    useClass: header.indexOf('useClass'),
    preferredLocations: header.indexOf('preferredLocations'),
    notes: header.indexOf('notes'),
  };
  if (idx.name < 0 || idx.category < 0 || idx.minSqft < 0 || idx.maxSqft < 0) {
    return res.status(400).json({ message: 'Invalid CSV headers', got: header });
  }

  let imported = 0;
  for (let i = 1; i < lines.length; i++) {
    // simple split (assumes no embedded commas in fields)
    const cols = lines[i].split(',');
    const row = {
      name: cols[idx.name] ?? '',
      category: cols[idx.category] ?? '',
      minSqft: cols[idx.minSqft] ?? '',
      maxSqft: cols[idx.maxSqft] ?? '',
      useClass: idx.useClass >= 0 ? cols[idx.useClass] ?? '' : '',
      preferredLocations: idx.preferredLocations >= 0 ? cols[idx.preferredLocations] ?? '' : '',
      notes: idx.notes >= 0 ? cols[idx.notes] ?? '' : '',
    };
    const item = normalizeReq(row);
    if (!item.name) continue;
    requirementsStore.push(item);
    imported++;
  }

  return res.json({ ok: true, imported });
});

/* ---------------- 404 fallback --------------------------------------- */
app.use((req, res) => res.status(404).json({ error: 'Not Found', path: req.originalUrl }));

/* ---------------- Start ---------------------------------------------- */
if (require.main === module) {
  app.listen(PORT, () => console.log(`API listening on :${PORT}`));
}
module.exports = app;
