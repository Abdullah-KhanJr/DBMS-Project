const express = require('express');
const { register, login, checkAdminExists, logout, refreshToken } = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/check-admin', checkAdminExists);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);

// Add a logout endpoint that helps clients clear server-side session
router.post('/logout', (req, res) => {
  // Clear any server-side session data (if implemented)
  if (req.session) {
    req.session.destroy();
  }
  
  // Set headers to help client clear cache
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  
  // Send success response
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;