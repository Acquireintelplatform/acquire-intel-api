// server/db/migrate.js
//-------------------------------------------------------------
// Acquire Intel — Database Migration Script (Safe Mode)
//-------------------------------------------------------------
const pool = require("./pool");

async function runMigrations() {
  try {
    console.log("🚀 Running Acquire Intel DB migrations...");

    // DEALS TABLE
    await pool.query(`
      CREATE TABLE IF NOT EXISTS deals (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        stage TEXT,
        value_gbp NUMERIC,
        sector TEXT,
        location TEXT,
        notes TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log("✅ deals table ready");

    // OPERATOR REQUIREMENTS TABLE
    await pool.query(`
      CREATE TABLE IF NOT EXISTS operator_requirements (
        id SERIAL PRIMARY KEY,
        operator_name TEXT NOT NULL,
        sector TEXT,
        locations TEXT,
        size_sqft TEXT,
        notes TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log("✅ operator_requirements table ready");

    // DISTRESS SIGNALS TABLE
    await pool.query(`
      CREATE TABLE IF NOT EXISTS distress_signals (
        id SERIAL PRIMARY KEY,
        company_name TEXT,
        filing_type TEXT,
        signal_date DATE,
        risk_level TEXT,
        source TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log("✅ distress_signals table ready");

    console.log("🎯 All tables verified successfully");
  } catch (err) {
    console.error("❌ Migration error:", err.message);
  } finally {
    pool.end();
  }
}

// Run when executed directly
if (require.main === module) {
  runMigrations();
}

module.exports = runMigrations;
