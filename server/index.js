// server/index.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');

const app = express();

// --- CORS ---
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const corsOptions = {
  origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN,
  credentials: false,
};
app.use(cors(corsOptions));

// --- Body limits ---
app.use(express.json({ limit: '5mb' }));

// Multer to accept CSV via multipart/form-data
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// --- Health ---
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', base: process.env.NODE_ENV || 'local', time: Date.now() });
});

// --- TEMP: operators dropdown (keeps your UI happy) ---
app.get('/api/operators', (_req, res) => {
  res.json([{ id: 1, name: "Nando's" }]);
});

/**
 * CSV upload endpoint used by the Requirements page
 * Frontend calls: POST /api/operatorCsvUpload  (multipart/form-data with a file)
 * Field name we accept: "file" (we’ll also accept the first file if the name differs)
 */
app.post('/api/operatorCsvUpload', upload.any(), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No file received' });
    }

    // Take the first uploaded file
    const file = req.files[0];

    // Basic content guard
    const name = file.originalname || 'upload.csv';
    const mime = file.mimetype || '';
    const isCsv =
      name.toLowerCase().endsWith('.csv') ||
      mime.includes('csv') ||
      mime.includes('text/plain');

    if (!isCsv) {
      return res.status(400).json({ message: 'File must be a CSV' });
    }

    // Parse rows quickly (no heavy libs): split by newline, trim empties
    const text = file.buffer.toString('utf8');
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);

    // Header + data rows (if any)
    const header = lines[0] || '';
    const columns = header.split(',').length;
    const dataRows = Math.max(lines.length - 1, 0);

    // Stub response so the UI can proceed
    return res.json({
      ok: true,
      received: name,
      size: file.size,
      columns,
      rows: dataRows,
      note: 'CSV received (stub). Parsing & save-to-DB can be wired next.',
    });
  } catch (err) {
    console.error('CSV upload error:', err);
    return res.status(500).json({ message: 'Upload failed', error: String(err) });
  }
});

// --- 404 fallthrough (keeps logs clean) ---
app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

// --- Start ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`API listening on :${PORT}`);
});

// Export for tests/serverless if needed
module.exports = app;
