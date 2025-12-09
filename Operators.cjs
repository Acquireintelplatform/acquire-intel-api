// queryOperators.cjs — runs the same SQL as /api/operators
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const { Pool } = require('pg');

(async () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const r = await pool.query('SELECT * FROM operators ORDER BY id ASC;');
    console.log('rowCount:', r.rowCount);
    console.log(JSON.stringify(r.rows, null, 2));
  } catch (e) {
    console.error('Query error:', e.message);
    console.error(String(e.stack || e));
  } finally {
    await pool.end();
  }
})();
