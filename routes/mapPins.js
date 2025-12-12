// index.js — acquire-intel-api (FULL FILE)

const express = require("express");
const cors = require("cors");

const app = express();

// Lock CORS to your SPA
const ALLOW_ORIGIN =
  process.env.ALLOW_ORIGIN || "https://acquire-intel-engine-1.onrender.com";

app.use(
  cors({
    origin: ALLOW_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);
app.use(express.json({ limit: "1mb" }));

// Health
app.get("/", (_req, res) => res.json({ ok: true, service: "acquire-intel-api" }));
app.get("/api/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

// --- MOUNT ROUTES ---
try {
  const mapPinsRouter = require("./routes/mapPins");
  app.use("/api/mapPins", mapPinsRouter);
  console.log("Mounted /api/mapPins");
} catch (e) {
  console.log("Skipped /api/mapPins:", e.message);
}

try {
  const companiesHouseRouter = require("./routes/companiesHouse");
  app.use("/api/companieshouse", companiesHouseRouter);
  console.log("Mounted /api/companieshouse");
} catch (e) {
  console.log("Skipped /api/companieshouse:", e.message);
}

// 404
app.use((req, res) => res.status(404).json({ ok: false, error: "Not found" }));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`API listening on :${PORT}`);
  console.log(`CORS origin allowed: ${ALLOW_ORIGIN}`);
});
