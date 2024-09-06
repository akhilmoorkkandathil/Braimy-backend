const jwt = require('jsonwebtoken');

// Middleware to verify the token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract the token from the "Bearer" scheme

  if (token == null) return res.sendStatus(401); // If there's no token, respond with 401 Unauthorized

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // If token verification fails, respond with 403 Forbidden

    req.user = user; // Attach the token payload to the request object
    next(); // Pass control to the next middleware or route handler
  });
};

module.exports = authenticateToken;
