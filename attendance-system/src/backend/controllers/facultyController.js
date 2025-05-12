const db = require('../config/db');

// Add a new course
exports.addCourse = async (req, res) => {
    const { course_code, course_title, credit_hours, faculty_id, section, description, semester } = req.body;
    try {
        const result = await db.query(
            `INSERT INTO courses (course_code, course_title, credit_hours, faculty_id, section, description, semester)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [course_code, course_title, credit_hours, faculty_id, section, description, semester]
        );
        res.status(201).json({ success: true, course: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Get all courses for a faculty
exports.getCourses = async (req, res) => {
    const { faculty_id } = req.query;
    try {
        const result = await db.query(
            `SELECT * FROM courses WHERE faculty_id = $1`,
            [faculty_id]
        );
        res.json({ success: true, courses: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Add a student to a course
exports.addStudentToCourse = async (req, res) => {
    const { registration_number, course_id } = req.body;
    try {
        // Check if student exists
        const studentResult = await db.query(
            `SELECT * FROM students WHERE registration_number = $1`,
            [registration_number]
        );
        if (studentResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Student does not exist.' });
        }

        // Check if course exists
        const courseResult = await db.query(
            `SELECT * FROM courses WHERE course_id = $1`,
            [course_id]
        );
        if (courseResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Course does not exist.' });
        }

        // Check if already enrolled
        const enrollmentResult = await db.query(
            `SELECT * FROM student_course WHERE registration_number = $1 AND course_id = $2`,
            [registration_number, course_id]
        );
        if (enrollmentResult.rows.length > 0) {
            return res.status(400).json({ success: false, error: 'Student is already enrolled in this course.' });
        }

        // Enroll student
        const result = await db.query(
            `INSERT INTO student_course (registration_number, course_id) VALUES ($1, $2) RETURNING *`,
            [registration_number, course_id]
        );
        res.status(201).json({ success: true, enrollment: result.rows[0] });
    } catch (err) {
        // Handle unique constraint violation
        if (err.code === '23505') {
            return res.status(400).json({ success: false, error: 'Student is already enrolled in this course.' });
        }
        res.status(500).json({ success: false, error: err.message });
    }
};

// Get all students in a course
exports.getStudentsInCourse = async (req, res) => {
    const { course_id } = req.query;
    try {
        const result = await db.query(
            `SELECT s.registration_number, u.name, u.email FROM student_course sc
             JOIN students s ON sc.registration_number = s.registration_number
             JOIN users u ON s.user_id = u.user_id
             WHERE sc.course_id = $1`,
            [course_id]
        );
        res.json({ success: true, students: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Mark attendance for a student in a session
exports.markAttendance = async (req, res) => {
    const { registration_number, course_id, session_id, status_id, attendance_date, attendance_time, marked_by } = req.body;
    try {
        const result = await db.query(
            `INSERT INTO attendance (registration_number, course_id, session_id, status_id, attendance_date, attendance_time, marked_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [registration_number, course_id, session_id, status_id, attendance_date, attendance_time, marked_by]
        );
        res.status(201).json({ success: true, attendance: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Get attendance records for a course/session
exports.getAttendanceRecords = async (req, res) => {
    const { course_id, session_id } = req.query;
    try {
        const result = await db.query(
            `SELECT a.*, u.name, u.email, s.registration_number, cs.session_date, cs.session_time, ast.label as status_label
             FROM attendance a
             JOIN students s ON a.registration_number = s.registration_number
             JOIN users u ON s.user_id = u.user_id
             JOIN course_sessions cs ON a.session_id = cs.session_id
             JOIN attendance_status ast ON a.status_id = ast.status_id
             WHERE a.course_id = $1 AND a.session_id = $2`,
            [course_id, session_id]
        );
        res.json({ success: true, records: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Verify if a student exists by registration_number
exports.verifyStudent = async (req, res) => {
    const { registration_number } = req.query;
    try {
        const result = await db.query(
            `SELECT s.registration_number, u.name, u.email 
             FROM students s
             JOIN users u ON s.user_id = u.user_id
             WHERE s.registration_number = $1`,
            [registration_number]
        );
        if (result.rows.length > 0) {
            res.json({ exists: true, success: true, student: result.rows[0] });
        } else {
            res.json({ exists: false, success: false });
        }
    } catch (err) {
        res.status(500).json({ exists: false, success: false, error: err.message });
    }
};