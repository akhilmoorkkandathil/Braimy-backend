const jwt = require('jsonwebtoken');
const { CreateError } = require('../utils/error');

// Middleware to verify the token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract the token from the "Bearer" scheme
 //console.log("Token inside authnticatToken",token);
  if (token == null) return next(CreateError(403,"Unauthorized: Autherization failed")) // If there's no token, respond with 401 Unauthorized

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return next(CreateError(403,"Verification Failed")) // If token verification fails, respond with 403 Forbidden

    req.user = user; // Attach the token payload to the request object
    next(); // Pass control to the next middleware or route handler
  });
};

module.exports = authenticateToken;
