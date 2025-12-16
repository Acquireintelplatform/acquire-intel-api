// server/db/migrate.js
const { Pool } = require("pg");

function pool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL not set");
  }
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // Render Postgres
  });
}

const SQL = `
CREATE SCHEMA IF NOT EXISTS aie;

CREATE TABLE IF NOT EXISTS aie.map_pins (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- simple index for map bounds/filters later
CREATE INDEX IF NOT EXISTS idx_map_pins_type ON aie.map_pins(type);
CREATE INDEX IF NOT EXISTS idx_map_pins_lat_lng ON aie.map_pins(lat, lng);
`;

async function runMigrations() {
  const p = pool();
  try {
    await p.query("BEGIN");
    await p.query(SQL);
    await p.query("COMMIT");
  } catch (e) {
    await p.query("ROLLBACK");
    throw e;
  } finally {
    await p.end();
  }
}

module.exports = { runMigrations };
