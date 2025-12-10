// server/routes/operatorRequirements.js
const express = require("express");
const multer = require("multer");
const repo = require("../repos/requirementsRepo");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// CORS preflight
router.options("*", (_req, res) => res.sendStatus(200));

// ---- PDF upload (stub) ----
router.post("/", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "file is required" });
  const operatorId = req.body.operatorId;
  if (!operatorId) return res.status(400).json({ message: "operatorId is required for PDF uploads" });

  const item = await repo.create({
    name: `PDF Pack (operatorId=${operatorId})`,
    category: null,
    minSqft: null,
    maxSqft: null,
    useClass: null,
    preferredLocations: [],
    notes: `Stored PDF '${req.file.originalname}' (${req.file.mimetype}, ${req.file.size} bytes)`,
  });
  return res.json({ message: "PDF received (stub). Extraction comes next.", item: toApi(item) });
});

// ---- Manual create ----
router.post("/manual", async (req, res) => {
  const {
    name, category = null, minSqft = null, maxSqft = null,
    useClass = null, preferredLocations = [], notes = null,
  } = req.body || {};
  if (!name || typeof name !== "string") return res.status(400).json({ message: "name is required" });

  try {
    const saved = await repo.create({
      name: name.trim(),
      category,
      minSqft,
      maxSqft,
      useClass,
      preferredLocations: Array.isArray(preferredLocations) ? preferredLocations : [],
      notes,
    });
    res.json({ message: "Requirement saved", item: toApi(saved) });
  } catch (e) {
    res.status(500).json({ message: "DB error", error: String(e.message || e) });
  }
});

// ---- Manual list (recent) ----
router.get("/manual", async (_req, res) => {
  try {
    const rows = await repo.listRecent(20);
    res.json(rows.map(toApi));
  } catch (e) {
    res.status(500).json({ message: "DB error", error: String(e.message || e) });
  }
});

// ---- Update by id ----
router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ message: "invalid id" });

  const {
    name, category = null, minSqft = null, maxSqft = null,
    useClass = null, preferredLocations = [], notes = null,
  } = req.body || {};
  if (!name || typeof name !== "string") return res.status(400).json({ message: "name is required" });

  try {
    const updated = await repo.update(id, {
      name: name.trim(),
      category,
      minSqft,
      maxSqft,
      useClass,
      preferredLocations: Array.isArray(preferredLocations) ? preferredLocations : [],
      notes,
    });
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Updated", item: toApi(updated) });
  } catch (e) {
    res.status(500).json({ message: "DB error", error: String(e.message || e) });
  }
});

// ---- Delete by id ----
router.delete("/:id", async (req, res) => {
  try {
    const ok = await repo.removeById(req.params.id);
    if (!ok) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted", id: req.params.id });
  } catch (e) {
    res.status(500).json({ message: "DB error", error: String(e.message || e) });
  }
});

// Row → API shape
function toApi(r) {
  return {
    id: r.id,
    name: r.name,
    category: r.category ?? null,
    minSqft: r.min_sqft ?? null,
    maxSqft: r.max_sqft ?? null,
    useClass: r.use_class ?? null,
    preferredLocations: Array.isArray(r.preferred_locations) ? r.preferred_locations : [],
    notes: r.notes ?? null,
    createdAt: r.created_at ?? null,
  };
}

module.exports = router;
