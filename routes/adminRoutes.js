const express = require('express');
const adminController = require('../controllers/adminController')
const adminRouter = express.Router();

const upload = require('../utils/multur');
const authenticateToken = require('../middlewares/authJWT');



adminRouter.post('/login',adminController.adminLogin );

adminRouter.post('/addCourse', authenticateToken,upload.single('image'),adminController.addCourse);

//The router used both in student fetch course and coordinator to fetch course
//This router is used in both landing page course fetch and userisde course fetch
adminRouter.get('/getCourses',adminController.getCourses);
adminRouter.post('/updateCourse/:id', authenticateToken,upload.single('image'),adminController.updateCourse);
adminRouter.get('/getCourse/:id',authenticateToken,adminController.getCourse);
adminRouter.delete('/deleteCourse/:id',authenticateToken,adminController.deleteCourse);

adminRouter.post('/addPayment',authenticateToken,adminController.addPayment);
adminRouter.get('/getPayments',authenticateToken,adminController.getPayments);
adminRouter.post('/updatePayment/:id',authenticateToken,adminController.updatePayment);
adminRouter.get('/getPayment/:id',authenticateToken,adminController.getPayment);
adminRouter.post('/deletePayment',authenticateToken,adminController.deletePayment);

adminRouter.put('/addExpense',authenticateToken,adminController.addExpense);
adminRouter.get('/getExpenses',authenticateToken,adminController.getExpenses);
adminRouter.put('/updateExpense/:id',authenticateToken,adminController.updateExpense);
adminRouter.get('/getExpense/:id',authenticateToken,adminController.getExpense);
adminRouter.post('/deleteExpense/:id',authenticateToken,adminController.deleteExpense);

adminRouter.get('/dashboardData',authenticateToken,adminController.dashboardData);

adminRouter.post('/addFaq',authenticateToken,adminController.addFaq);
adminRouter.get('/getFaqs',adminController.getFaqs);
adminRouter.get('/deleteFaq/:faqId',authenticateToken,adminController.deleteFaq);
adminRouter.post('/updateFaq/:faqId',authenticateToken,adminController.updateFaq)

//adminRouter.get('/get_chat_user_list',adminController.getChatUsers);
//adminRouter.get('/get_old_chats',adminController.getOldChats);

module.exports = adminRouter;


// {
//   publicKey: 'BD_qZ0tyVaPC6DVg2kKmWTqw9C4NOMyHiZYyLJIwDmoKvhdF0ieqIw9vaffOnfJCoI2fWAyBk1Pib8KWsp5Lsd8',
//   privateKey: '2nw58tdYMC-e4tTyiD13_7lJT_wYFofk8mz2n6fuT5Q'
// }