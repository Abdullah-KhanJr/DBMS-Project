const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('./db');

// Login endpoint
router.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Validate GIKI email format
        const isValidEmail = /^u\d{7}@giki\.edu\.pk$/.test(email) || 
                          /^[a-zA-Z.]+@giki\.edu\.pk$/.test(email);
        
        if (!isValidEmail) {
            return res.status(400).json({ 
                success: false, 
                error: 'Please use a valid GIKI email (uXXXXXXX@giki.edu.pk for students or name@giki.edu.pk for faculty)' 
            });
        }

        // Check user exists and is active
        const userResult = await pool.query(
            `SELECT user_id, email, password, name, user_type, created_at 
             FROM users 
             WHERE email = $1 AND is_active = true`,
            [email]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({ 
                success: false, 
                error: 'Account not found or inactive' 
            });
        }

        const user = userResult.rows[0];

        // Plain text password comparison (NOT RECOMMENDED FOR PRODUCTION)
        if (password !== user.password) {
            return res.status(401).json({ 
                success: false, 
                error: 'Incorrect password' 
            });
        }

        // Create token payload
        const tokenPayload = {
            userId: user.user_id,
            userType: user.user_type,
            email: user.email
        };

        // Generate JWT token
        const token = jwt.sign(
            tokenPayload,
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        // Return success response
        res.json({
            success: true,
            token,
            user: {
                id: user.user_id,
                email: user.email,
                name: user.name,
                type: user.user_type,
                createdAt: user.created_at
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

// Authentication middleware
const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            error: 'Access token required' 
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ 
                success: false, 
                error: 'Invalid or expired token' 
            });
        }
        req.user = user;
        next();
    });
};

module.exports = router;