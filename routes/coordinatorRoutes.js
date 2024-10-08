import express from 'express';
import {coordinatorController} from '../controllers/coordinatorController.js';
import checkCoordinatorBlockStatus from '../middlewares/coordinatorStatus.js';
import authenticateToken from '../middlewares/authJWT.js';
import upload from '../utils/multur.js';

const coordinatorRouter = express.Router();


coordinatorRouter.post('/register_coordinator',coordinatorController.coordinatorRegister );
coordinatorRouter.post('/login',coordinatorController.coordinatorLogin);
coordinatorRouter.get('/getCoordinators',coordinatorController.getCoordinatorsList);
coordinatorRouter.post('/addCoordinator',authenticateToken,coordinatorController.addCoordinator);
coordinatorRouter.patch('/blockCoordinator/:id',authenticateToken, coordinatorController.blockCoordinator);
coordinatorRouter.patch('/verifyCoordinator/:id',authenticateToken, coordinatorController.verifyCoordinator);
coordinatorRouter.patch('/unblockCoordinator/:id',authenticateToken, coordinatorController.unblockCoordinator);
coordinatorRouter.delete('/deleteCoordinator/:id',authenticateToken, coordinatorController.deleteCoordinator);
coordinatorRouter.get('/getCoordinator/:id',authenticateToken, coordinatorController.getCoordinator);
coordinatorRouter.put('/updateCoordinator/:id',authenticateToken, coordinatorController.updateCoordinator);
coordinatorRouter.post('/manageStudent',authenticateToken,coordinatorController.manageStudent);
coordinatorRouter.get('/todaysClasses',authenticateToken,checkCoordinatorBlockStatus,coordinatorController.todaysClasses);
coordinatorRouter.get('/upcomingClasses',authenticateToken,checkCoordinatorBlockStatus,coordinatorController.upcomingClasses);
coordinatorRouter.get('/blockStatus',coordinatorController.blockStatus);


coordinatorRouter.get('/getUsersList',authenticateToken,checkCoordinatorBlockStatus,coordinatorController.getUsersList)
coordinatorRouter.get('/fetchBucketCourses/:userId',authenticateToken,checkCoordinatorBlockStatus,coordinatorController.fetchBucketCourses);
coordinatorRouter.post('/addCourseToUserBucket/:studentId',authenticateToken,checkCoordinatorBlockStatus,coordinatorController.addCourseToUserBucket);
coordinatorRouter.post('/updateCourseToUserBucket/:studentId',authenticateToken,checkCoordinatorBlockStatus,coordinatorController.updateCourseToUserBucket);
coordinatorRouter.delete('/removeFromBucket/:studentId/:courseId',authenticateToken,checkCoordinatorBlockStatus,coordinatorController.removeFromBucket)
coordinatorRouter.get('/getBucketCourse/:studentId/:courseId',authenticateToken,checkCoordinatorBlockStatus,coordinatorController.getBucketCourse);
coordinatorRouter.post('/uploadCoordinatorProfilePhoto',authenticateToken,checkCoordinatorBlockStatus,upload.single('image'),coordinatorController.uploadCoordinatorProfilePhoto);
coordinatorRouter.get('/getCoordinatorData',authenticateToken,checkCoordinatorBlockStatus,coordinatorController.getCoordinatorData);
coordinatorRouter.post('/editCoordinatorProfileInfo',authenticateToken,checkCoordinatorBlockStatus,coordinatorController.editCoordinatorProfileInfo);
coordinatorRouter.get('/getAllCompletedClasses',authenticateToken,checkCoordinatorBlockStatus,coordinatorController.getAllCompletedClasses)
coordinatorRouter.get('/approveClass/:id',authenticateToken,checkCoordinatorBlockStatus,coordinatorController.approveClass);



export default coordinatorRouter;