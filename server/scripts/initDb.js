/**
 * One-shot DB initializer.
 * Reads server/src/db/schema.sql and runs it against DATABASE_URL.
 *
 * Use locally:   node scripts/initDb.js
 * On Railway:    add to a deploy command, or run the SQL manually in psql.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

(async () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    const sql = fs.readFileSync(path.join(__dirname, '..', 'src', 'db', 'schema.sql'), 'utf-8');
    console.log('⏳ Running schema...');
    await pool.query(sql);
    console.log('✅ Schema applied successfully.');
  } catch (err) {
    console.error('❌ Failed to apply schema:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
