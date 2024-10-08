import jwt from 'jsonwebtoken';
import  {CreateError} from '../utils/error.js';
 const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 
  if (token == null) return next(CreateError(403,"Unauthorized: Autherization failed"))
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return next(CreateError(403,"Verification Failed")) 
    req.user = user; 
    next(); 
  });
};

export default authenticateToken;
