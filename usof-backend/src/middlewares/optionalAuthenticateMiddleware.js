const jwt = require('jsonwebtoken');

/**
 * Middleware for optional authentication.
 * Attaches user to req.user if a valid token is provided,
 * but allows the request to continue even if no token is present.
 */
const optionalAuthenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            req.user = null;
            return next();
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            req.user = null;
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        
        req.user = decoded;
        
        return next();
    } catch (error) {
        req.user = null;
        return next();
    }
};

module.exports = optionalAuthenticate;