const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // Look for the token in the headers
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Access Denied: No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verify the token using your secret from .env
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach the user info to the request
        next(); // Move on to the next function
    } catch (err) {
        return res.status(401).json({ message: 'Invalid Token' });
    }
};
