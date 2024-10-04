const studentModel = require('../models/userModel');
const commonMethods = require('../utils/commonMethods');
const { CreateError } = require('../utils/error');

const checkUserStatus = async (req, res, next) => {
   //console.log("In the middle ware to check the statut of user");
  const token = req.headers.authorization;
  const jwtPayload = commonMethods.parseJwt(token);
  const studentId = jwtPayload.id;
  const user = await studentModel.findOne({_id:studentId});
   //console.log(user);
  if (user.isBlocked) {
     //console.log('User is blocked');
    return next(CreateError(403, "User is blocked"));
  }
  next();
 
}

module.exports = checkUserStatus