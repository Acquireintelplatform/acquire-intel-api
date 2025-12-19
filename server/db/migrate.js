// server/db/migrate.js
//-------------------------------------------------------------
// Acquire Intel — Database Migration Script
//-------------------------------------------------------------
const pool = require("./pool"); // ✅ Import the actual pool instance

async function runMigrations() {
  console.log("🚀 Running Acquire Intel DB migrations...");

  try {
    // Create deals table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS deals (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        stage TEXT NOT NULL,
        value_gbp NUMERIC NULL,
        sector TEXT NULL,
        location TEXT NULL,
        notes TEXT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Create operator_requirements table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS operator_requirements (
        id SERIAL PRIMARY KEY,
        operator_name TEXT,
        sector TEXT,
        locations TEXT,
        size_sqft TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    console.log("✅ Migrations completed successfully.");
  } catch (err) {
    console.error("❌ Migration error:", err.message);
  } finally {
    // ✅ Cleanly end pool only if it exists
    if (pool && typeof pool.end === "function") {
      await pool.end();
    }
  }
}

if (require.main === module) {
  runMigrations().then(() => process.exit(0));
}

module.exports = runMigrations;
