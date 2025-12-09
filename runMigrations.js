import pool from "./db.js";
import fs from "fs";
import path from "path";

async function runMigrations() {
  try {
    const filePath = path.join(
      process.cwd(),
      "database",
      "migrations",
      "create_requirement_profiles.sql"
    );

    const sql = fs.readFileSync(filePath, "utf8");

    await pool.query(sql);
    console.log("Migration complete: operator_requirement_profiles created.");
    process.exit(0);
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  }
}

runMigrations();
