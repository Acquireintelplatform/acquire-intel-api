// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

/** CORS: allow your frontend; fallback to * during dev */
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: false,
};
app.use(cors(corsOptions));

/** Body parsing */
app.use(express.json({ limit: '5mb' }));

/** Health check */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', base: process.env.NODE_ENV || 'local', time: Date.now() });
});

/** TEMP: operators dropdown (keeps your existing Nando’s stub) */
app.get('/api/operators', (req, res) => {
  res.json([{ id: 1, name: "Nando's" }]);
});

/** Mount routes */
app.use('/api', require('./routes/operatorCsvUpload'));       // <-- NEW
// If you still need the file-serving route and it exists, keep this next line:
try {
  app.use('/api', require('./routes/requirementFileRoute'));  // optional / only if present
} catch (_) {
  // If the file doesn't exist, ignore silently (prevents crashes on Render)
}

/** Start */
const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`API listening on :${port}`);
});

module.exports = app;
