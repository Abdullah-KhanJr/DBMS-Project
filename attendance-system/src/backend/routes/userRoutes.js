const express = require('express');
const { registerUser, loginUser, getUserProfile, updateUser, deleteUser } = require('../controllers/userController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

// User registration
router.post('/register', registerUser);

// User login
router.post('/login', loginUser);

// Get user profile
router.get('/profile', authenticate, getUserProfile);

// Update user information
router.put('/profile', authenticate, updateUser);

// Delete user account
router.delete('/profile', authenticate, deleteUser);

// Admin routes for user management
router.get('/', authenticate, authorizeRoles('admin'), (req, res) => {
    // Logic to get all users (to be implemented)
});

router.delete('/:id', authenticate, authorizeRoles('admin'), (req, res) => {
    // Logic to delete a user by ID (to be implemented)
});

module.exports = router;