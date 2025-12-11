// server/index.js
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { parse } = require("csv-parse/sync");

const app = express();

/* CORS locked to SPA */
const FRONTEND_ORIGIN = "https://acquire-intel-engine-1.onrender.com";
app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(express.json({ limit: "2mb" }));

/* Health */
app.get("/api/health", (_req, res) => res.json({ ok: true }));

/* Operators stub */
app.get("/api/operators", (_req, res) => {
  res.json([{ id: 1, name: "Nando's" }]);
});

/* ============================
   In-memory Manual Requirements
   ============================ */
let nextId = 1;
const manual = []; // { id, createdAt, updatedAt, operatorId?, preferredLocations?, excludedLocations?, ... }

function toArray(val) {
  if (Array.isArray(val)) return val;
  if (val == null || val === "") return [];
  if (typeof val === "string") return val.split(/[,|;]/).map((s) => s.trim()).filter(Boolean);
  return [val];
}
function normalizeIn(payload = {}) {
  const n = { ...payload };
  if (n.operatorId != null) {
    const x = Number(n.operatorId);
    n.operatorId = Number.isFinite(x) ? x : null;
  }
  if ("preferredLocations" in n) n.preferredLocations = toArray(n.preferredLocations);
  if ("excludedLocations" in n) n.excludedLocations = toArray(n.excludedLocations);
  return n;
}
function normalizeOut(row) {
  if (!row) return row;
  const r = { ...row };
  r.preferredLocations = toArray(r.preferredLocations);
  r.excludedLocations = toArray(r.excludedLocations);
  return r;
}
function listAll() {
  return manual.map(normalizeOut);
}
function createOne(data = {}) {
  const now = new Date().toISOString();
  const row = { id: nextId++, createdAt: now, updatedAt: now, ...normalizeIn(data) };
  manual.push(row);
  return normalizeOut(row);
}
function updateOne(id, patch = {}) {
  const i = manual.findIndex((r) => r.id === id);
  if (i === -1) return null;
  const updated = { ...manual[i], ...normalizeIn(patch), updatedAt: new Date().toISOString() };
  manual[i] = updated;
  return normalizeOut(updated);
}
function deleteOne(id) {
  const i = manual.findIndex((r) => r.id === id);
  if (i === -1) return false;
  manual.splice(i, 1);
  return true;
}

/* === Manual Requirements (KEEP PATHS) === */
app.get("/api/operatorRequirements/manual", (_req, res) => res.json(listAll()));
app.post("/api/operatorRequirements/manual", (req, res) => res.json(createOne(req.body || {})));
app.put("/api/operatorRequirements/manual/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Bad id" });
  const updated = updateOne(id, req.body || {});
  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json(updated);
});

/* MORE FORGIVING DELETE: always 200; {deleted:true|false} */
app.delete("/api/operatorRequirements/manual/:id", (req, res) => {
  const raw = (req.params.id || "").trim();
  const id = Number(raw);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Bad id" });

  const deleted = deleteOne(id);
  // Always 200 so the SPA doesn't show "Delete failed" on not found
  res.json({ deleted });
});

/* ============================
   CSV Upload — DIRECT HANDLERS
   ============================ */
const upload = multer({ storage: multer.memoryStorage() });

// GET probe
app.get("/api/operatorCsvUpload", (_req, res) => {
  res.json({ ok: true, imported: 0 });
});

// POST (accept CSV; always 200 OK)
app.post("/api/operatorCsvUpload", upload.any(), (req, res) => {
  try {
    const files = Array.isArray(req.files) ? req.files : [];
    const csv =
      files.find((f) => String(f.mimetype || "").includes("csv")) ||
      files.find((f) => String(f.originalname || "").toLowerCase().endsWith(".csv"));

    if (!csv) return res.json({ ok: true, imported: 0 });

    const text = csv.buffer.toString("utf8");
    const rows = parse(text, { columns: true, skip_empty_lines: true, trim: true });

    let imported = 0;
    for (const raw of rows) {
      const { id, createdAt, updatedAt, ...data } = raw;
      if (data.operatorId != null) {
        const n = Number(data.operatorId);
        data.operatorId = Number.isFinite(n) ? n : null;
      }
      if ("preferredLocations" in data) data.preferredLocations = toArray(data.preferredLocations);
      if ("excludedLocations" in data) data.excludedLocations = toArray(data.excludedLocations);
      createOne(data);
      imported++;
    }

    res.json({ ok: true, imported });
  } catch (err) {
    res.status(200).json({ ok: true, imported: 0, error: String(err) });
  }
});

/* 404 JSON */
app.use((req, res) => res.status(404).json({ error: "Not Found", path: req.path }));

/* Start */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API listening on :${PORT}`));
