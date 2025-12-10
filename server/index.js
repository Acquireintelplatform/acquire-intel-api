// server/index.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// --- Config ---------------------------------------------------------------
const PORT = process.env.PORT || 10000;

// lock CORS to your frontend (change this if your frontend URL changes)
const FRONTEND_ORIGIN =
  process.env.CORS_ORIGIN || 'https://acquire-intel-engine-1.onrender.com';

const corsOptions = {
  origin: FRONTEND_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
};

// middlewares
app.use(cors(corsOptions));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// --- Routes ---------------------------------------------------------------

// Health check (used by you and Render)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    base: process.env.NODE_ENV || 'production',
    time: Date.now(),
  });
});

// Operators dropdown (simple stub so the UI can render)
app.get('/api/operators', (_req, res) => {
  res.json([{ id: 1, name: "Nando's" }]);
});

// Manual requirement (stub) — accept JSON and return ok
// Frontend sends something like: { name, category, minSqFt, maxSqFt, useClass, locations, notes }
app.post('/api/operatorRequirements/manual', (req, res) => {
  // You can log or lightly validate here if you want
  // console.log('Manual requirement payload:', req.body);
  return res.status(200).json({ status: 'ok', saved: true });
});

// CSV upload (stub) — always OK so the UI shows success
// The frontend posts FormData to /api/operatorCsvUpload
app.post('/api/operatorCsvUpload', (req, res) => {
  // In a real implementation you would parse multipart/form-data here (multer/busboy)
  // For now, we just acknowledge so your UI can continue.
  return res.status(200).json({ status: 'ok', message: 'CSV received (stub)' });
});

// Fallback 404 (helps you see bad paths during dev)
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

// --- Start ---------------------------------------------------------------
// Export for tests; start server when run directly.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`API listening on :${PORT}`);
  });
}

module.exports = app;
