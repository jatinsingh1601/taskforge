/**
 * One-shot DB initializer.
 * Reads server/src/db/schema.sql and runs it against DATABASE_URL.
 *
 * Use locally:   node scripts/initDb.js
 * Imported by:   index.js (runs automatically on every server start)
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function initDb() {
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
    throw err;
  } finally {
    await pool.end();
  }
}

module.exports = { initDb };

// Allow running directly: node scripts/initDb.js
if (require.main === module) {
  initDb().catch(() => process.exit(1));
}
