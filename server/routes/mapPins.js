// server/routes/mapPins.js
// Express router for map pins (Postgres-backed) + quick seed endpoint

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
    console.log("[mapPins] saved:", pin); // why: confirm writes
    res.status(201).json({ ok: true, pin });
  } catch (e) {
    console.error("[mapPins] POST error", e);
    res.status(500).json({ ok: false, error: "failed to save pin" });
  }
});

/**
 * QUICK TEST: seed 7 demo pins from the server side (no CORS/FE involved)
 * Usage: GET /api/mapPins/seed-demo
 */
router.get("/seed-demo", async (_req, res) => {
  const demo = [
    { title: "Late filings demo", type: "lateFilings", lat: 51.5107, lng: -0.1167, address: "Strand" },
    { title: "Lease expiring demo", type: "leaseExpiring", lat: 51.5155, lng: -0.1419, address: "Oxford Circus" },
    { title: "F&B demo", type: "foodBeverage", lat: 51.509, lng: -0.1337, address: "Piccadilly" },
    { title: "Retail demo", type: "retail", lat: 51.508, lng: -0.1281, address: "Trafalgar Square" },
    { title: "Drive-thru demo", type: "driveThru", lat: 51.5009, lng: -0.1246, address: "Westminster" },
    { title: "Shopping malls demo", type: "shoppingMalls", lat: 51.5136, lng: -0.1586, address: "Marble Arch" },
    { title: "New properties demo", type: "newProperties", lat: 51.5079, lng: -0.0877, address: "City" }
  ];

  try {
    let inserted = 0;
    for (const d of demo) {
      await insertOne(d);
      inserted += 1;
    }
    console.log(`[mapPins] seeded ${inserted} demo pins`);
    res.json({ ok: true, inserted });
  } catch (e) {
    console.error("[mapPins] seed-demo error", e);
    res.status(500).json({ ok: false, error: "seed failed" });
  }
});

module.exports = router;
