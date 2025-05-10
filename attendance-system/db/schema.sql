CREATE TABLE Users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('student', 'faculty', 'admin')) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Students (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES Users(id) ON DELETE CASCADE,
    course_id INT REFERENCES Courses(id) ON DELETE SET NULL,
    enrollment_date DATE NOT NULL
);

CREATE TABLE Faculty (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES Users(id) ON DELETE CASCADE,
    department VARCHAR(100) NOT NULL
);

CREATE TABLE Courses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    faculty_id INT REFERENCES Faculty(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Attendance (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES Students(id) ON DELETE CASCADE,
    course_id INT REFERENCES Courses(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(10) CHECK (status IN ('present', 'absent')) NOT NULL
);

CREATE TABLE QR_Codes (
    id SERIAL PRIMARY KEY,
    course_id INT REFERENCES Courses(id) ON DELETE CASCADE,
    code VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);