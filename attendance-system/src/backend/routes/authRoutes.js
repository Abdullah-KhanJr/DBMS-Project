const express = require('express');
const { register, login, checkAdminExists } = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/check-admin', checkAdminExists);

module.exports = router;