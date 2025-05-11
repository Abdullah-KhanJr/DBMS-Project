const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/facultyController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware
router.use(authMiddleware.auth);

// Faculty routes
router.get('/profile', facultyController.getProfile);
router.get('/courses', facultyController.getCourses);
router.post('/courses', facultyController.createCourse);
router.get('/sections', facultyController.getSections);
router.get('/recent-attendance', facultyController.getRecentAttendance);

module.exports = router;