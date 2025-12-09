// inspectOperators.cjs — list columns for the operators table
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const { Pool } = require('pg');

(async () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // Render PG
  });

  try {
    const cols = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'operators'
      ORDER BY ordinal_position;
    `);
    console.log('operators.columns:', cols.rows);

    const sample = await pool.query('SELECT * FROM operators ORDER BY id ASC LIMIT 3;');
    console.log('sample rows:', JSON.stringify(sample.rows, null, 2));
  } catch (e) {
    console.error('inspect error:', e.message);
  } finally {
    await pool.end();
  }
})();
