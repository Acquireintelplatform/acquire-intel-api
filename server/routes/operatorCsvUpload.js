// server/routes/operatorCsvUpload.js
// CSV upload -> bulk insert into Postgres.
const express = require("express");
const multer = require("multer");
const { parse } = require("csv-parse/sync");
const repo = require("../repos/requirementsRepo"); // uses PG

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/operatorCsvUpload  (multipart/form-data with field "file")
router.post("/", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "file is required" });

  let records;
  try {
    records = parse(req.file.buffer.toString("utf8"), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch (e) {
    return res.status(400).json({ message: "Invalid CSV", error: String(e.message || e) });
  }

  // Normalize to API shape our repo expects
  const toNum = (v) =>
    v === undefined || v === null || v === "" ? null : Number(v);

  const items = [];
  for (const r of records) {
    const name = (r.name || r.operator || "").toString().trim();
    if (!name) continue;

    const locsRaw = r.preferredLocations || r.locations || "";
    const locs = Array.isArray(locsRaw)
      ? locsRaw
      : String(locsRaw)
          .split(/[;,]/)
          .map((s) => s.trim())
          .filter(Boolean);

    items.push({
      name,
      category: r.category ? String(r.category).trim() : null,
      minSqft: toNum(r.minSqft),
      maxSqft: toNum(r.maxSqft),
      useClass: r.useClass ? String(r.useClass).trim() : null,
      preferredLocations: locs,
      notes: r.notes ? String(r.notes).trim() : null,
    });
  }

  if (items.length === 0) {
    return res.status(400).json({ message: "CSV has no valid rows." });
  }

  try {
    await repo.bulkCreate(items);
    return res.json({ message: `Imported ${items.length} row(s)` });
  } catch (e) {
    console.error("[CSV bulkCreate] error:", e.message);
    return res.status(500).json({ message: "DB error", error: String(e.message || e) });
  }
});

module.exports = router;

