const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/facultyController');
const db = require('../config/db');

// Add a new course
router.post('/courses', facultyController.addCourse);
// Get all courses for a faculty
router.get('/courses', facultyController.getCourses);
// Add a student to a course
router.post('/courses/add-student', facultyController.addStudentToCourse);
// Get all students in a course
router.get('/courses/students', facultyController.getStudentsInCourse);
// Mark attendance
router.post('/attendance/mark', facultyController.markAttendance);
// Get attendance records
router.get('/attendance/records', facultyController.getAttendanceRecords);
// Add a route for verifying student existence
router.get('/verify-student', facultyController.verifyStudent);
// Add a new course session
router.post('/course-sessions', facultyController.createCourseSession);
// Get all course sessions for a faculty
router.get('/course-sessions', facultyController.getCourseSessions);
// Get attendance matrix
router.get('/attendance/matrix', facultyController.getAttendanceMatrix);

router.get('/attendance-status', async (req, res) => {
    try {
        const result = await db.query('SELECT status_id, label FROM attendance_status');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router; 