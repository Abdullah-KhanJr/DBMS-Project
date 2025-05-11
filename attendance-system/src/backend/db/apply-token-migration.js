#!/usr/bin/env node

/**
 * Token Blacklist Migration Script
 * 
 * This script applies the token blacklist migration to improve authentication security
 * by preventing the reuse of logged-out tokens.
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function applyMigration() {
  console.log('Starting token blacklist migration...');

  // Create database connection pool
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  try {
    // Read migration SQL
    const migrationFile = path.join(__dirname, 'token-blacklist-migration.sql');
    const migrationSql = fs.readFileSync(migrationFile, 'utf8');

    // Connect to database and run the migration
    console.log('Connecting to database...');
    const client = await pool.connect();

    try {
      console.log('Applying migration...');
      await client.query(migrationSql);
      console.log('Migration applied successfully!');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
applyMigration();
