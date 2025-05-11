const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/facultyController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// All routes require authentication and faculty role
router.use(authenticate);
router.use(authorize('faculty'));

// Faculty profile
router.get('/profile', facultyController.getProfile);

// Courses management
router.get('/courses', facultyController.getCourses);
router.post('/courses', facultyController.createCourse);

// Sections
router.get('/sections', facultyController.getSections);

// Student management
router.get('/enrolled-students/:courseId', facultyController.getEnrolledStudents);
router.get('/verify-student/:regNumber', facultyController.verifyStudent);
router.post('/enroll-student', facultyController.enrollStudent);
router.delete('/enrollment/:enrollmentId', facultyController.removeEnrollment);

// Attendance management
router.post('/create-session', facultyController.createCourseSession);
router.get('/course-sessions', facultyController.getCourseSessions);
router.get('/course-attendance-stats', facultyController.getCourseAttendanceStats);
router.get('/course/:courseId/attendance', facultyController.getCourseAttendanceRecords);
router.post('/save-attendance', facultyController.markAttendance);

module.exports = router;