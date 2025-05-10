const express = require('express');
const { registerUser, loginUser } = require('../controllers/authController');
const { validateRegistration, validateLogin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', validateRegistration, registerUser);
router.post('/login', validateLogin, loginUser);

module.exports = router;