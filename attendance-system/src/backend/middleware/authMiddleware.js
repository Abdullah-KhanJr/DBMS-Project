exports.isAuthenticated = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        req.userId = decoded.id;
        next();
    });
};

exports.isAdmin = (req, res, next) => {
    if (req.userRole !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }
    next();
};

exports.isFaculty = (req, res, next) => {
    if (req.userRole !== 'faculty') {
        return res.status(403).json({ message: 'Access denied' });
    }
    next();
};

exports.isStudent = (req, res, next) => {
    if (req.userRole !== 'student') {
        return res.status(403).json({ message: 'Access denied' });
    }
    next();
};