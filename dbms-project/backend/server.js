require('dotenv').config({ path: '../.env' });
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Import routes
const authRoutes = require('./routes/authRoutes');

const app = express();

// Middleware
app.use(express.static(path.join(__dirname, '../frontend')));
app.use(bodyParser.json());
app.use(cors());

// Database connection
const pool = require('./config/db');

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// API routes
app.use('/api', authRoutes);

// Database connection test
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

// Middleware to verify token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  const JWT_SECRET = process.env.JWT_SECRET || 'your_very_secure_secret_key';
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