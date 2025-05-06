const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../../.env' });
const UserModel = require('../models/userModel');
const { hashPassword, comparePassword } = require('../utils/hashUtils');

const JWT_SECRET = process.env.JWT_SECRET || 'your_very_secure_secret_key';
const JWT_EXPIRES_IN = '1h';

// Validate email by user type
function validateEmailByUserType(email, userType) {
  if (userType === 'student') {
    return /^u\d{7}@giki\.edu\.pk$/.test(email);
  } else if (userType === 'faculty' || userType === 'admin') {
    return /^[a-zA-Z.]+@giki\.edu\.pk$/.test(email);
  }
  return false;
}

// User registration
async function registerUser(req, res) {
  const { name, email, password, userType, faculty, department, registrationNumber, facultyId } = req.body;

  if (!validateEmailByUserType(email, userType)) {
    return res.status(400).json({
      success: false,
      error: userType === 'student'
        ? 'Student email must be in format u1234567@giki.edu.pk'
        : 'Email must be in format name@giki.edu.pk'
    });
  }

  try {
    // Check if admin already exists for admin registration
    if (userType === 'admin' && await UserModel.adminExists()) {
      return res.status(400).json({
        success: false,
        error: 'Admin account already exists. Only one admin is allowed.'
      });
    }

    // Check if email already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create user with appropriate role
    const userData = {
      name,
      email,
      password: hashedPassword,
      userType,
      ...(userType === 'student' && { registrationNumber, faculty }),
      ...(userType === 'faculty' && { facultyId, department })
    };

    // Validate specific fields based on user type
    if (userType === 'student' && (!registrationNumber || !/^[0-9]{7}$/.test(registrationNumber))) {
      return res.status(400).json({ success: false, error: 'Invalid registration number format' });
    }

    if (userType === 'faculty' && (!facultyId || !/^[0-9]{5}$/.test(facultyId))) {
      return res.status(400).json({ success: false, error: 'Invalid faculty ID format' });
    }

    // Create the user using our model
    const user = await UserModel.create(userData);
    
    res.status(201).json({ 
      success: true, 
      user: {
        ...user,
        ...(userType === 'student' && { 
          registration_number: registrationNumber,
          faculty
        }),
        ...(userType === 'faculty' && { 
          faculty_id: facultyId,
          department
        })
      }
    });

  } catch (err) {
    console.error('Registration error:', err);

    if (err.code === '23505') {
      if (err.constraint === 'students_registration_number_key') {
        return res.status(400).json({ success: false, error: 'Registration number already exists' });
      }
      if (err.constraint === 'faculty_faculty_id_key') {
        return res.status(400).json({ success: false, error: 'Faculty ID already exists' });
      }
    }

    res.status(500).json({
      success: false,
      error: 'Registration failed',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}

// User login
async function loginUser(req, res) {
  const { email, password } = req.body;

  try {
    const user = await UserModel.findByEmail(email);

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // Compare password with hashed password in database
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const userData = {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      user_type: user.user_type,
      created_at: user.created_at
    };

    // Add role-specific data
    if (user.user_type === 'student') {
      userData.registration_number = user.registration_number;
      userData.faculty = user.student_faculty;
      userData.student_id = user.registration_number; // Match frontend expectation
    } else if (user.user_type === 'faculty') {
      userData.faculty_id = user.faculty_id;
      userData.department = user.faculty_dept;
    } else if (user.user_type === 'admin') {
      userData.admin_id = user.admin_id;
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.user_id,
        userType: user.user_type,
        ...(user.user_type === 'student' && {
          registrationNumber: user.registration_number
        }),
        ...(user.user_type === 'faculty' && {
          facultyId: user.faculty_id
        }),
        ...(user.user_type === 'admin' && {
          adminId: user.admin_id
        })
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({ success: true, token, user: userData });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}

// Get user profile
async function getUserProfile(req, res) {
  try {
    const user = await UserModel.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      user_type: user.user_type,
      created_at: user.created_at
    };

    if (user.user_type === 'student') {
      userData.registration_number = user.registration_number;
      userData.faculty = user.student_faculty;
      userData.student_id = user.registration_number; // Match frontend expectation
    } else if (user.user_type === 'faculty') {
      userData.faculty_id = user.faculty_id;
      userData.department = user.faculty_dept;
    } else if (user.user_type === 'admin') {
      userData.admin_id = user.admin_id;
    }

    res.json(userData);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Check if admin exists
async function checkAdminExists(req, res) {
  try {
    res.json({ exists: await UserModel.adminExists() });
  } catch (err) {
    console.error('Error checking admin:', err);
    res.status(500).json({ error: 'Failed to check admin status' });
  }
}

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  checkAdminExists
};