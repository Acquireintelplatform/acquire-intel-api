// server/db/migrate.js
// Safe, idempotent migrations for Render Postgres.

const { Pool } = require("pg");

function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL not set");
  }
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // Render PG
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

CREATE INDEX IF NOT EXISTS idx_map_pins_type ON aie.map_pins(type);
CREATE INDEX IF NOT EXISTS idx_map_pins_lat_lng ON aie.map_pins(lat, lng);
`;

async function runMigrations() {
  const pool = getPool();
  try {
    await pool.query("BEGIN");
    await pool.query(SQL);
    await pool.query("COMMIT");
  } catch (err) {
    await pool.query("ROLLBACK");
    throw err;
  } finally {
    await pool.end();
  }
}

module.exports = { runMigrations };
