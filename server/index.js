// server/index.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

// CORS
const allowList = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: allowList.length ? allowList : true,
  })
);

// Body parsing
app.use(express.json({ limit: '5mb' }));

/** ----------------------------------------------------------------
 *  Health
 * ----------------------------------------------------------------*/
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    base: process.env.RENDER ? 'production' : 'local',
    time: Date.now(),
  });
});

/** ----------------------------------------------------------------
 *  TEMP: operators (for dropdown)
 * ----------------------------------------------------------------*/
app.get('/api/operators', (_req, res) => {
  res.json([{ id: 1, name: "Nando's" }]);
});

/** ----------------------------------------------------------------
 *  CSV Upload (stub)
 *  Frontend hits: POST /api/operatorCsvUpload
 *  Return 200 so the UI shows “uploaded successfully”
 * ----------------------------------------------------------------*/
app.post('/api/operatorCsvUpload', (req, res) => {
  // In a future step we’ll parse/validate CSV here.
  res.json({ status: 'ok', message: 'CSV uploaded (stub)' });
});

/** ----------------------------------------------------------------
 *  Manual Requirements
 *  Frontend:
 *    - GET  /api/operatorRequirements/manual   (load recent items)
 *    - POST /api/operatorRequirements/manual   (add one)
 * ----------------------------------------------------------------*/
const manualRequirements = []; // in-memory for now

app.get('/api/operatorRequirements/manual', (_req, res) => {
  res.json({ status: 'ok', items: manualRequirements });
});

app.post('/api/operatorRequirements/manual', (req, res) => {
  const payload = req.body || {};
  const item = {
    id: manualRequirements.length + 1,
    createdAt: new Date().toISOString(),
    // You can send: { operatorName, category, minSqft, maxSqft, useClass, preferredLocations, notes }
    ...payload,
  };
  manualRequirements.unshift(item);
  res.json({ status: 'ok', item });
});

/** ----------------------------------------------------------------
 *  (Optional) Requirements file by id (not implemented yet)
 *  Avoids 404 if something probes it.
 * ----------------------------------------------------------------*/
app.get('/api/requirementsFiles/:id', (req, res) => {
  res.status(404).json({ status: 'not_implemented', id: req.params.id });
});

/** ----------------------------------------------------------------
 *  Start
 * ----------------------------------------------------------------*/
app.listen(PORT, () => {
  console.log(`API listening on :${PORT}`);
});
