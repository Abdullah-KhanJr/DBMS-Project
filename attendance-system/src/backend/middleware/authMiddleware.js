const jwt = require('jsonwebtoken');

/**
 * Get user from token - utility function to extract user info from token
 * without throwing errors (for use in non-protected routes)
 */
exports.getUserFromToken = (req) => {
    try {
        // Check for token in authorization header
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.replace('Bearer ', '');
            const secret = process.env.JWT_SECRET || 'your_very_secure_secret_key';
            const decoded = jwt.verify(token, secret);
            
            return {
                userId: decoded.userId || decoded.id,
                role: decoded.role || 'faculty',
                email: decoded.email,
                sessionId: decoded.sessionId
            };
        }
        
        // Check for token in HTTP-only cookie
        if (req.cookies && req.cookies.authToken) {
            const token = req.cookies.authToken;
            const secret = process.env.JWT_SECRET || 'your_very_secure_secret_key';
            const decoded = jwt.verify(token, secret);
            
            return {
                userId: decoded.userId || decoded.id,
                role: decoded.role || 'faculty',
                email: decoded.email,
                sessionId: decoded.sessionId
            };
        }
        
        return null;
    } catch (error) {
        console.warn('Failed to extract user from token:', error.message);
        return null;
    }
};

/**
 * Authentication middleware - enforces valid token
 * and sets user info in the request object
 */
exports.auth = (req, res, next) => {
    try {
        let token = null;
        
        // Check authorization header
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.replace('Bearer ', '');
        }
        
        // If no token in header, check cookies (for HTTP-only cookie auth)
        if (!token && req.cookies && req.cookies.authToken) {
            token = req.cookies.authToken;
        }
        
        // If still no token found, return authentication error
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
                code: 'NO_TOKEN'
            });
        }
        
        // Verify the token
        const secret = process.env.JWT_SECRET || 'your_very_secure_secret_key';
        const decoded = jwt.verify(token, secret);
        
        // Check token timestamp to prevent very old tokens from being used
        // This is a secondary check in addition to the JWT expiration
        if (decoded.timestamp) {
            const tokenAge = Date.now() - decoded.timestamp;
            const maxTokenAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
            
            if (tokenAge > maxTokenAge) {
                throw new Error('Token has exceeded maximum allowed age');
            }
        }
        
        // Set user data in request
        req.user = {
            userId: decoded.userId || decoded.id,
            role: decoded.role || 'faculty',
            email: decoded.email,
            sessionId: decoded.sessionId
        };
        
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        
        // Handle different error types
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Authentication token has expired',
                code: 'TOKEN_EXPIRED'
            });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid authentication token',
                code: 'INVALID_TOKEN'
            });
        }
        
        res.status(401).json({
            success: false,
            message: 'Authentication failed',
            error: error.message,
            code: 'AUTH_FAILED'
        });
    }
};