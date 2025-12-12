// index.js — acquire-intel-api (FULL FILE)
// Express API with CORS (locked to your SPA). Mounts CH + Map Pins + Distress SIC.

const express = require("express");
const cors = require("cors");

const app = express();

// ===== CORS: keep locked to your SPA origin =====
const ALLOW_ORIGIN =
  process.env.ALLOW_ORIGIN || "https://acquire-intel-engine-1.onrender.com";

app.use(
  cors({
    origin: ALLOW_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: false,
  })
);

app.use(express.json({ limit: "1mb" }));

// ===== Health =====
app.get("/", (_req, res) => res.json({ ok: true, service: "acquire-intel-api" }));
app.get("/api/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

// ===== Routes (all in-memory; no DB) =====
// If a route file is missing, comment its two lines temporarily.

try {
  const mapPinsRouter = require("./routes/mapPins");
  app.use("/api/mapPins", mapPinsRouter);
  console.log("Mounted /api/mapPins");
} catch {
  console.log("Skipped /api/mapPins (routes/mapPins.js not found)");
}

try {
  const distressSicRouter = require("./routes/distressSic");
  app.use("/api/distress", distressSicRouter);
  console.log("Mounted /api/distress");
} catch {
  console.log("Skipped /api/distress (routes/distressSic.js not found)");
}

try {
  const companiesHouseRouter = require("./routes/companiesHouse");
  app.use("/api/companieshouse", companiesHouseRouter);
  console.log("Mounted /api/companieshouse");
} catch {
  console.log("Skipped /api/companieshouse (routes/companiesHouse.js not found)");
}

// ===== 404 fallback =====
app.use((req, res) => res.status(404).json({ ok: false, error: "Not found" }));

// ===== Start =====
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`API listening on :${PORT}`);
  console.log(`CORS origin allowed: ${ALLOW_ORIGIN}`);
});
