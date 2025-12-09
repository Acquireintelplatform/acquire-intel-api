// deletePdfRequirements.cjs
const { Pool } = require('pg');
const pool = new Pool(); // uses your .env settings

(async () => {
  try {
    const res = await pool.query(
      "DELETE FROM operator_requirements WHERE file_path ILIKE '%.pdf' RETURNING id, file_path;"
    );
    console.log('Deleted rows:', res.rowCount);
    console.log(res.rows);
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
})();
