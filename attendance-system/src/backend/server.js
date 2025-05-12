const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const facultyRoutes = require('./routes/facultyRoutes');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/faculty', facultyRoutes);

// Serve the main index page for root requests
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/index.html'));
});

// Route for login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/login.html'));
});

// Route for register page
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/register.html'));
});

// Handle 404 errors
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '../frontend/pages/404.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
const PORT = process.env.PORT || 3000;  // Changed from 5000 to 3000
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open your browser and navigate to http://localhost:${PORT}`);
});