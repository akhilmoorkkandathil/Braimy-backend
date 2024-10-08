import studentModel from '../models/userModel.js';
import commonMethods from '../utils/commonMethods.js';
import { CreateError } from '../utils/error.js';


const checkUserStatus = async (req, res, next) => {
   const token = req.headers.authorization;
  const jwtPayload = commonMethods.parseJwt(token);
  const studentId = jwtPayload.id;
  const user = await studentModel.findOne({_id:studentId});
   if (user.isBlocked) {
     return next(CreateError(403, "User is blocked"));
  }
  next();
 
}

export default checkUserStatus;