const studentModel = require('../models/userModel');
const { CreateError } = require('../utils/error');

const checkUserStatus = async (req, res, next) => {
  const email = req.body.email;
  const user = await studentModel.find({email:email});
  if (user.isBlocked) {
    return next(CreateError(403,"User Blocked"));
  }
  next();
}

module.exports = checkUserStatus