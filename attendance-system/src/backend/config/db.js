const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from the root .env file
dotenv.config({ path: path.join(__dirname, '../../../.env') });

console.log('Database configuration:');
console.log('User:', process.env.DB_USER);
console.log('Host:', process.env.DB_HOST);
console.log('Database:', process.env.DB_NAME);
console.log('Port:', process.env.DB_PORT);

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

pool.on('connect', () => {
    console.log('Connected to PostgreSQL database as user:', process.env.DB_USER);
});

pool.on('error', (err) => {
    console.error('PostgreSQL pool error:', err);
});

// Verify connection
pool.query('SELECT current_user', (err, res) => {
    if (err) {
        console.error('Database connection test failed:', err);
    } else {
        console.log('Connected to database as:', res.rows[0].current_user);
    }
});

module.exports = {
    query: (text, params) => {
        console.log('Executing query:', text.substring(0, 60) + (text.length > 60 ? '...' : ''));
        return pool.query(text, params);
    },
    pool
};