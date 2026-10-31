const jwt = require('jsonwebtoken');

const { JWT_SECRET } = require('../config/jwt');

function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                message: 'Authorization header is required'
            });
        }

        const [type, token] = authHeader.split(' ');

        if (type !== 'Bearer' || !token) {
            return res.status(401).json({
                message: 'Invalid authorization format'
            });
        }

        const decoded = jwt.verify(
            token,
            JWT_SECRET 
        );

        req.user = {
            id: decoded.id,
            role: decoded.role
        };

        next();

    } catch (error) {
        return res.status(401).json({
            message: 'Invalid or expired token'
        });
    }
}

module.exports = authenticate;