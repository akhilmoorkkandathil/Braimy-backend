import coordinatorModel from '../models/coordinatorModel.js';
import { CreateError } from '../utils/error.js';


const checkCoordinatorBlockStatus = async (req, res, next) => {
    try {

        const email = req.body.email;
      const user = await coordinatorModel.find({email:email});
      if (user.isBlocked) {
        return next(CreateError(403,"Coordinator Blocked"));
      }
      next();
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
}

export default checkCoordinatorBlockStatus;