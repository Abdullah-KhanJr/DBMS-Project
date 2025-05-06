// Debug script for registration testing
require('dotenv').config({ path: '../.env' });
const pool = require('./config/db');
const UserModel = require('./models/userModel');

// Simple test function with better error handling
async function testDatabaseConnection() {
  console.log('Starting database connection test...');
  
  try {
    // Test database connection first
    console.log('Testing database connection...');
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Database connected:', result.rows[0].current_time);
    
    // Check if tables exist
    console.log('\nChecking if required tables exist...');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'students', 'faculty', 'admin')
    `);
    
    console.log('Tables found:', tablesResult.rows.map(row => row.table_name));
    
    if (tablesResult.rows.length < 4) {
      console.log('❌ Warning: Some required tables are missing!');
      console.log('Expected tables: users, students, faculty, admin');
      console.log('Found tables:', tablesResult.rows.map(row => row.table_name));
    } else {
      console.log('✅ All required tables exist');
    }
    
    // Test admin exists function
    console.log('\nTesting adminExists() function...');
    const adminExists = await UserModel.adminExists();
    console.log(`✅ Admin exists check successful: ${adminExists ? 'Admin exists' : 'No admin yet'}`);
    
    // Check environment variables
    console.log('\nChecking environment variables...');
    const envVars = {
      DB_USER: process.env.DB_USER || '(not set)',
      DB_HOST: process.env.DB_HOST || '(not set)',
      DB_NAME: process.env.DB_NAME || '(not set)',
      DB_PASSWORD: process.env.DB_PASSWORD ? '(set)' : '(not set)',
      DB_PORT: process.env.DB_PORT || '(not set)',
      JWT_SECRET: process.env.JWT_SECRET ? '(set)' : '(not set)'
    };
    console.log('Environment variables:', envVars);
    
    console.log('\nAll diagnostic tests completed successfully.');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    console.error('Error details:', {
      message: err.message,
      code: err.code,
      stack: err.stack
    });
    
    if (err.code === 'ECONNREFUSED') {
      console.error('\nPostgreSQL connection refused. Make sure PostgreSQL is running and accessible.');
    } else if (err.code === '42P01') {
      console.error('\nRelation (table) not found. Database schema might not be set up correctly.');
    } else if (err.code === '28P01') {
      console.error('\nAuthentication failed. Check your database credentials in .env file.');
    } else if (err.code === '3D000') {
      console.error('\nDatabase does not exist. You need to create the database first.');
    }
  } finally {
    console.log('\nTest completed. Closing connections...');
    // Exit after all tests
    process.exit();
  }
}

// Run the test
testDatabaseConnection();