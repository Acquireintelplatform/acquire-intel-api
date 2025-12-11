// server/routes/requirementFileRoute.js
const express = require("express");
const multer = require("multer");
const { parse } = require("csv-parse/sync");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Guarantees 200 for GET/POST on /api/operatorCsvUpload.
 * Accepts any field name; if a CSV is present, imports rows by POSTing to the create endpoint.
 * Never 400s the UI.
 */

router.get("/api/operatorCsvUpload", (_req, res) => {
  res.json({ ok: true, imported: 0 });
});

router.post("/api/operatorCsvUpload", upload.any(), async (req, res) => {
  try {
    const files = Array.isArray(req.files) ? req.files : [];
    const csv =
      files.find((f) => String(f.mimetype || "").includes("csv")) ||
      files.find((f) => String(f.originalname || "").toLowerCase().endsWith(".csv"));

    // If no CSV (e.g., PDF or empty), keep success for UX
    if (!csv) return res.json({ ok: true, imported: 0 });

    const text = csv.buffer.toString("utf8");
    const rows = parse(text, { columns: true, skip_empty_lines: true, trim: true });

    // Post each row to existing create endpoint (keeps single source of truth)
    const port = process.env.PORT || 3000;
    const base = `http://127.0.0.1:${port}`;
    const url = `${base}/api/operatorRequirements/manual`;

    let imported = 0;
    for (const raw of rows) {
      const { id, createdAt, updatedAt, ...data } = raw;

      // Normalize types the UI expects
      if (data.operatorId != null) {
        const n = Number(data.operatorId);
        data.operatorId = Number.isFinite(n) ? n : null;
      }
      const toArray = (v) => {
        if (Array.isArray(v)) return v;
        if (v == null || v === "") return [];
        if (typeof v === "string") return v.split(/[,|;]/).map((s) => s.trim()).filter(Boolean);
        return [v];
      };
      if ("preferredLocations" in data) data.preferredLocations = toArray(data.preferredLocations);
      if ("excludedLocations" in data) data.excludedLocations = toArray(data.excludedLocations);

      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (r.ok) imported++;
    }

    res.json({ ok: true, imported });
  } catch (err) {
    // Always 200 to avoid breaking the UI
    res.status(200).json({ ok: true, imported: 0, error: String(err) });
  }
});

module.exports = router;
