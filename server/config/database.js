// ============================================
// Database Configuration
// Connects to PostgreSQL using the 'pg' library
// ============================================

const { Pool } = require('pg');
require('dotenv').config();

// Create a connection pool for efficient database access
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'smart_task_dashboard',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    // Connection pool settings
    max: 20,              // Maximum number of connections in the pool
    idleTimeoutMillis: 30000,  // Close idle connections after 30 seconds
    connectionTimeoutMillis: 2000, // Timeout if connection takes too long
});

// Test the database connection on startup
pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('❌ Unexpected database error:', err.message);
    process.exit(-1);
});

// Helper function to run SQL queries
// Uses parameterized queries to prevent SQL injection
const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };
