// server/db/inspect.js
require("dotenv").config();
const { Client } = require("pg");

(async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  try {
    await client.connect();
    const sql = `
      select column_name, data_type
      from information_schema.columns
      where table_name = 'operator_requirements'
      order by ordinal_position;
    `;
    const { rows } = await client.query(sql);
    console.log("Columns in operator_requirements:");
    for (const r of rows) console.log(`- ${r.column_name}: ${r.data_type}`);
  } catch (e) {
    console.error("Inspect failed:", e.message);
  } finally {
    await client.end();
  }
})();
