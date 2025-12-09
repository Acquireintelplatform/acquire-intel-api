// server/db/test.js
require("dotenv").config();
const { Client } = require("pg");

(async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // Render PG needs SSL
  });

  try {
    await client.connect();
    const { rows } = await client.query("select now() as now");
    console.log("✅ PG connected. Server time:", rows[0].now);
  } catch (e) {
    console.error("❌ PG connection failed:", e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
