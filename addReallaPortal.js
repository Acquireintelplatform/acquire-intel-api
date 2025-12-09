import pool from "./utils/db.js";

async function run() {
  try {
    console.log("Inserting Realla portal...");

    const result = await pool.query(
      `
      INSERT INTO portals (name, base_url)
      VALUES ('Realla', 'https://realla.co.uk')
      ON CONFLICT (name) DO NOTHING
      RETURNING id;
      `
    );

    console.log("Realla portal inserted:", result.rows);
  } catch (err) {
    console.error("Error inserting portal:", err.message);
  } finally {
    process.exit(0);
  }
}

run();
