const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Route to mark attendance
router.post('/mark', authMiddleware.verifyToken, roleMiddleware.isFaculty, attendanceController.markAttendance);

// Route to retrieve attendance records for a specific student
router.get('/records/:studentId', authMiddleware.verifyToken, roleMiddleware.isStudent, attendanceController.getAttendanceRecords);

// Route to retrieve attendance records for a specific course (faculty)
router.get('/course/:courseId', authMiddleware.verifyToken, roleMiddleware.isFaculty, attendanceController.getCourseAttendance);

// Route to retrieve all attendance records (admin)
router.get('/all', authMiddleware.verifyToken, roleMiddleware.isAdmin, attendanceController.getAllAttendanceRecords);

// Route to retrieve student course attendance
router.get('/records/:registrationNumber/course/:courseId', authMiddleware.auth, attendanceController.getStudentCourseAttendance);

module.exports = router;