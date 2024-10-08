import tutorModel from '../models/tutorModel.js';
import commonMethods from '../utils/commonMethods.js';
import { CreateError } from '../utils/error.js';


export const checkTutorStatus = async (req, res, next) => {
    try {

      const token = req.headers.authorization;
      const jwtPayload = commonMethods.parseJwt(token);
      const tutorId = jwtPayload.id;
      const tutor = await tutorModel.findOne({_id:tutorId});
      if (tutor.isBlocked) {
        return next(CreateError(403,"User Blocked"));
      }
      next();
    } catch (error) {
      console.log(error);
      return next(CreateError(500,"Error in tutor status check middleware"));
    }
}

