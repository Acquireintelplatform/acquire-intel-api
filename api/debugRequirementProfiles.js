import pool from "../utils/db.js";

async function debugRequirementProfiles() {
  try {
    console.log("🔍 Inspecting operator_requirement_profiles columns...\n");

    const result = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'operator_requirement_profiles'
      ORDER BY column_name;
    `);

    console.table(result.rows);
    console.log("\n✔ Done.");
    process.exit(0);

  } catch (err) {
    console.error("❌ ERROR:", err);
    process.exit(1);
  }
}

debugRequirementProfiles();
