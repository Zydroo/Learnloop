const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Migration Runner
 * Reads all SQL files from the migrations directory and executes them in order.
 * Uses IF NOT EXISTS so migrations are idempotent (safe to re-run).
 */
const runMigrations = async () => {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: { rejectUnauthorized: false },
        multipleStatements: true,
    });

    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();

    console.log(`📦 Found ${files.length} migration(s) to run...\n`);

    for (const file of files) {
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        console.log(`  ⏳ Running: ${file}...`);
        try {
            await connection.query(sql);
            console.log(`  ✅ ${file} — Success`);
        } catch (err) {
            console.error(`  ❌ ${file} — Failed:`, err.message);
        }
    }

    console.log('\n🎉 All migrations complete.');
    await connection.end();
    process.exit(0);
};

runMigrations();
