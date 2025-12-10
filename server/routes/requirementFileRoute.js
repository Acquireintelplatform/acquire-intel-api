// server/routes/requirementFileRoute.js
const express = require('express');
const router = express.Router();

// TEMP in-memory file store
const files = [];

/**
 * POST /api/requirementsFiles
 * Body: { operatorId, originalName, mime, size }
 */
router.post('/', (req, res) => {
  const { operatorId, originalName, mime, size } = req.body || {};
  const record = {
    id: files.length + 1,
    operatorId: operatorId || null,
    originalName: originalName || 'example.pdf',
    mime: mime || 'application/pdf',
    size: size || 0,
    createdAt: new Date().toISOString(),
  };
  files.push(record);
  return res.json({ ok: true, file: record });
});

/**
 * GET /api/requirementsFiles/:id
 */
router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const record = files.find(f => f.id === id);
  if (!record) return res.status(404).json({ ok: false, message: 'Not found' });
  return res.json({ ok: true, file: record });
});

module.exports = router;
