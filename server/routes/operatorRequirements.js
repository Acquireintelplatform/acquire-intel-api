// server/routes/operatorRequirements.js
// Manual requirements now persist to Postgres.
// PDF upload stays a stub for now (still accepted, no parsing).
const express = require("express");
const multer = require("multer");
const repo = require("../repos/requirementsRepo"); // ← uses Postgres via pool

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Preflight
router.options("*", (_req, res) => res.sendStatus(200));

// ----- PDF upload (stub) -----
// POST /api/operatorRequirements   (multipart/form-data: file + operatorId)
router.post("/", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "file is required" });
  const operatorId = req.body.operatorId;
  if (!operatorId) return res.status(400).json({ message: "operatorId is required for PDF uploads" });

  // Store a placeholder record so you can see something appear in the table
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

// ----- Manual create -----
// POST /api/operatorRequirements/manual
router.post("/manual", async (req, res) => {
  const {
    name, category = null, minSqft = null, maxSqft = null,
    useClass = null, preferredLocations = [], notes = null,
  } = req.body || {};

  if (!name || typeof name !== "string") {
    return res.status(400).json({ message: "name is required" });
  }

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

// ----- List recent -----
// GET /api/operatorRequirements/manual
router.get("/manual", async (_req, res) => {
  try {
    const rows = await repo.listRecent(20);
    res.json(rows.map(toApi));
  } catch (e) {
    res.status(500).json({ message: "DB error", error: String(e.message || e) });
  }
});

// ----- Delete by id -----
// DELETE /api/operatorRequirements/:id
router.delete("/:id", async (req, res) => {
  try {
    const ok = await repo.removeById(req.params.id);
    if (!ok) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted", id: req.params.id });
  } catch (e) {
    res.status(500).json({ message: "DB error", error: String(e.message || e) });
  }
});

// DB row → API shape expected by frontend
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
