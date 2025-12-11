// routes/mapPins.js
const express = require("express");
const router = express.Router();

// In-memory store (no DB, resets on deploy/restart)
let pins = [];
let nextId = 1;

// Allowed categories
const CATEGORIES = new Set([
  "lateFilings",
  "leaseExpiring",
  "foodBeverage",
  "retail",
  "driveThru",
  "shoppingMalls",
  "newProperties",
]);

// GET all pins
router.get("/", (_req, res) => {
  res.json({ ok: true, data: pins });
});

// POST create pin
router.post("/", (req, res) => {
  const { title, lat, lng, category } = req.body || {};
  if (typeof title !== "string" || typeof lat !== "number" || typeof lng !== "number") {
    return res.status(400).json({ ok: false, error: "Invalid payload" });
  }
  if (!CATEGORIES.has(category)) {
    return res.status(400).json({ ok: false, error: "Invalid category" });
  }
  const pin = { id: nextId++, title, lat, lng, category };
  pins.unshift(pin);
  res.json({ ok: true, data: pin });
});

// PUT update pin
router.put("/:id", (req, res) => {
  const id = Number(req.params.id);
  const idx = pins.findIndex((p) => p.id === id);
  if (idx === -1) return res.status(404).json({ ok: false, error: "Not found" });

  const { title, lat, lng, category } = req.body || {};
  if (title !== undefined && typeof title !== "string") return res.status(400).json({ ok: false, error: "Invalid title" });
  if (lat !== undefined && typeof lat !== "number") return res.status(400).json({ ok: false, error: "Invalid lat" });
  if (lng !== undefined && typeof lng !== "number") return res.status(400).json({ ok: false, error: "Invalid lng" });
  if (category !== undefined && !CATEGORIES.has(category)) return res.status(400).json({ ok: false, error: "Invalid category" });

  pins[idx] = { ...pins[idx], ...(title !== undefined ? { title } : {}), ...(lat !== undefined ? { lat } : {}), ...(lng !== undefined ? { lng } : {}), ...(category !== undefined ? { category } : {}) };
  res.json({ ok: true, data: pins[idx] });
});

// DELETE pin (404 tolerated as success)
router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  const before = pins.length;
  pins = pins.filter((p) => p.id !== id);
  return res.json({ ok: true, deleted: pins.length !== before });
});

module.exports = router;
