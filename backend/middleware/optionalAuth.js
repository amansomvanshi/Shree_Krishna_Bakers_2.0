const jwt = require("jsonwebtoken");

/**
 * Optional Authentication Middleware
 * 
 * Attempts to verify JWT token if present, but does not block the request if missing.
 * Attaches user info to request object if token is valid.
 */
module.exports = (req, res, next) => {
    const token = req.header("x-auth-token");

    if (!token) {
        return next(); // Proceed without req.user
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        // If token is invalid/expired, we still proceed but without req.user
        // This allows the route to handle it as a guest request
        next();
    }
};
