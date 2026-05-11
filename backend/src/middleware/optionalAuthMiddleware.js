const jwt = require('jsonwebtoken');

/**
 * Optional Authentication Middleware
 * Populates req.user if a valid token is provided, 
 * but allows the request to continue if no token is found.
 */
const optionalAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    // If token is invalid, we still continue but without req.user
    next();
  }
};

module.exports = optionalAuthMiddleware;
