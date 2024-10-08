import express from 'express';
import {adminController} from '../controllers/adminController.js';
import upload from '../utils/multur.js';
import authenticateToken from '../middlewares/authJWT.js';

const adminRouter = express.Router();


adminRouter.post('/login',adminController.adminLogin );

adminRouter.post('/addCourse', authenticateToken,upload.single('image'),adminController.addCourse);
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
  export default adminRouter;
 