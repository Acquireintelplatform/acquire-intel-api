// server/db/migrate_add_columns.js
require("dotenv").config();
const { Client } = require("pg");

const sql = `
alter table if exists operator_requirements
  add column if not exists name                 text,
  add column if not exists category             text,
  add column if not exists min_sqft             integer,
  add column if not exists max_sqft             integer,
  add column if not exists use_class            text,
  add column if not exists preferred_locations  text[] default '{}',
  add column if not exists notes                text,
  add column if not exists created_at           timestamptz not null default now();
`;

(async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  try {
    await client.connect();
    await client.query(sql);
    console.log("✅ columns added (or already exist) on operator_requirements");
  } catch (e) {
    console.error("❌ alter failed:", e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
