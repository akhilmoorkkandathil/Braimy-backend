const tutorModel = require('../models/tutorModel');
const commonMethods = require('../utils/commonMethods');
const { CreateError } = require('../utils/error');

const checkTutorStatus = async (req, res, next) => {
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

module.exports = checkTutorStatus