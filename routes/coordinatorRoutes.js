const express = require('express');
const coordintorController = require('../controllers/coordinatorController');
const coordinatorController = require('../controllers/coordinatorController');
const checkCoordinatorBlockStatus = require('../middlewares/coordinatorStatus');
const authenticateToken = require('../middlewares/authJWT');
const upload = require('../utils/multur');
const coordinatorRouter = express.Router();


coordinatorRouter.post('/register_coordinator',coordintorController.coordinatorRegister );
coordinatorRouter.post('/login',coordintorController.coordinatorLogin);
coordinatorRouter.get('/getCoordinators',coordintorController.getCoordinatorsList);
coordinatorRouter.post('/addCoordinator',authenticateToken,coordintorController.addCoordinator);
coordinatorRouter.patch('/blockCoordinator/:id',authenticateToken, coordintorController.blockCoordinator);
coordinatorRouter.patch('/verifyCoordinator/:id',authenticateToken, coordintorController.verifyCoordinator);
coordinatorRouter.patch('/unblockCoordinator/:id',authenticateToken, coordintorController.unblockCoordinator);
coordinatorRouter.delete('/deleteCoordinator/:id',authenticateToken, coordintorController.deleteCoordinator);
coordinatorRouter.get('/getCoordinator/:id',authenticateToken, coordintorController.getCoordinator);
coordinatorRouter.put('/updateCoordinator/:id',authenticateToken, coordintorController.updateCoordinator);
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
coordinatorRouter.post('/uploadCoordinatorProfilePhoto',authenticateToken,checkCoordinatorBlockStatus,upload.single('image'),coordintorController.uploadCoordinatorProfilePhoto);
coordinatorRouter.get('/getCoordinatorData',authenticateToken,checkCoordinatorBlockStatus,coordinatorController.getCoordinatorData);
coordinatorRouter.post('/editCoordinatorProfileInfo',authenticateToken,checkCoordinatorBlockStatus,coordintorController.editCoordinatorProfileInfo);
coordinatorRouter.get('/getAllCompletedClasses',authenticateToken,checkCoordinatorBlockStatus,coordintorController.getAllCompletedClasses)
coordinatorRouter.get('/approveClass/:id',authenticateToken,checkCoordinatorBlockStatus,coordinatorController.approveClass);

module.exports = coordinatorRouter;