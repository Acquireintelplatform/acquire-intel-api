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

// ---- DB migrate on boot (safe, idempotent) ----
try {
  const { runMigrations } = require("./db/migrate");
  runMigrations()
    .then(() => console.log("[db] migrations ok"))
    .catch((e) => console.error("[db] migrations failed", e));
} catch (e) {
  console.warn("[warn] migrate not run:", e?.message);
}

// Health
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "acquire-intel-api", ts: Date.now() });
});

// Routes
try {
  app.use("/api/mapPins", require("./routes/mapPins")); // <-- now Postgres-backed
} catch (e) {
  console.warn("[warn] mapPins not mounted:", e?.message);
}
try {
  app.use("/api/companiesHouse", require("./routes/companiesHouse"));
} catch (e) {
  console.warn("[warn] companiesHouse not mounted:", e?.message);
}
try {
  app.use(
    "/api/operatorRequirements",
    require("./routes/operatorRequirements")
  );
} catch (e) {
  console.warn("[warn] operatorRequirements not mounted:", e?.message);
}

// 404
app.use((_req, res) => res.status(404).json({ ok: false, error: "Not found" }));

app.listen(PORT, () =>
  console.log(`[server] listening on ${PORT} • CORS origin: ${ALLOW_ORIGIN}`)
);
