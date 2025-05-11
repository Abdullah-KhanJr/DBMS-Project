const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Create database connection pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Create express app
const app = express();

// Middleware
// Enable CORS first
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Configure JSON body parser with higher limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add comprehensive request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Headers:', JSON.stringify(req.headers));
  
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('Request body:', JSON.stringify(req.body));
  }
  
  // Track response for logging
  const originalSend = res.send;
  res.send = function(data) {
    console.log(`Response for ${req.method} ${req.path} - Status: ${res.statusCode}`);
    return originalSend.apply(res, arguments);
  };
  
  next();
});

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Import routes
try {
  const authRoutes = require('./routes/authRoutes');
  const facultyRoutes = require('./routes/facultyRoutes');
  
  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/faculty', facultyRoutes);
  
  console.log('Routes registered successfully');
} catch (error) {
  console.error('Error loading routes:', error);
}

// Test route that doesn't require auth
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Special handling for frontend routes
app.get('/pages/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', req.path));
});

// Catch-all route for frontend SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('==== SERVER ERROR ====');
  console.error('Path:', req.path);
  console.error('Query:', req.query);
  console.error('Body:', req.body);
  console.error('Error:', err);
  console.error('Stack trace:', err.stack);
  console.error('====================');
  
  res.status(500).json({
    success: false,
    message: 'Server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});