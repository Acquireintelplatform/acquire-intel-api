// server/db/pool.js
//-------------------------------------------------------------
// PostgreSQL Database Connection
//-------------------------------------------------------------
const { Pool } = require("pg");

// ✅ Connection settings
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Render-hosted Postgres
  },
});

// ✅ Quick test (optional)
pool.connect()
  .then(client => {
    console.log("✅ Connected to PostgreSQL database");
    client.release();
  })
  .catch(err => console.error("❌ PostgreSQL connection error", err));

module.exports = pool;
