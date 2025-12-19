// server/db/migrate.js
//-------------------------------------------------------------
// Database Migration Script
//-------------------------------------------------------------
const pool = require("./pool");

async function runMigrations() {
  console.log("🚀 Running Acquire Intel DB migrations...");

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS operator_requirements (
        id SERIAL PRIMARY KEY,
        name TEXT,
        sector TEXT,
        preferred_locations TEXT[],
        size_range TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    console.log("✅ Migration complete");
  } catch (err) {
    console.error("❌ Migration error:", err.message);
  }
}

module.exports = runMigrations;
