const db = require('../config/db');

// Mark attendance for a student
exports.markAttendance = async (req, res) => {
    const { studentId, courseId } = req.body;
    const attendanceDate = new Date();

    try {
        const result = await db.query(
            'INSERT INTO Attendance (student_id, course_id, attendance_date) VALUES ($1, $2, $3)',
            [studentId, courseId, attendanceDate]
        );
        res.status(201).json({ message: 'Attendance marked successfully', result });
    } catch (error) {
        res.status(500).json({ message: 'Error marking attendance', error });
    }
};

// Retrieve attendance records for a student
exports.getAttendanceRecords = async (req, res) => {
    const { studentId } = req.params;

    try {
        const result = await db.query(
            'SELECT * FROM Attendance WHERE student_id = $1 ORDER BY attendance_date DESC',
            [studentId]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving attendance records', error });
    }
};

// Retrieve attendance records for a course
exports.getCourseAttendance = async (req, res) => {
    const { courseId } = req.params;

    try {
        const result = await db.query(
            'SELECT * FROM Attendance WHERE course_id = $1 ORDER BY attendance_date DESC',
            [courseId]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving course attendance records', error });
    }
};

exports.getStudentCourseAttendance = async (req, res) => {
    const { registrationNumber, courseId } = req.params;
    try {
        const result = await db.query(
            `SELECT a.session_id, cs.session_date, cs.session_time, ast.label as status_label
             FROM attendance a
             JOIN course_sessions cs ON a.session_id = cs.session_id
             JOIN attendance_status ast ON a.status_id = ast.status_id
             WHERE a.registration_number = $1 AND a.course_id = $2
             ORDER BY cs.session_date, cs.session_time`,
            [registrationNumber, courseId]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving attendance records', error });
    }
};