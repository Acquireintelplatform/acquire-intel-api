import pool from "./utils/db.js";

async function run() {
  try {
    console.log("Patching scrape_jobs table...");
    await pool.query(`
      ALTER TABLE scrape_jobs
      ADD COLUMN updated_at TIMESTAMPTZ;
    `);
    console.log("✓ updated_at column added.");
  } catch (err) {
    console.error("Patch error:", err.message);
  } finally {
    process.exit(0);
  }
}

run();
