const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Route for student dashboard
router.get('/student', authMiddleware.verifyToken, roleMiddleware.isStudent, dashboardController.getStudentDashboard);

// Route for faculty dashboard
router.get('/faculty', authMiddleware.verifyToken, roleMiddleware.isFaculty, dashboardController.getFacultyDashboard);

// Route for admin dashboard
router.get('/admin', authMiddleware.verifyToken, roleMiddleware.isAdmin, dashboardController.getAdminDashboard);

module.exports = router;