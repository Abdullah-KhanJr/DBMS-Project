// At the top of the file:
const db = require('../config/db');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    console.log('Register endpoint called with data:', JSON.stringify(req.body, null, 2));
    
    const { username, email, password, role } = req.body;
    
    try {
        // Check if email already exists
        console.log('Checking if email exists:', email);
        const emailCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (emailCheck.rows.length > 0) {
            console.log('Email already exists in database');
            return res.status(400).json({ 
                success: false, 
                message: 'Email already in use' 
            });
        }
        
        // If registering as admin, check if an admin already exists
        if (role === 'admin') {
            console.log('Admin role requested, checking if admin exists already');
            const adminCheck = await db.query('SELECT * FROM admin');
            if (adminCheck.rows.length > 0) {
                console.log('Admin already exists');
                return res.status(400).json({ 
                    success: false, 
                    message: 'An administrator account already exists' 
                });
            }
        }
        
        // Begin transaction
        console.log('Beginning database transaction');
        await db.query('BEGIN');
        
        // Insert into users table
        console.log('Inserting into users table');
        const userResult = await db.query(
            'INSERT INTO users (email, password, name, user_type) VALUES ($1, $2, $3, $4) RETURNING user_id',
            [email, password, username, role]
        );
        
        const userId = userResult.rows[0].user_id;
        console.log(`User created with ID: ${userId}`);
        
        // Insert into role-specific table based on user type
        if (role === 'student') {
            const { registrationNumber, faculty } = req.body;
            console.log('Creating student record');
            await db.query(
                'INSERT INTO students (registration_number, user_id, faculty) VALUES ($1, $2, $3)',
                [registrationNumber, userId, faculty]
            );
        } 
        else if (role === 'faculty') {
            const { facultyId, department } = req.body;
            console.log('Creating faculty record');
            await db.query(
                'INSERT INTO faculty (faculty_id, user_id, department) VALUES ($1, $2, $3)',
                [facultyId, userId, department]
            );
        } 
        else if (role === 'admin') {
            const { adminId } = req.body;
            console.log('Creating admin record');
            await db.query(
                'INSERT INTO admin (admin_id, user_id) VALUES ($1, $2)',
                [adminId, userId]
            );
        }
        
        // Commit transaction
        console.log('Committing transaction');
        await db.query('COMMIT');
        
        console.log('Registration successful for user:', username);
        
        res.status(201).json({
            success: true,
            message: 'User registered successfully'
        });
        
    } catch (error) {
        // Rollback in case of error
        console.error('ERROR in registration:', error);
        try {
            await db.query('ROLLBACK');
            console.log('Transaction rolled back due to error');
        } catch (rollbackError) {
            console.error('Error during rollback:', rollbackError);
        }
        
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    }
};

// Keep the rest of the file as is

