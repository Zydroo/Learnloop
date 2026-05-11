const mysql = require('mysql2');
require('dotenv').config();

console.log('🚀 Connecting to Aiven MySQL...');

// Create the connection pool using an object configuration
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
        rejectUnauthorized: false // Required for Aiven
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: 'Z', // Force UTC
    dateStrings: true // Get raw strings to avoid local time conversion shifts
});

const promisePool = pool.promise();

// Test connection
promisePool.query('SELECT 1')
    .then(() => {
        console.log('✅ Successfully connected to Aiven MySQL Cloud!');
    })
    .catch((err) => {
        console.error('❌ Database Connection Failed:', err.message);
    });

module.exports = promisePool;
