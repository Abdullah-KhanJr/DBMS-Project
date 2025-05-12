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
            `SELECT course_id, course_code, course_title, credit_hours, section FROM courses WHERE faculty_id = $1`,
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

// Mark attendance for a batch of students in a session
exports.markAttendance = async (req, res) => {
    const { session_id, course_id, attendance } = req.body;
    if (!Array.isArray(attendance)) {
        return res.status(400).json({ success: false, error: 'Attendance must be an array.' });
    }
    try {
        for (const record of attendance) {
            const { registration_number, status_id, attendance_date, attendance_time, marked_by } = record;
            await db.query(
                `INSERT INTO attendance (registration_number, course_id, session_id, status_id, attendance_date, attendance_time, marked_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [registration_number, course_id, session_id, status_id, attendance_date, attendance_time, marked_by]
            );
        }
        res.status(201).json({ success: true, message: 'Attendance saved successfully.' });
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

// Create a new course session
exports.createCourseSession = async (req, res) => {
    console.log('Received request to create course session:', req.body);
    const { course_id, session_date, duration } = req.body;
    try {
        // Extract session_time from the session_date (which should be in ISO format like 2025-05-12T08:30:00)
        const dateObj = new Date(session_date);
        const session_time = dateObj.toTimeString().split(' ')[0]; // Get HH:MM:SS
        
        // Generate a unique session code based on course and timestamp
        // Make sure it's within 20 characters for VARCHAR(20)
        const shortTimestamp = Math.floor(Date.now() / 1000) % 10000; // Last 4 digits of unix timestamp
        const session_code = `S${course_id}-${shortTimestamp}`;
        
        console.log('Creating session with parameters:', {
            session_code,
            course_id,
            session_date: dateObj.toISOString().split('T')[0],
            session_time,
            duration
        });
        
        const result = await db.query(
            `INSERT INTO course_sessions (session_code, course_id, session_date, session_time, duration) 
             VALUES ($1, $2, $3, $4, $5) RETURNING session_id`,
            [session_code, course_id, dateObj.toISOString().split('T')[0], session_time, duration]
        );
        
        console.log('Session created successfully with id:', result.rows[0].session_id);
        res.status(201).json({ session_id: result.rows[0].session_id });
    } catch (err) {
        console.error('Error creating session:', err);
        res.status(500).json({ error: err.message });
    }
};

// Get all course sessions for a faculty
exports.getCourseSessions = async (req, res) => {
    const { faculty_id } = req.query;
    try {
        const result = await db.query(
            `SELECT c.course_code, c.course_title, c.credit_hours, 
                    COUNT(cs.session_id) AS sessions_conducted
             FROM courses c
             LEFT JOIN course_sessions cs ON c.course_id = cs.course_id
             WHERE c.faculty_id = $1
             GROUP BY c.course_id, c.course_code, c.course_title, c.credit_hours`,
            [faculty_id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};