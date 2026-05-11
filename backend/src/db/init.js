const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

/**
 * Database Initialization Script (Advanced)
 * 1. Connects to MySQL server.
 * 2. Creates the database if it doesn't exist.
 * 3. Executes the schema.sql script.
 */
const initDatabase = async () => {
  const dbUrl = process.env.DATABASE_URL;
  let connection;

  try {
    if (dbUrl) {
      console.log('🚀 Connecting to Aiven MySQL using DATABASE_URL...');
      connection = await mysql.createConnection({
        uri: dbUrl,
        multipleStatements: true,
        ssl: { rejectUnauthorized: false }, // Force SSL for Aiven URL
      });
    } else {
      console.log('🚀 Connecting to local MySQL server...');
      const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT || 3306,
        multipleStatements: true,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : null,
      };
      
      connection = await mysql.createConnection(dbConfig);
      const dbName = process.env.DB_NAME || 'learnloop_db';
      console.log(`🔨 Ensuring database "${dbName}" exists...`);
      await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName};`);
      await connection.query(`USE ${dbName};`);
    }

    console.log('📜 Reading schema.sql...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('🏗️  Initializing tables...');
    await connection.query(sql);

    console.log('✅ Database and 20 tables initialized successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database Initialization Failed:');
    console.error(`👉 ${error.message || error}`);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
};

initDatabase();
