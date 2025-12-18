// server/index.js
//------------------------------------------------
// Acquire Intel API — Main Server Entry
//------------------------------------------------
const express = require("express");
const cors = require("cors");
const pool = require("./db"); // make sure ./db.js exists in the same folder

const app = express();
app.use(cors());
app.use(express.json());

//------------------------------------------------
// Health check route
//------------------------------------------------
app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "acquire-intel-api", ts: Date.now() });
});

//------------------------------------------------
// Mount routes
//------------------------------------------------
const dealsRoute = require("./routes/deals");
const mapPinsRoute = require("./routes/mapPins");
const operatorRequirementsRoute = require("./routes/operatorRequirements");
const companiesHouseRoute = require("./routes/companiesHouse");

app.use("/api", dealsRoute);
app.use("/api", mapPinsRoute);
app.use("/api", operatorRequirementsRoute);
app.use("/api", companiesHouseRoute);

//------------------------------------------------
// Start the server
//------------------------------------------------
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Acquire Intel API running on port ${PORT}`);
});
