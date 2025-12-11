// index.js  — acquire-intel-api (full file)
// Express API with CORS locked to your SPA. Adds /api/mapPins route.

const express = require("express");
const cors = require("cors");

const app = express();

// === CORS: keep locked to your SPA origin ===
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

// --- Health ---
app.get("/", (_req, res) => res.json({ ok: true, service: "acquire-intel-api" }));
app.get("/api/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

// --- Helper: mount routes only if the file exists ---
function tryMount(prefix, relPath) {
  try {
    const router = require(relPath);
    app.use(prefix, router);
    console.log(`Mounted ${prefix} from ${relPath}`);
  } catch (e) {
    // Not fatal; file might not exist in this repo.
    console.log(`Skipped ${prefix} (missing ${relPath})`);
  }
}

// === NEW: Map Pins ===
tryMount("/api/mapPins", "./routes/mapPins");

// === (Optional) Existing routes — safely mounted if present ===
// Add/keep any of your existing routes here; these calls won’t crash if missing.
tryMount("/api/operators", "./routes/operators");
tryMount("/api/operatorRequirements", "./routes/operatorRequirements");
tryMount("/api/properties", "./routes/properties");
tryMount("/api/distress", "./routes/distress");
tryMount("/api/scraper", "./routes/scraper");

// --- 404 fallback ---
app.use((req, res) => res.status(404).json({ ok: false, error: "Not found" }));

// --- Start ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`API listening on :${PORT}`);
  console.log(`CORS origin allowed: ${ALLOW_ORIGIN}`);
});
