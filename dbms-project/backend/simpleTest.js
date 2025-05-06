// Simple connection and query test
require('dotenv').config({ path: '../.env' });
const pool = require('./config/db');

// Single test function with detailed error reporting
async function runSimpleTest() {
  console.log('Starting simple database test...');
  
  try {
    // Test 1: Test basic database connection
    console.log('Testing database connection...');
    console.log('DB Config:', {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'loginauth',
      port: process.env.DB_PORT || 5432
    });
    
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Database connected! Current time:', result.rows[0].current_time);
    
  } catch (err) {
    console.error('\n❌ TEST FAILED WITH ERROR:');
    console.error('Error message:', err.message);
    console.error('Error code:', err.code);
    
    // Common PostgreSQL error codes and helpful messages
    if (err.code === 'ECONNREFUSED') {
      console.error('\nCONNECTION REFUSED ERROR: Make sure PostgreSQL server is running.');
      console.error('Tips:');
      console.error('1. Check if PostgreSQL service is active');
      console.error('2. Verify the host and port in your .env file');
    } else if (err.code === '28P01') {
      console.error('\nAUTHENTICATION ERROR: Password authentication failed.');
      console.error('Tips:');
      console.error('1. Check the DB_USER and DB_PASSWORD in your .env file');
      console.error('2. Make sure the user has access rights to the database');
    } else if (err.code === '3D000') {
      console.error('\nDATABASE ERROR: Database does not exist.');
      console.error('Tips:');
      console.error('1. Create the database "loginauth" using:');
      console.error('   createdb loginauth   or   CREATE DATABASE loginauth;');
      console.error('2. Check the DB_NAME in your .env file');
    } else if (err.code === '42P01') {
      console.error('\nTABLE ERROR: Relation (table) does not exist.');
      console.error('Tips:');
      console.error('1. Make sure the required tables are created');
      console.error('2. Run database migration scripts if available');
    } else {
      console.error('\nOTHER ERROR: Check your database configuration and connection.');
      console.error('Full error stack:', err.stack);
    }
  } finally {
    try {
      // Try to end the pool connection
      await pool.end();
      console.log('\nDatabase connection pool closed successfully.');
    } catch (endErr) {
      console.error('Error closing connection pool:', endErr.message);
    }
  }
}

// Run the test and exit
runSimpleTest().then(() => {
  console.log('Test finished.');
  process.exit(0);
}).catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});