// server/db/migrate.js
//-------------------------------------------------------------
// Reliable PostgreSQL Migration Manager
//-------------------------------------------------------------
const pool = require("./pool");

async function runMigrations() {
  console.log("🚀 Running Acquire Intel DB migrations...");

  try {
    // ✅ Ensure table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS operator_requirements (
        id SERIAL PRIMARY KEY,
        name TEXT,
        sector TEXT,
        preferred_locations TEXT[],
        size_range TEXT,
        size_sqm TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // ✅ Add missing columns safely
    const addColumnIfMissing = async (columnName, columnType) => {
      const result = await pool.query(
        `SELECT 1 FROM information_schema.columns WHERE table_name='operator_requirements' AND column_name=$1`,
        [columnName]
      );

      if (result.rowCount === 0) {
        console.log(`🛠️ Adding missing column: ${columnName}`);
        await pool.query(`ALTER TABLE operator_requirements ADD COLUMN ${columnName} ${columnType};`);
      }
    };

    await addColumnIfMissing("name", "TEXT");
    await addColumnIfMissing("sector", "TEXT");
    await addColumnIfMissing("preferred_locations", "TEXT[]");
    await addColumnIfMissing("size_range", "TEXT");
    await addColumnIfMissing("size_sqm", "TEXT");
    await addColumnIfMissing("notes", "TEXT");
    await addColumnIfMissing("created_at", "TIMESTAMPTZ DEFAULT NOW()");

    console.log("✅ All migrations complete");
  } catch (err) {
    console.error("❌ Migration error:", err.message);
  }
}

module.exports = runMigrations;
