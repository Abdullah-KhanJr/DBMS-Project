require('dotenv').config({ path: '../../.env' });
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'loginauth',
  password: process.env.DB_PASSWORD || 'loginauth',
  port: process.env.DB_PORT || 5432,
});

module.exports = pool;