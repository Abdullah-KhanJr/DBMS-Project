-- Drop tables if they exist
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS faculty CASCADE;
DROP TABLE IF EXISTS admin CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email CHARACTER VARYING(255) UNIQUE NOT NULL,
    password CHARACTER VARYING(255) NOT NULL,
    name CHARACTER VARYING(100) NOT NULL,
    user_type CHARACTER VARYING(20) NOT NULL CHECK (user_type IN ('student', 'faculty', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create students table
CREATE TABLE students (
    registration_number CHARACTER VARYING(20) PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    faculty CHARACTER VARYING(100) NOT NULL
);

-- Create faculty table
CREATE TABLE faculty (
    faculty_id INTEGER PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    department CHARACTER VARYING(100) NOT NULL
);

-- Create admin table
CREATE TABLE admin (
    admin_id INTEGER PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(user_id) ON DELETE CASCADE
);