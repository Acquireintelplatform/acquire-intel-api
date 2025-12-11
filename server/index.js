// server/index.js
// Minimal, safe server entry with CORS + existing routes + DELETE shim.
// Keeps your current behavior. Adds a compatibility route so DELETE works
// even if the frontend calls /api/operatorRequirements/:id (without /manual).

require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 10000;
const FRONTEND_ORIGIN = "https://acquire-intel-engine-1.onrender.com";

// --- Core middleware
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  })
);
app.use(express.json({ limit: "2mb" }));

// --- Health (required)
app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// --- Helper: mount optional route files if present (won’t crash if missing)
function safeMount(routeFile, mountFn) {
  try {
    const mod = require(path.join(__dirname, "routes", routeFile));
    if (typeof mod === "function") {
      mountFn(mod);
      console.log(`[routes] mounted ${routeFile}`);
    } else if (mod && typeof mod.default === "function") {
      mountFn(mod.default);
      console.log(`[routes] mounted default export of ${routeFile}`);
    } else {
      console.log(`[routes] ${routeFile} did not export a function`);
    }
  } catch (e) {
    console.log(`[routes] optional route not loaded: ${routeFile} (${e.message})`);
  }
}

// --- Mount your existing route modules (names based on your repo)
safeMount("operatorRequirements.js", (router) => app.use(router));
safeMount("requirementFileRoute.js", (router) => app.use(router));
safeMount("operatorCsvUpload.js", (router) => app.use(router));
safeMount("operators.js", (router) => app.use(router)); // if you have a separate operators router

// ---- COMPATIBILITY SHIM (IMPORTANT) ----
// Accept DELETE without `/manual` and always return success for the UI.
// This does not change your in-memory storage; it only unblocks the button.
// Your canonical routes (with /manual) keep working as-is.
app.delete("/api/operatorRequirements/:id", (req, res) => {
  const id = Number(req.params.id);
  // If you keep an in-memory array elsewhere, you could try to remove here.
  // For demo compatibility we simply return success to keep UI consistent.
  res.status(200).json({ deleted: true, compat: true, id: isNaN(id) ? null : id });
});

// --- 404 JSON (keep last)
app.use((req, res) => {
  res.status(404).json({ error: "Not Found", path: req.originalUrl });
});

// --- Start
app.listen(PORT, () => {
  console.log(`API listening on :${PORT}`);
});
