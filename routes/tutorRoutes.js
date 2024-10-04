const express = require('express');
const tutorController = require('../controllers/tutorController');
const upload = require('../utils/multur');
const authenticateToken = require('../middlewares/authJWT');
const checkTutorStatus = require('../middlewares/tutorStatus');
const tutorRoute = express.Router();



tutorRoute.post('/register_tutor', tutorController.tutorRegister);
tutorRoute.post('/login',tutorController.tutorLogin);
tutorRoute.get('/getTutors',tutorController.getTutorsList);
tutorRoute.get('/searchTutor',tutorController.searchTutor);
tutorRoute.post('/addTutor',tutorController.addTutor);
tutorRoute.patch('/blockTutor/:id',tutorController.blockTutor);
tutorRoute.patch('/unblockTutor/:id',tutorController.unblockTutor);
tutorRoute.put('/updateTutor/:id', upload.single('image'),tutorController.updateTutor);;
tutorRoute.patch('/verifyTutor/:id',tutorController.verifyTutor);
tutorRoute.get('/getTutor/:id',tutorController.getTutor);
tutorRoute.delete('/deleteTutor/:id',tutorController.deleteTutor);
tutorRoute.get('/getTutorStudent',tutorController.getTutorStudent);
tutorRoute.get('/blockStatus',tutorController.blockStatus);

tutorRoute.get('/getTutorStudentWithLastMessage',authenticateToken ,checkTutorStatus,tutorController.getTutorStudentWithLastMessage);
tutorRoute.get('/getTutorUpcomingClasses',authenticateToken ,checkTutorStatus,tutorController.getTutorUpcomingClasses);
tutorRoute.get('/getTutorClasses',authenticateToken,checkTutorStatus,tutorController.getTutorClasses);
tutorRoute.post('/markCompleted',authenticateToken,checkTutorStatus,tutorController.markCompleted);
tutorRoute.get('/getTutorCompletedClasses',authenticateToken,checkTutorStatus,tutorController.getTutorCompletedClasses)

tutorRoute.get('/getTutuorData',authenticateToken,checkTutorStatus,tutorController.getTutuorData);
tutorRoute.get('/getOldChat/:id',authenticateToken,checkTutorStatus,tutorController.getOldChat);
tutorRoute.post('/uploadTutorProfilePhoto',authenticateToken,checkTutorStatus,upload.single('image'),tutorController.uploadTutorProfilePhoto);
tutorRoute.post('/editProfileInfo',authenticateToken,checkTutorStatus,tutorController.editProfileInfo)



module.exports = tutorRoute;