// ============================================
// Authentication Middleware
// Protects routes by verifying JWT tokens
// ============================================

const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        // Get the token from the Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        // Extract the token (remove "Bearer " prefix)
        const token = authHeader.split(' ')[1];

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user info to the request object
        req.user = {
            id: decoded.id,
            email: decoded.email,
            name: decoded.name
        };

        // Move to the next middleware/route
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please log in again.'
            });
        }
        return res.status(401).json({
            success: false,
            message: 'Invalid token. Please log in again.'
        });
    }
};

module.exports = authMiddleware;
