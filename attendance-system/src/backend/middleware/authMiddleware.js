const jwt = require('jsonwebtoken');

exports.auth = (req, res, next) => {
    try {
        // Log for debugging
        console.log('Auth middleware headers:', req.headers);
        
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No authentication token provided'
            });
        }
        
        const token = authHeader.replace('Bearer ', '');
        
        // Log the token (first few chars)
        console.log('Token received:', token.substring(0, 20) + '...');
        
        // Use the correct JWT secret from env
        const secret = process.env.JWT_SECRET || 'your_very_secure_secret_key';
        const decoded = jwt.verify(token, secret);
        
        // Log the decoded token
        console.log('Decoded token:', decoded);
        
        // Set user data in request
        req.user = {
            id: decoded.userId || decoded.id,
            role: decoded.role || 'faculty',
            email: decoded.email
        };
        
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({
            success: false,
            message: 'Authentication failed',
            error: error.message
        });
    }
};