import pool from "./utils/db.js";

async function run() {
  try {
    console.log("=== operators (columns) ===");
    const columns = await pool.query(
      `
      SELECT
        column_name,
        data_type
      FROM information_schema.columns
      WHERE table_name = 'operators'
      ORDER BY ordinal_position;
      `
    );
    console.log(columns.rows);

    console.log("\n=== sample rows ===");
    const rows = await pool.query(
      "SELECT * FROM operators ORDER BY id DESC LIMIT 5;"
    );
    console.log(rows.rows);
  } catch (err) {
    console.error("ERROR:", err);
  } finally {
    process.exit(0);
  }
}

run();
