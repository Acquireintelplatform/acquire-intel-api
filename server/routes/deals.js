// server/routes/deals.js
// Simple in-memory Deals API (temporary; resets when server restarts)

const express = require("express");
const router = express.Router();

// In-memory store
const store = {
  items: [],
  nextId: 1,
};

function seedData() {
  const now = Date.now();
  const sample = [
    {
      title: "Prime retail corner – Oxford Circus",
      stage: "New",
      valueGBP: 27500000,
      sector: "Retail",
      location: "Oxford Circus, London",
      notes: "High footfall; 10-year lease.",
    },
    {
      title: "Drive-thru pad site – A406",
      stage: "Negotiating",
      valueGBP: 4800000,
      sector: "Drive-thru",
      location: "North Circular (A406)",
      notes: "QSR covenant required.",
    },
    {
      title: "Food hall unit – Westfield",
      stage: "Review",
      valueGBP: 6500000,
      sector: "Food & Beverage",
      location: "Westfield London",
      notes: "Turnkey fitout; 6% yield guidance.",
    },
    {
      title: "Retail park box – M25 corridor",
      stage: "New",
      valueGBP: 11200000,
      sector: "Retail",
      location: "M25 corridor",
      notes: "Existing A1; potential subdivision.",
    },
    {
      title: "City kiosk – Liverpool Street",
      stage: "Underwriting",
      valueGBP: 900000,
      sector: "Food & Beverage",
      location: "Liverpool Street Station",
      notes: "Commuter trade; morning bias.",
    },
    {
      title: "High street double-front – Brighton",
      stage: "Heads",
      valueGBP: 2100000,
      sector: "Retail",
      location: "North Laine, Brighton",
      notes: "Tourist trade; seasonal uplift.",
    },
    {
      title: "Leisure box – Shopping mall",
      stage: "Screening",
      valueGBP: 7200000,
      sector: "Shopping malls",
      location: "Regional mall",
      notes: "Anchor adjacencies strong.",
    },
    {
      title: "New build shell – Zone 2",
      stage: "New",
      valueGBP: 3800000,
      sector: "New properties",
      location: "Zone 2 London",
      notes: "Shell & core; capex required.",
    },
  ];

  // reset and fill
  store.items = sample.map((d, i) => ({
    id: store.nextId++,
    createdAt: new Date(now + i * 1000).toISOString(),
    ...d,
  }));
  return store.items.length;
}

// Health for this router (optional)
router.get("/health", (_req, res) => {
  res.json({ ok: true, service: "deals-router", count: store.items.length });
});

// Seed demo data (supports GET for convenience)
router.get("/seed", (_req, res) => {
  const inserted = seedData();
  res.json({ ok: true, inserted });
});

// Clear all
router.delete("/", (_req, res) => {
  store.items = [];
  store.nextId = 1;
  res.json({ ok: true, cleared: true });
});

// List
router.get("/", (_req, res) => {
  res.json({ ok: true, count: store.items.length, items: store.items });
});

module.exports = router;
