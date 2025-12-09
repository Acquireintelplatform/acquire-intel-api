// server/db/migrate.js
require("dotenv").config();
const { Client } = require("pg");

const sql = `
create table if not exists operator_requirements (
  id                  bigserial primary key,
  name                text        not null,
  category            text,
  min_sqft            integer,
  max_sqft            integer,
  use_class           text,
  preferred_locations text[],     -- array of locations
  notes               text,
  created_at          timestamptz not null default now()
);
`;

(async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    await client.query(sql);
    console.log("✅ migration successful: operator_requirements ready");
  } catch (e) {
    console.error("❌ migration failed:", e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
