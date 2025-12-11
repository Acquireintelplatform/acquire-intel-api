// server/routes/operatorCsvUpload.js
const express = require("express");
const router = express.Router();

// Simple OK handlers to avoid 400 from other code paths
router.get("/", (_req, res) => res.json({ ok: true, imported: 0 }));
router.post("/", (_req, res) => res.json({ ok: true, imported: 0 }));

module.exports = router;
