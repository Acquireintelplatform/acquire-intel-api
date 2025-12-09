// db.js

require('dotenv').config();
const { Pool } = require('pg');

// Force SSL for Render PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test connection on startup
pool.connect()
  .then(() => {
    console.log("✅ Connected to Render PostgreSQL");
  })
  .catch((err) => {
    console.error("❌ PostgreSQL connection error:", err.message);
  });

module.exports = pool;