// Login user
exports.login = async (req, res) => {
    const { email, password } = req.body;
    
    try {
        // Check if user exists
        const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (userResult.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        
        const user = userResult.rows[0];
        
        // Check if password matches (plain text comparison)
        if (password !== user.password) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        
        // Get additional user info based on role
        let additionalInfo = {};
        
        if (user.user_type === 'student') {
            const studentResult = await db.query('SELECT * FROM students WHERE user_id = $1', [user.user_id]);
            if (studentResult.rows.length > 0) {
                additionalInfo = {
                    registrationNumber: studentResult.rows[0].registration_number,
                    faculty: studentResult.rows[0].faculty
                };
            }
        } 
        else if (user.user_type === 'faculty') {
            const facultyResult = await db.query('SELECT * FROM faculty WHERE user_id = $1', [user.user_id]);
            if (facultyResult.rows.length > 0) {
                additionalInfo = {
                    facultyId: facultyResult.rows[0].faculty_id,
                    department: facultyResult.rows[0].department
                };
            }
        } 
        else if (user.user_type === 'admin') {
            const adminResult = await db.query('SELECT * FROM admin WHERE user_id = $1', [user.user_id]);
            if (adminResult.rows.length > 0) {
                additionalInfo = {
                    adminId: adminResult.rows[0].admin_id
                };
            }
        }
        
        // Create token payload with unique session identifier
        const sessionId = require('crypto').randomBytes(16).toString('hex');
        
        // Generate JWT token with shorter expiration time
        const token = jwt.sign(
            { 
                userId: user.user_id, 
                role: user.user_type,
                sessionId: sessionId,
                timestamp: Date.now() // Add timestamp for extra token uniqueness
            },
            process.env.JWT_SECRET || 'your_very_secure_secret_key',
            { expiresIn: process.env.JWT_EXPIRES_IN || '8h' } // Reduced token lifetime
        );
        
        // Set HTTP-only cookies for better security
        res.cookie('authToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Set secure in production
            maxAge: 8 * 60 * 60 * 1000, // 8 hours in milliseconds
            sameSite: 'strict'
        });
        
        // Set cache-control headers to prevent caching of auth response
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        
        // Send response
        res.status(200).json({
            success: true,
            token,
            tokenExpiry: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // Show when token expires
            user: {
                userId: user.user_id,
                name: user.name,
                email: user.email,
                role: user.user_type,
                ...additionalInfo
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
};

// Check if admin exists
exports.checkAdminExists = async (req, res) => {
    try {
        const adminResult = await db.query('SELECT COUNT(*) FROM admin');
        const adminCount = parseInt(adminResult.rows[0].count);
        
        res.status(200).json({
            adminExists: adminCount > 0
        });
    } catch (error) {
        console.error('Error checking admin existence:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check admin existence',
            error: error.message
        });
    }
};

// Handle user logout
exports.logout = async (req, res) => {
    try {
        // Clear HTTP-only cookie if it exists
        res.clearCookie('authToken');
        
        // Set cache control headers to ensure fresh state after logout
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        
        // Record logout action in database if needed
        // This could include logging the logout time or invalidating tokens server-side
        try {
            const userId = req.user?.userId; // In case we have user data from auth middleware
            if (userId) {
                // Optional: record logout in activity log
                // await db.query('INSERT INTO user_activity_log (user_id, action, timestamp) VALUES ($1, $2, NOW())', 
                //    [userId, 'LOGOUT']);
            }
        } catch (logError) {
            console.warn('Failed to log logout activity:', logError);
            // Non-critical error, continue with logout
        }
        
        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout process encountered an error',
            error: error.message
        });
    }
};

// Token refresh endpoint
exports.refreshToken = async (req, res) => {
    try {
        // Get the current token from authorization header
        const authHeader = req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }
        
        const token = authHeader.replace('Bearer ', '');
        
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_very_secure_secret_key');
        
        // Get user information
        const userResult = await db.query('SELECT * FROM users WHERE user_id = $1', [decoded.userId]);
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        const user = userResult.rows[0];
        
        // Create a new session ID
        const sessionId = require('crypto').randomBytes(16).toString('hex');
        
        // Generate a new token with extended expiration
        const newToken = jwt.sign(
            {
                userId: user.user_id,
                role: user.user_type,
                sessionId: sessionId,
                timestamp: Date.now()
            },
            process.env.JWT_SECRET || 'your_very_secure_secret_key',
            { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
        );
        
        // Set new HTTP-only cookie
        res.cookie('authToken', newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 8 * 60 * 60 * 1000,
            sameSite: 'strict'
        });
        
        // Set cache control headers
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        
        // Send the new token
        res.status(200).json({
            success: true,
            token: newToken,
            tokenExpiry: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
            message: 'Token refreshed successfully'
        });
        
    } catch (error) {
        console.error('Token refresh error:', error);
        
        // If token verification fails, send 401
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Token refresh failed',
            error: error.message
        });
    }
};