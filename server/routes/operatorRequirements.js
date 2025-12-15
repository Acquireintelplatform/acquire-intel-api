// server/routes/operatorRequirements.js
// CommonJS Express router. In-memory store (temporary).

const express = require("express");
const router = express.Router();

// Simple in-memory store. Render restarts will reset this.
const store = { items: [], nextId: 1 };

const s = (v) => (typeof v === "string" ? v.trim() : "");

router.post("/manual", express.json(), (req, res) => {
  const { operatorId, name, preferredLocations, notes } = req.body || {};
  const cleanName = s(name);
  if (!cleanName) return res.status(400).json({ ok: false, error: "name is required" });

  const item = {
    id: String(store.nextId++),
    ts: Date.now(),
    operatorId: s(operatorId),
    name: cleanName,
    preferredLocations: s(preferredLocations),
    notes: s(notes),
  };
  store.items.push(item);
  return res.status(201).json({ ok: true, item });
});

router.get("/manual", (_req, res) => {
  res.json({ ok: true, count: store.items.length, items: store.items });
});

module.exports = router;
