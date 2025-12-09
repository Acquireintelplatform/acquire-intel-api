// checkDb.cjs — verify DB connection and required tables (CommonJS)
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const { Pool } = require('pg');

(async () => {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // Render Postgres
    });

    const client = await pool.connect();
    try {
      const db = await client.query('select current_database() as db');
      console.log('Database:', db.rows[0].db);

      const tables = await client.query(`
        SELECT to_regclass('public.operators') AS operators,
               to_regclass('public.operator_requirements') AS operator_requirements
      `);
      console.log('Table existence:', tables.rows[0]);

      const count = await client.query(
        'select count(*) as total from information_schema.tables where table_schema = $1',
        ['public']
      );
      console.log('Public tables count:', count.rows[0].total);
    } finally {
      client.release();
      await pool.end();
    }
  } catch (e) {
    console.error('DB error:', e.message);
    process.exit(1);
  }
})();
