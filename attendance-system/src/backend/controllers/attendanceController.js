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