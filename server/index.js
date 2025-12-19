// server/index.js
//-------------------------------------------------------------
// Acquire Intel — Backend API (Node + Express + Postgres)
//-------------------------------------------------------------
const express = require("express");
const cors = require("cors");
const pool = require("./db/pool");
const runMigrations = require("./db/migrate"); // ensure tables exist

//-------------------------------------------------------------
// Initialise app
//-------------------------------------------------------------
const app = express();
app.use(express.json());

//-------------------------------------------------------------
// CORS (adjust to match frontend Render URL)
//-------------------------------------------------------------
const CORS_ORIGIN = process.env.CORS_ORIGIN || "https://acquire-intel-engine-1.onrender.com";
app.use(
  cors({
    origin: CORS_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

//-------------------------------------------------------------
// Run database migrations automatically on startup
//-------------------------------------------------------------
runMigrations();

//-------------------------------------------------------------
// Routes
//-------------------------------------------------------------
const dealsRoutes = require("./routes/deals");
const mapPinsRoutes = require("./routes/mapPins");
const operatorRequirementsRoutes = require("./routes/operatorRequirements");
const companiesHouseRoutes = require("./routes/companiesHouse");

app.use("/api", dealsRoutes);
app.use("/api", mapPinsRoutes);
app.use("/api", operatorRequirementsRoutes);
app.use("/api", companiesHouseRoutes);

//-------------------------------------------------------------
// Health Check Endpoint
//-------------------------------------------------------------
app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "acquire-intel-api", ts: Date.now() });
});

//-------------------------------------------------------------
// Root Route (for friendly message)
//-------------------------------------------------------------
app.get("/", (req, res) => {
  res.send("✅ Acquire Intel API is live. Use /api/... endpoints for data.");
});

//-------------------------------------------------------------
// Start Server
//-------------------------------------------------------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Acquire Intel API running on port ${PORT}`);
  console.log(`🌍 CORS Origin: ${CORS_ORIGIN}`);
});
