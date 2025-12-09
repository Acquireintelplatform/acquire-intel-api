// inspectRequirements.cjs — list columns of operator_requirements
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const { Pool } = require('pg');

(async () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const cols = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'operator_requirements'
      ORDER BY ordinal_position;
    `);
    console.log('operator_requirements.columns:', cols.rows);
  } catch (e) {
    console.error('inspect error:', e.message);
  } finally {
    await pool.end();
  }
})();
