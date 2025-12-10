// server/routes/requirementFileRoute.js
const express = require("express");
const router = express.Router();

/**
 * Health (already used by the app)
 */
router.get("/health", (req, res) => {
  res.json({ status: "ok", base: process.env.NODE_ENV || "production", time: Date.now() });
});

/**
 * CSV upload (stub) — front-end just needs a 200 to proceed.
 * We accept any body/content-type and immediately return OK.
 */
router.post("/operatorCsvUpload", (req, res) => {
  res.status(200).json({ status: "ok", message: "CSV accepted (stub)" });
});

/**
 * Manual requirement save (stub) — keep returning OK so the UI doesn’t error.
 */
router.post("/operatorRequirements/manual", express.json(), (req, res) => {
  res.status(200).json({ status: "ok" });
});

module.exports = router;
