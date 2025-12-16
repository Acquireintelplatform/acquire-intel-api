// server/routes/deals.js
// Simple Deal Flow API (in-memory store). CommonJS + Express.

const express = require("express");
const router = express.Router();

// In-memory store (resets on restart)
const store = { items: [], nextId: 1 };

// Helpers
const str = (v) => (typeof v === "string" ? v.trim() : "");
const num = (v) => (v == null || v === "" ? null : Number(v));

function normalize(deal) {
  return {
    id: deal.id,
    ts: deal.ts,
    title: str(deal.title),
    location: str(deal.location),
    sizeSqFt: num(deal.sizeSqFt),
    rentPsf: num(deal.rentPsf),
    status: str(deal.status) || "new",
    notes: str(deal.notes),
  };
}

// List
router.get("/", (_req, res) => {
  res.json({ ok: true, count: store.items.length, items: store.items });
});

// Create
router.post("/", express.json(), (req, res) => {
  const body = normalize(req.body || {});
  if (!body.title) return res.status(400).json({ ok: false, error: "title is required" });

  const item = { ...body, id: store.nextId++, ts: Date.now() };
  store.items.push(item);
  res.status(201).json({ ok: true, item });
});

// Update
router.put("/:id", express.json(), (req, res) => {
  const id = Number(req.params.id);
  const idx = store.items.findIndex((d) => d.id === id);
  if (idx === -1) return res.status(404).json({ ok: false, error: "not found" });

  const merged = normalize({ ...store.items[idx], ...req.body, id, ts: store.items[idx].ts });
  store.items[idx] = merged;
  res.json({ ok: true, item: merged });
});

// Delete
router.delete("/:id", (_req, res) => {
  const id = Number(_req.params.id);
  const before = store.items.length;
  store.items = store.items.filter((d) => d.id !== id);
  const removed = before !== store.items.length;
  res.status(removed ? 200 : 404).json({ ok: removed });
});

// Convenience: seed demo data quickly
router.post("/seed", (_req, res) => {
  const demo = [
    { title: "Prime retail – Oxford St", location: "W1", sizeSqFt: 2200, rentPsf: 275, status: "review", notes: "Corner plot" },
    { title: "Drive-thru pad – A406", location: "North Circular", sizeSqFt: 3000, rentPsf: 45, status: "new" },
    { title: "F&B shell – Shoreditch", location: "EC2", sizeSqFt: 1800, rentPsf: 120, status: "negotiating" },
    { title: "Shopping mall kiosk", location: "Westfield", sizeSqFt: 250, rentPsf: 400, status: "hold" },
    { title: "Unit with extraction – Brixton", location: "SW9", sizeSqFt: 1500, rentPsf: 95, status: "new" },
  ];
  demo.forEach((d) => store.items.push({ ...normalize(d), id: store.nextId++, ts: Date.now() }));
  res.json({ ok: true, inserted: demo.length, count: store.items.length });
});

module.exports = router;
