// server/routes/mapPins.js
// Express router for map pins (Postgres-backed)
const express = require("express");
const router = express.Router();
const { listAll, insertOne, validatePin } = require("../repos/pinsRepo");

router.get("/", async (_req, res) => {
  try {
    const pins = await listAll();
    res.json({ ok: true, count: pins.length, pins });
  } catch (e) {
    console.error("[mapPins] GET error", e);
    res.status(500).json({ ok: false, error: "failed to load pins" });
  }
});

router.post("/", express.json(), async (req, res) => {
  const { title, type, lat, lng, address } = req.body || {};
  const err = validatePin({
    title,
    type,
    lat: Number(lat),
    lng: Number(lng),
  });
  if (err) return res.status(400).json({ ok: false, error: err });

  try {
    const pin = await insertOne({
      title,
      type,
      lat: Number(lat),
      lng: Number(lng),
      address: typeof address === "string" ? address : "",
    });
    res.status(201).json({ ok: true, pin });
  } catch (e) {
    console.error("[mapPins] POST error", e);
    res.status(500).json({ ok: false, error: "failed to save pin" });
  }
});

module.exports = router;
