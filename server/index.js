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

// ---- Health ----------------------------------------------------
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    base: process.env.VITE_API_BASE || 'local',
    time: Date.now()
  });
});

// ---- Routes ----------------------------------------------------
/**
 * Operator Requirements
 *   GET    /api/operatorRequirements
 *   POST   /api/operatorRequirements
 *   PUT    /api/operatorRequirements/:id   <-- newly wired
 *   DELETE /api/operatorRequirements/:id   (if implemented in router)
 */
const operatorRequirementsRouter = require('./routes/operatorRequirements');
app.use('/api/operatorRequirements', operatorRequirementsRouter);

// (If you have other routers, mount them here in the same way)
// const operatorsRouter = require('./routes/operators');
// app.use('/api/operators', operatorsRouter);

// ---- Start server (when run directly) --------------------------
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`API listening on :${PORT}`);
  });
}

// Export for tests or serverless adapters
module.exports = app;
