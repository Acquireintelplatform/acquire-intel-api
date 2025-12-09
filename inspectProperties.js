// inspectProperties.js
import db from "./server/db.js";

async function run() {
  try {
    console.log("=== properties (columns) ===");
    const columns = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns
      WHERE table_name = 'properties'
      ORDER BY ordinal_position;
    `);
    console.log(columns.rows);

    console.log("\n=== sample rows ===");
    const rows = await db.query("SELECT * FROM properties LIMIT 5;");
    console.log(rows.rows);

  } catch (err) {
    console.error("ERROR:", err);
  } finally {
    process.exit(0);
  }
}

run();
