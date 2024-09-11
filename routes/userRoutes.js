const express = require('express');
const userController = require('../controllers/userController');
const checkUserStatus = require('../middlewares/userStatus');
const checkCoordinatorBlockStatus = require('../middlewares/coordinatorStatus');
const userRouter = express.Router();
const upload = require('../utils/multur');

userRouter.post('/register_user', userController.userRegister);
userRouter.patch('/resend_otp',userController.resendOTP);
userRouter.patch('/verify_user',userController.verifyOtp);
userRouter.post('/login',checkUserStatus,userController.userLogin);
userRouter.post('/set_otp',userController.setOtp);

userRouter.post('/saveUser',userController.saveUserData);
userRouter.get('/getUser',userController.getUserList);
userRouter.post('/addStudent', upload.single('image'),userController.addStudent);
userRouter.patch('/blockStudent/:id',checkCoordinatorBlockStatus,userController.blockStudent);
userRouter.patch('/unblockStudent/:id',checkCoordinatorBlockStatus,userController.unblockStudent);
userRouter.get('/getStudent/:id',userController.getStudent);
userRouter.post('/updateStudent/:id', upload.single('image'),checkCoordinatorBlockStatus,userController.updateStudent);

//userRouter.get('/getTutorUser',userController.getTutorUser);
userRouter.post('/subscribe',userController.subscribe);
userRouter.get('/blockStatus',userController.blockStatus);
userRouter.get('/getStudentClasses',userController.getStudentClasses);
userRouter.get('/getCourseData/:id',userController.getCourseData);
userRouter.get('/searchCourses',userController.getCoursesData);
userRouter.get('/getStudentData',userController.getStudentData);
userRouter.post('/payment',userController.payment);
userRouter.post('/payment_success',userController.paymentSucess);
userRouter.get('/get_old_chats/:tutorId',userController.getOldChats);
userRouter.get('/getStudentTutorsWithLastMessage',userController.getStudentTutorsWithLastMessage);

module.exports = userRouter;

///For tommorrow
// complete the student fetch for tutores and updae the sideba