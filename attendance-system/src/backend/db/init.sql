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

-- ...existing code...

-- ...existing code...

-- 1. Sections Table
CREATE TABLE sections (
    section_id SERIAL PRIMARY KEY,
    name CHARACTER VARYING(10) UNIQUE NOT NULL  -- e.g., 'A', 'B', 'F'
);

-- 2. Attendance Status Table
CREATE TABLE attendance_status (
    status_id SERIAL PRIMARY KEY,
    label CHARACTER VARYING(20) UNIQUE NOT NULL  -- Only 'Present', 'Absent', 'Leave'
);

-- 3. Courses Table
CREATE TABLE courses (
    course_id SERIAL PRIMARY KEY,
    course_code CHARACTER VARYING(20) UNIQUE NOT NULL,
    course_title CHARACTER VARYING(100) NOT NULL,
    credit_hours INTEGER CHECK (credit_hours IN (1, 2, 3)) NOT NULL,
    faculty_id INTEGER REFERENCES faculty(faculty_id) ON DELETE SET NULL,
    section VARCHAR(10), -- Changed from section_id to directly store section name
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
	semester VARCHAR(20) NOT NULL
);

-- 4. Course Sessions Table
CREATE TABLE course_sessions (
    session_id SERIAL PRIMARY KEY,
    session_code CHARACTER VARYING(20) UNIQUE NOT NULL,
    course_id INTEGER REFERENCES courses(course_id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    session_time TIME NOT NULL,
    duration INTEGER DEFAULT 60, -- Duration in minutes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Student-Course Enrollments
CREATE TABLE student_course (
    enrollment_id SERIAL PRIMARY KEY,
    registration_number CHARACTER VARYING(20) REFERENCES students(registration_number) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(course_id) ON DELETE CASCADE,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    UNIQUE(registration_number, course_id)
);

-- 6. Attendance Table
CREATE TABLE attendance (
    attendance_id SERIAL PRIMARY KEY,
    registration_number CHARACTER VARYING(20) REFERENCES students(registration_number) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(course_id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES course_sessions(session_id) ON DELETE CASCADE,
    status_id INTEGER REFERENCES attendance_status(status_id),
    attendance_date DATE NOT NULL,
    attendance_time TIME NOT NULL,
    marked_by INTEGER REFERENCES faculty(faculty_id),
    marked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
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
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert the three attendance status options
INSERT INTO attendance_status (label) VALUES ('Present'), ('Absent'), ('Leave');

-- Insert default section options
INSERT INTO sections (name) VALUES ('A'), ('B'), ('C'), ('D'), ('E'), ('F'), ('G'), ('H');