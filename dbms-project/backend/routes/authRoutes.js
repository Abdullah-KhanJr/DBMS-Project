const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Authentication routes
// Since these will be mounted under /api in server.js,
// the full paths will be /api/login, /api/register, etc.
router.post('/login', authController.loginUser);
router.post('/register', authController.registerUser);
router.get('/me', authenticateToken, authController.getUserProfile);
router.get('/admin/exists', authController.checkAdminExists);

module.exports = router;