// server/routes/mapPins.js
const express = require("express");
const router = express.Router();

/**
 * In-memory pin store (survives while the server process runs).
 * Each pin: { id, type, lat, lng, title, address, meta, createdAt }
 */
const pins = [];

/** Helper to make ids */
const makeId = () => Math.random().toString(36).slice(2, 10);

/** GET /api/mapPins  -> list all pins */
router.get("/", (_req, res) => {
  res.json({ ok: true, count: pins.length, pins });
});

/** POST /api/mapPins  -> add a pin */
router.post("/", (req, res) => {
  try {
    const { type, lat, lng, title, address = "", meta = {} } = req.body || {};

    if (!type) return res.status(400).json({ ok: false, error: "type required" });
    if (typeof lat !== "number" || typeof lng !== "number") {
      return res.status(400).json({ ok: false, error: "lat/lng must be numbers" });
    }

    const pin = {
      id: makeId(),
      type,                // e.g. "late-filing" | "lease-expiring" | "retail" | "fnb" | etc.
      lat,
      lng,
      title: title || "",
      address,
      meta,
      createdAt: new Date().toISOString(),
    };

    pins.push(pin);
    res.status(201).json({ ok: true, pin });
  } catch (e) {
    console.error("Add pin failed:", e);
    res.status(500).json({ ok: false, error: "server_error" });
  }
});

/** DELETE /api/mapPins/:id -> remove a pin */
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const idx = pins.findIndex((p) => p.id === id);
  if (idx === -1) return res.status(404).json({ ok: false, error: "not_found" });
  const removed = pins.splice(idx, 1)[0];
  res.json({ ok: true, removed });
});

module.exports = router;
