// server/index.js
// Node + Express (CommonJS)

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;
const ALLOW_ORIGIN =
  process.env.ALLOW_ORIGIN || "https://acquire-intel-engine-1.onrender.com";

app.use(
  cors({
    origin: ALLOW_ORIGIN,
    credentials: false,
  })
);

// Health
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "acquire-intel-api", ts: Date.now() });
});

// Existing routes (best-effort)
try {
  app.use("/api/mapPins", require("./routes/mapPins"));
} catch (e) {
  console.warn("[warn] mapPins not mounted:", e?.message);
}
try {
  app.use("/api/companiesHouse", require("./routes/companiesHouse"));
} catch (e) {
  console.warn("[warn] companiesHouse not mounted:", e?.message);
}
try {
  app.use("/api/operatorRequirements", require("./routes/operatorRequirements"));
} catch (e) {
  console.warn("[warn] operatorRequirements not mounted:", e?.message);
}

// NEW: Deal Flow
try {
  app.use("/api/deals", require("./routes/deals"));
} catch (e) {
  console.warn("[warn] deals not mounted:", e?.message);
}

// 404
app.use((_req, res) => res.status(404).json({ ok: false, error: "Not found" }));

app.listen(PORT, () =>
  console.log(`[server] listening on ${PORT} • CORS origin: ${ALLOW_ORIGIN}`)
);
