const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create pool with more detailed error logging
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Log when database connects
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
  console.log(`Database connection details: ${process.env.DB_USER}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
});

// Log any errors
pool.on('error', (err) => {
  console.error('PostgreSQL error:', err);
});

// Test the database connection on startup
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Database connection test: SUCCESS');
    
    // List available tables for debugging
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('Available tables in database:');
    tablesResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    client.release();
  } catch (err) {
    console.error('Database connection test: FAILED');
    console.error('Error:', err.message);
  }
}

testConnection();

module.exports = {
  query: async (text, params) => {
    const start = Date.now();
    try {
      const result = await pool.query(text, params);
      const duration = Date.now() - start;
      console.log(`Executed query: ${text.substring(0, 80)}... | Duration: ${duration}ms | Rows: ${result.rowCount}`);
      return result;
    } catch (error) {
      console.error(`Query failed: ${text.substring(0, 80)}...`);
      console.error(`Params: ${JSON.stringify(params)}`);
      console.error(`Error: ${error.message}`);
      throw error;
    }
  }
};