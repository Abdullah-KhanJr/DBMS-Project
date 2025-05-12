const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/facultyController');

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

module.exports = router; 