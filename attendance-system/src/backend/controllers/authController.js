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
        
        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user.user_id, 
                role: user.user_type 
            },
            process.env.JWT_SECRET || 'your_very_secure_secret_key',
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );
        
        res.status(200).json({
            success: true,
            token,
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