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

-- Drop all tables with CASCADE to handle dependencies
DROP TABLE IF EXISTS attendance_statistics CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS student_course CASCADE;
DROP TABLE IF EXISTS course_sessions CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS attendance_status CASCADE;
DROP TABLE IF EXISTS sections CASCADE;
DROP TABLE IF EXISTS enrollment_requests CASCADE;
DROP TABLE IF EXISTS course_settings CASCADE;




-- 1. Sections Table
CREATE TABLE sections (
    section_id SERIAL PRIMARY KEY,
    name VARCHAR(10) UNIQUE NOT NULL  -- e.g., 'A', 'B', 'F'
);

-- 2. Attendance Status Table
CREATE TABLE attendance_status (
    status_id SERIAL PRIMARY KEY,
    label VARCHAR(20) UNIQUE NOT NULL  -- Only 'Present', 'Absent', 'Leave'
);

-- 3. Courses Table
CREATE TABLE courses (
    course_id SERIAL PRIMARY KEY,
    course_code VARCHAR(20) NOT NULL,
    course_title VARCHAR(100) NOT NULL,
    credit_hours INTEGER CHECK (credit_hours IN (1, 2, 3)) NOT NULL DEFAULT 3,
    faculty_id INTEGER REFERENCES faculty(faculty_id) ON DELETE SET NULL,
    section_id INTEGER REFERENCES sections(section_id),
    semester VARCHAR(20) NOT NULL,  -- e.g., 'Fall 2024', 'Spring 2025'
    UNIQUE(course_code, section_id, semester)
);

-- 4. Course Sessions Table
CREATE TABLE course_sessions (
    session_id SERIAL PRIMARY KEY,
    session_code VARCHAR(20) NOT NULL,
    course_id INTEGER REFERENCES courses(course_id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    session_time TIME NOT NULL,
    duration INTEGER DEFAULT 60,  -- Duration in minutes
    status VARCHAR(20) DEFAULT 'scheduled',  -- 'scheduled', 'in-progress', 'completed', 'cancelled'
    class_topic TEXT,
    UNIQUE(course_id, session_date, session_time)
);

-- 5. Student-Course Enrollments Table
CREATE TABLE student_course (
    enrollment_id SERIAL PRIMARY KEY,
    registration_number VARCHAR(20) REFERENCES students(registration_number) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(course_id) ON DELETE CASCADE,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    UNIQUE(registration_number, course_id)
);

-- 6. Attendance Table
CREATE TABLE attendance (
    attendance_id SERIAL PRIMARY KEY,
    registration_number VARCHAR(20) REFERENCES students(registration_number) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(course_id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES course_sessions(session_id) ON DELETE CASCADE,
    status_id INTEGER REFERENCES attendance_status(status_id),
    attendance_date DATE NOT NULL,
    attendance_time TIME NOT NULL,
    marked_by INTEGER REFERENCES faculty(faculty_id) NOT NULL,
    UNIQUE(registration_number, session_id)
);

-- 7. Attendance Statistics Table
CREATE TABLE attendance_statistics (
    statistic_id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(course_id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES course_sessions(session_id) ON DELETE CASCADE,
    present_count INTEGER DEFAULT 0,
    absent_count INTEGER DEFAULT 0,
    leave_count INTEGER DEFAULT 0,
    attendance_date DATE NOT NULL,
    attendance_percentage DECIMAL(5,2)
);


-- Insert the three attendance status options
INSERT INTO attendance_status (label) VALUES ('Present'), ('Absent'), ('Leave');

-- Insert default section options
INSERT INTO sections (name) VALUES ('A'), ('B'), ('C'), ('D'), ('E'), ('F'), ('G'), ('H');


-- Grant permissions to abdullah
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO abdullah;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO abdullah;