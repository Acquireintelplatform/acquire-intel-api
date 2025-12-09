// ===============================================
// Acquire Intel — Schema Verification Script (ESM)
// Lists all tables currently in the database
// ===============================================

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

(async () => {
    try {
        console.log('🔍 Checking database tables...');

        const query = `
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `;

        const result = await pool.query(query);

        console.log('\n📦 Tables in database:\n');
        result.rows.forEach(row => console.log(' - ' + row.table_name));

        console.log('\n✅ Verification complete.');
        process.exit(0);
    } catch (err) {
        console.error('❌ ERROR verifying schema:', err);
        process.exit(1);
    }
})();
