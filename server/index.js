// server/index.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();

// ---- Config ----------------------------------------------------
const PORT = process.env.PORT || 3001;

// Allow your deployed frontend (or * for local dev)
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const corsOptions =
  CORS_ORIGIN === '*'
    ? { origin: true, credentials: true }
    : { origin: CORS_ORIGIN.split(',').map(s => s.trim()), credentials: true };

// ---- Middleware -----------------------------------------------
app.use(cors(corsOptions));
app.use(express.json({ limit: '5mb' }));
app.use('/api/operatorRequirements', require('./routes/requirementFileRoute'));


// ---- Health ----------------------------------------------------
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    base: process.env.VITE_API_BASE || 'local',
    time: Date.now()
  });
});

// ---- TEMP: operators list for dropdown -------------------------
app.get('/api/operators', (_req, res) => {
  res.json([{ id: 1, name: "Nando's" }]);
});

// ---- Routes ----------------------------------------------------
/**
 * Operator Requirements
 *   GET    /api/operatorRequirements
 *   POST   /api/operatorRequirements
 *   PUT    /api/operatorRequirements/:id
 *   DELETE /api/operatorRequirements/:id  (if implemented)
 */
const operatorRequirementsRouter = require('./routes/operatorRequirements');
app.use('/api/operatorRequirements', operatorRequirementsRouter);

// ---- Start server (when run directly) --------------------------
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`API listening on :${PORT}`);
  });
}

// Export for tests or serverless adapters
module.exports = app;
