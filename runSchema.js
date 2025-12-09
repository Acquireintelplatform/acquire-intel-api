// ===============================================
// Acquire Intel — Schema Loader (ESM Version)
// Safely executes schema.sql against Render Postgres
// ===============================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Enable .env loading
dotenv.config();

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Postgres connection using DATABASE_URL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Read schema.sql file
const schemaPath = path.join(__dirname, 'schema.sql');
const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

// Execute schema
(async () => {
    try {
        console.log('🚀 Connecting to database...');
        const client = await pool.connect();

        console.log('📄 Executing schema.sql...');
        await client.query(schemaSQL);

        console.log('✅ Schema loaded successfully!');
        client.release();
        process.exit(0);
    } catch (err) {
        console.error('❌ ERROR loading schema:', err);
        process.exit(1);
    }
})();
