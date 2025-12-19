// server/db/migrate.js
//-------------------------------------------------------------
// Database Migration Script (ensures all columns exist)
//-------------------------------------------------------------
const pool = require("./pool");

async function runMigrations() {
  console.log("🚀 Running Acquire Intel DB migrations...");

  try {
    // Create table if not exists
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

    // Add missing columns safely (if they don’t already exist)
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='operator_requirements' AND column_name='sector') THEN
          ALTER TABLE operator_requirements ADD COLUMN sector TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='operator_requirements' AND column_name='name') THEN
          ALTER TABLE operator_requirements ADD COLUMN name TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='operator_requirements' AND column_name='preferred_locations') THEN
          ALTER TABLE operator_requirements ADD COLUMN preferred_locations TEXT[];
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='operator_requirements' AND column_name='size_range') THEN
          ALTER TABLE operator_requirements ADD COLUMN size_range TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='operator_requirements' AND column_name='notes') THEN
          ALTER TABLE operator_requirements ADD COLUMN notes TEXT;
        END IF;
      END $$;
    `);

    console.log("✅ Migration complete");
  } catch (err) {
    console.error("❌ Migration error:", err.message);
  }
}

module.exports = runMigrations;
