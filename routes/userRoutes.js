import express from 'express';
import userController from '../controllers/userController.js';
import checkUserStatus from '../middlewares/userStatus.js';
import checkCoordinatorBlockStatus from '../middlewares/coordinatorStatus.js';
import upload from '../utils/multur.js';
import authenticateToken from '../middlewares/authJWT.js';

const userRouter = express.Router();

userRouter.post('/register_user', userController.userRegister);
userRouter.patch('/resend_otp',userController.resendOTP);
userRouter.patch('/verify_user',userController.verifyOtp);
userRouter.post('/login',userController.userLogin);
userRouter.post('/set_otp',userController.setOtp);
userRouter.post('/googleLogin',userController.googleLogin)

userRouter.get('/getCourseData/:id',userController.getCourseData);
userRouter.get('/searchCourses',userController.getCoursesData);
userRouter.post('/saveUser',userController.saveUserData);
 userRouter.get('/getUsers',authenticateToken,userController.getUserList);
userRouter.post('/addStudent',authenticateToken, upload.single('image'),userController.addStudent);
userRouter.patch('/blockStudent/:id',checkCoordinatorBlockStatus,userController.blockStudent);
userRouter.patch('/unblockStudent/:id',checkCoordinatorBlockStatus,userController.unblockStudent);
userRouter.get('/getStudent/:id',authenticateToken,userController.getStudent);
userRouter.post('/updateStudent/:id', upload.single('image'),userController.updateStudent);
userRouter.post('/uploadProfilePhoto',authenticateToken,checkUserStatus,upload.single('image'),userController.uploadProfilePhoto);
userRouter.post('/editProfileInfo',authenticateToken,checkUserStatus,userController.updateUserProfile)
 userRouter.post('/subscribe',userController.subscribe);
userRouter.get('/blockStatus',authenticateToken, userController.blockStatus);
userRouter.get('/getStudentClasses',authenticateToken, checkUserStatus ,userController.getStudentClasses);
userRouter.post('/login',checkUserStatus,userController.userLogin);
userRouter.get('/getStudentData',authenticateToken,userController.getStudentData);
userRouter.post('/payment',authenticateToken,checkUserStatus,userController.payment);
userRouter.post('/updatePaymentStatus/:orderId',authenticateToken,checkUserStatus,userController.updatePaymentStatus);
userRouter.get('/get_old_chats/:tutorId',authenticateToken,checkUserStatus,userController.getOldChats);
userRouter.get('/getStudentTutorsWithLastMessage',authenticateToken,checkUserStatus,userController.getStudentTutorsWithLastMessage);
userRouter.post('/addToBucket',authenticateToken,checkUserStatus,userController.addToBucket);
userRouter.get('/fetchBucketCourses',authenticateToken,checkUserStatus,userController.fetchBucketCourses);
userRouter.get('/fetchAllBucketCourses',authenticateToken,checkUserStatus,userController.fetchAllBucketCourses);
userRouter.get('/fetchPaymentHistory',authenticateToken,checkUserStatus,userController.fetchPaymentHistory)

export default userRouter;
 