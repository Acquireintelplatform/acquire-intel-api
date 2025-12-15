// server/routes/mapPins.js
const express = require("express");
const router = express.Router();

// In-memory store (lives while server process runs)
const pins = [];
const makeId = () => Math.random().toString(36).slice(2, 10);

// List all pins
router.get("/", (req, res) => {
  res.json({ ok: true, count: pins.length, pins });
});

// Add a pin
router.post("/", (req, res) => {
  const { type, lat, lng, title, address, meta } = req.body || {};
  if (!type) return res.status(400).json({ ok: false, error: "type required" });
  if (typeof lat !== "number" || typeof lng !== "number") {
    return res.status(400).json({ ok: false, error: "lat/lng must be numbers" });
  }

  const pin = {
    id: makeId(),
    type,
    lat,
    lng,
    title: title || "",
    address: address || "",
    meta: meta || {},
    createdAt: new Date().toISOString(),
  };

  pins.push(pin);
  res.json({ ok: true, pin });
});

module.exports = router;
