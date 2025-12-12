// routes/mapPins.js
const express = require("express");
const router = express.Router();

const state = { seq: 1, pins: [] };

function isNum(n) { return typeof n === "number" && Number.isFinite(n); }
function sanitizeCategory(c) { const v = String(c || "").trim(); return v || "other"; }

// GET /api/mapPins
router.get("/", (_req, res) => {
  res.json({ ok: true, data: state.pins });
});

// POST /api/mapPins  body: { title, lat, lng, category?, meta? }
router.post("/", (req, res) => {
  try {
    const { title, lat, lng, category, meta } = req.body || {};
    if (!title || !isNum(lat) || !isNum(lng)) {
      return res.status(400).json({ ok: false, error: "Invalid payload: need { title, lat, lng }" });
    }
    const pin = {
      id: state.seq++,
      title: String(title),
      lat: Number(lat),
      lng: Number(lng),
      category: sanitizeCategory(category),
      meta: meta || null,
      createdAt: Date.now(),
    };
    state.pins.push(pin);
    res.json({ ok: true, data: pin });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message || String(e) });
  }
});

// DELETE /api/mapPins/:id
router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  const before = state.pins.length;
  state.pins = state.pins.filter((p) => p.id !== id);
  res.json({ ok: true, removed: before - state.pins.length });
});

module.exports = router;
