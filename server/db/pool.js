// server/db/pool.js
const { Pool } = require("pg");

const conn = process.env.DATABASE_URL;
if (!conn) {
  console.warn("[db] DATABASE_URL is not set – routes will no-op.");
}

const pool = conn
  ? new Pool({
      connectionString: conn,
      ssl: { rejectUnauthorized: false }, // Render Postgres requires SSL
    })
  : null;

module.exports = { pool };
