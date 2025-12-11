// api/operatorRequirements.js
const express = require("express");
const router = express.Router();

/**
 * In-memory store for the process lifetime.
 */
let nextId = 1;
const manual = []; // rows like { id, createdAt, updatedAt, operatorId?, preferredLocations?, ... }

/** Helpers */
function toArray(val) {
  // Ensure UI-safe arrays for fields that are rendered with .join()
  if (Array.isArray(val)) return val;
  if (val == null || val === "") return [];
  if (typeof val === "string") {
    // Split common CSV styles
    const parts = val.split(/[,|;]/).map((s) => s.trim()).filter(Boolean);
    return parts.length ? parts : [val];
  }
  return [val];
}

function normalizeIn(payload = {}) {
  const normalized = { ...payload };
  if (normalized.operatorId != null) {
    const n = Number(normalized.operatorId);
    normalized.operatorId = Number.isFinite(n) ? n : null;
  }
  // Ensure arrays for UI
  if ("preferredLocations" in normalized) {
    normalized.preferredLocations = toArray(normalized.preferredLocations);
  }
  if ("excludedLocations" in normalized) {
    normalized.excludedLocations = toArray(normalized.excludedLocations);
  }
  return normalized;
}

function normalizeOut(row = {}) {
  // Never mutate stored row
  const out = { ...row };
  out.preferredLocations = toArray(out.preferredLocations);
  out.excludedLocations = toArray(out.excludedLocations);
  return out;
}

/** Create from a flat object sent by the UI */
function createManualFromData(data = {}) {
  const now = new Date().toISOString();
  const normalized = normalizeIn(data);
  const row = {
    id: nextId++,
    createdAt: now,
    updatedAt: now,
    ...normalized
  };
  manual.push(row);
  return normalizeOut(row);
}

/** Update by id with a flat patch */
function updateManualById(id, patch = {}) {
  const idx = manual.findIndex((r) => r.id === id);
  if (idx === -1) return null;

  const normalized = normalizeIn(patch);
  const updated = {
    ...manual[idx],
    ...normalized,
    updatedAt: new Date().toISOString()
  };
  manual[idx] = updated;
  return normalizeOut(updated);
}

/** Delete by id */
function deleteManualById(id) {
  const idx = manual.findIndex((r) => r.id === id);
  if (idx === -1) return false;
  manual.splice(idx, 1);
  return true;
}

/** List all (copy, normalized) */
function listAllManual() {
  return manual.map((r) => normalizeOut(r));
}

/** ROUTES (mounted at /api/operatorRequirements/manual) */

// GET /api/operatorRequirements/manual
router.get("/", (_req, res) => {
  res.json(listAllManual());
});

// POST /api/operatorRequirements/manual
router.post("/", (req, res) => {
  const body = req.body || {};
  const saved = createManualFromData(body);
  res.json(saved);
});

// PUT /api/operatorRequirements/manual/:id
router.put("/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Bad id" });

  const updated = updateManualById(id, req.body || {});
  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json(updated);
});

// DELETE /api/operatorRequirements/manual/:id
router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Bad id" });

  const ok = deleteManualById(id);
  if (!ok) return res.status(404).json({ error: "Not found" });
  res.json({ deleted: true });
});

module.exports = router;
// Export for CSV uploader (already mounted elsewhere)
module.exports.createManualFromData = createManualFromData;
