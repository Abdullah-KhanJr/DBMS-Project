const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.auth = (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).send({ error: 'Please authenticate' });
    }
};

exports.authRole = (role) => {
    return (req, res, next) => {
        if (req.user.role !== role) {
            return res.status(403).json({ 
                message: 'Access denied: Insufficient permissions' 
            });
        }
        next();
    };
};

exports.authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user exists and is active
    const { rows } = await db.query(
      'SELECT * FROM users WHERE user_id = $1 AND is_active = true',
      [decoded.id]
    );
    
    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found or account inactive'
      });
    }

    // Set user info on request object
    req.user = {
      id: decoded.id,
      email: decoded.email,
      type: decoded.type
    };
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

// Authorize by user type
exports.authorize = (...userTypes) => {
  return (req, res, next) => {
    if (!userTypes.includes(req.user.type)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access this resource'
      });
    }
    next();
  };
};