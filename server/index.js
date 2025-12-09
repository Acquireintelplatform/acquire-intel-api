// server/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { Client } = require("pg");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

// Health + root
app.get("/", (_req, res) => {
  res.send("Acquire Intel API Running");
});

app.get("/api/health", async (_req, res) => {
  const out = { ok: true, env: process.env.NODE_ENV || "dev" };

  if (process.env.DATABASE_URL) {
    try {
      const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      });
      await client.connect();
      const r = await client.query("select now() as server_time");
      out.db = { ok: true, server_time: r.rows[0].server_time };
      await client.end();
    } catch (e) {
      out.db = { ok: false, error: String(e.message || e) };
    }
  } else {
    out.db = { ok: false, error: "DATABASE_URL not set" };
  }

  res.json(out);
});

// ROUTES (all mounted here)
app.use(
  "/api/operatorRequirements",
  require("./routes/operatorRequirements")
); // manual add + list
app.use(
  "/api/operatorCsvUpload",
  require("./routes/operatorCsvUpload")
); // CSV upload
app.use("/api/operators", require("./routes/operators")); // stub list for dropdown

// Start
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
