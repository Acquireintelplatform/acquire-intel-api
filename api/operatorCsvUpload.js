// server/routes/operatorCsvUpload.js
const express = require("express");
const multer = require("multer");
const { parse } = require("csv-parse/sync");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Accepts multipart/form-data. We tolerate several field names to avoid 400s.
 * We POST each parsed row to the existing create endpoint so storage stays consistent.
 * Why: avoids sharing in-memory modules across files and works with current routes.
 */
router.post("/", upload.any(), async (req, res) => {
  try {
    // 1) Find the first CSV file from any field name
    const files = req.files || [];
    const csvFile =
      files.find((f) => (f.mimetype || "").includes("csv")) ||
      files.find((f) => (f.originalname || "").toLowerCase().endsWith(".csv")) ||
      files[0];

    if (!csvFile) {
      // Keep current UX promise: success even if nothing uploaded
      return res.json({ ok: true, imported: 0 });
    }

    // 2) Parse CSV text
    const text = csvFile.buffer.toString("utf8");
    const rows = parse(text, { columns: true, skip_empty_lines: true, trim: true });

    // 3) Post each row to the existing create endpoint
    const port = process.env.PORT || 3000;
    const base = process.env.SELF_BASE_URL || `http://127.0.0.1:${port}`;
    const url = `${base}/api/operatorRequirements/manual`;

    let imported = 0;
    for (const raw of rows) {
      // Ignore reserved fields
      const { id, createdAt, updatedAt, ...data } = raw;

      // Normalize operatorId
      if (data.operatorId != null) {
        const n = Number(data.operatorId);
        data.operatorId = Number.isFinite(n) ? n : null;
      }

      // Use Node 20 global fetch
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (r.ok) imported += 1;
      // If one row fails, keep going; we still return 200 with partial count
    }

    return res.json({ ok: true, imported });
  } catch (err) {
    // Never break the UI flow; surface error text if needed
    return res.status(200).json({ ok: true, imported: 0, error: String(err) });
  }
});

module.exports = router;
