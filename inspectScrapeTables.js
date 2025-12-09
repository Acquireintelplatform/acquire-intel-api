// Inspect scrape_jobs and scrape_logs table structure

import pool from "./utils/db.js";

async function run() {
  try {
    const tables = ["scrape_jobs", "scrape_logs"];

    for (const table of tables) {
      const result = await pool.query(
        `
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position;
        `,
        [table]
      );

      console.log(`\n=== ${table} ===`);
      console.log(result.rows);
    }
  } catch (err) {
    console.error("ERROR inspecting tables:", err);
  } finally {
    process.exit(0);
  }
}

run();
