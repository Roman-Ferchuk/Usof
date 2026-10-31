const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');

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

        const decoded = jwt.verify(token, JWT_SECRET);

        req.user = { id: decoded.id, role: decoded.role };
        
        return next();
    } catch (error) {
        req.user = null;
        return next();
    }
};

module.exports = optionalAuthenticate;