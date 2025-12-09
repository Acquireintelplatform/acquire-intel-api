// utils/db.js
import pkg from "pg";
const { Pool } = pkg;

import dotenv from "dotenv";
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error("❌ ERROR: DATABASE_URL is missing in .env");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Render PostgreSQL
  },
});

pool
  .connect()
  .then(() => console.log("✅ Database connected successfully (Render PostgreSQL)"))
  .catch((err) => {
    console.error("❌ Database connection error:", err);
    process.exit(1);
  });

export default pool;
