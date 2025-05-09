require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();

app.use(express.static(path.join(__dirname, 'frontend')));
app.use(bodyParser.json());
app.use(cors());

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'loginauth',
  password: process.env.DB_PASSWORD || 'loginauth',
  port: process.env.DB_PORT || 5432,
});

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

// Check if admin exists
async function adminExists() {
  const result = await pool.query('SELECT 1 FROM admin LIMIT 1');
  return result.rows.length > 0;
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    res.json({
      dbConnected: true,
      time: result.rows[0].current_time,
      database: process.env.DB_NAME
    });
  } catch (err) {
    res.status(500).json({
      dbConnected: false,
      error: err.message,
      config: {
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        host: process.env.DB_HOST
      }
    });
  }
});

// Registration endpoint
app.post('/api/register', async (req, res) => {
  const { name, email, password, userType, faculty, department, registrationNumber, facultyId } = req.body;

  if (!validateEmailByUserType(email, userType)) {
    return res.status(400).json({
      success: false,
      error: userType === 'student'
        ? 'Student email must be in format u1234567@giki.edu.pk'
        : 'Email must be in format name@giki.edu.pk'
    });
  }

  if (userType === 'admin' && await adminExists()) {
    return res.status(400).json({
      success: false,
      error: 'Admin account already exists. Only one admin is allowed.'
    });
  }

  try {
    await pool.query('BEGIN');

    const emailCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    // const hashedPassword = await bcrypt.hash(password, 10);

    const userResult = await pool.query(
      `INSERT INTO users 
      (name, email, password, user_type) 
      VALUES ($1, $2, $3, $4) 
      RETURNING user_id, name, email, user_type`,
      [name, email, password, userType]
    );

    const user = userResult.rows[0];

    if (userType === 'student') {
      if (!registrationNumber || !/^[0-9]{7}$/.test(registrationNumber)) {
        await pool.query('ROLLBACK');
        return res.status(400).json({ success: false, error: 'Invalid registration number format' });
      }

      await pool.query(
        `INSERT INTO students 
        (user_id, registration_number, faculty) 
        VALUES ($1, $2, $3)`,
        [user.user_id, registrationNumber, faculty]
      );

      user.registration_number = registrationNumber;
      user.faculty = faculty;

    } else if (userType === 'faculty') {
      if (!facultyId || !/^[0-9]{5}$/.test(facultyId)) {
        await pool.query('ROLLBACK');
        return res.status(400).json({ success: false, error: 'Invalid faculty ID format' });
      }

      const facultyResult = await pool.query(
        `INSERT INTO faculty 
        (faculty_id, user_id, department) 
        VALUES ($1, $2, $3) 
        RETURNING faculty_id`,
        [facultyId, user.user_id, department]
      );
      user.faculty_id = facultyResult.rows[0].faculty_id;
      user.department = department;

    } else if (userType === 'admin') {
      await pool.query(`INSERT INTO admin (user_id) VALUES ($1)`, [user.user_id]);
      user.admin_id = 1;
    }

    await pool.query('COMMIT');
    res.status(201).json({ success: true, user });

  } catch (err) {
    await pool.query('ROLLBACK');
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
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const userResult = await pool.query(
      `SELECT u.*, 
       s.registration_number, s.faculty as student_faculty,
       f.faculty_id, f.department as faculty_dept,
       a.admin_id
       FROM users u
       LEFT JOIN students s ON u.user_id = s.user_id
       LEFT JOIN faculty f ON u.user_id = f.user_id
       LEFT JOIN admin a ON u.user_id = a.user_id
       WHERE u.email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const user = userResult.rows[0];

    if (password !== user.password) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
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
    } else if (user.user_type === 'faculty') {
      userData.faculty_id = user.faculty_id;
      userData.department = user.faculty_dept;
    } else if (user.user_type === 'admin') {
      userData.admin_id = user.admin_id;
    }

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
});

// Protected route
app.get('/api/me', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT u.*, 
        s.registration_number, s.faculty as student_faculty,
        f.faculty_id, f.department as faculty_dept,
        a.admin_id
      FROM users u
      LEFT JOIN students s ON u.user_id = s.user_id
      LEFT JOIN faculty f ON u.user_id = f.user_id
      LEFT JOIN admin a ON u.user_id = a.user_id
      WHERE u.user_id = $1
    `;

    const result = await pool.query(query, [req.user.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
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
});

// Check if admin exists
app.get('/api/admin/exists', async (req, res) => {
  try {
    res.json({ exists: await adminExists() });
  } catch (err) {
    console.error('Error checking admin:', err);
    res.status(500).json({ error: 'Failed to check admin status' });
  }
});

// Middleware to verify token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
