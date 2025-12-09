// applySchema.cjs — one-off schema runner (CommonJS). No overwrites.
// Uses DATABASE_URL from .env (same as your server).

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { Pool } = require('pg');

(async () => {
  const schemaPath = path.resolve(__dirname, 'schema.sql');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL missing. Put it in .env (same as server uses).');
    process.exit(1);
  }

  let sql;
  try {
    sql = fs.readFileSync(schemaPath, 'utf8');
  } catch (e) {
    console.error('❌ Could not read schema.sql at', schemaPath);
    console.error(e.message);
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // Render Postgres
  });

  const client = await pool.connect();
  try {
    console.log('Applying schema from:', schemaPath);
    await client.query('BEGIN');
    await client.query(sql); // run full schema
    await client.query('COMMIT');
    console.log('✅ Schema applied successfully.');

    const check = await client.query(`SELECT to_regclass('public.operators') AS exists;`);
    console.log('operators table:', check.rows[0].exists ? 'present' : 'MISSING');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('❌ Failed to apply schema:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
})();
