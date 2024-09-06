
 const tutorModel = require('../models/tutorModel');
const studentModel = require('../models/userModel')
const {CreateSuccess} = require("../utils/success");
const {CreateError} = require('../utils/error');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const tutorRoute = require('../routes/tutorRoutes');
const CompletedClass = require('../models/completedClassModel');
const moment = require('moment');
const commonMethods = require('../utils/commonMethods');
const cloudinary = require('../utils/cloudinary')
const chatModel = require('../models/chatModel')






module.exports = {
    // /tutor/register_tutor
     tutorRegister : async(req,res,next) => {
        try {
            const tutor = await tutorModel.findOne({email: req.body.email});
            if(tutor)
            {
                return next(CreateError(400, "User already registered"));
            }
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(req.body.password, salt);
            // console.log("Tutor",req.body);
            const newTutor = new tutorModel({
                username:req.body.fullName,
                email: req.body.email,
                phone: req.body.phone,
                password: hashedPassword
            });
            await newTutor.save();
            
            return next(CreateSuccess(200, 'Regsitration Successful.'));
            
        } catch (error) {
            // console.log("Register error",  error);
        }
    },
    tutorLogin: async(req,res,next)=>{
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return next(CreateError(400, 'Email and password are required'));
            }
    
            const tutor = await tutorModel.findOne({ email });
            req.session.tutorId = tutor._id;
            // console.log(req.session.tutorId);
            if (!tutor) {
                return next(CreateError(404, 'tutor not found'));
            }
    
            if (tutor.isDeleted) {
                return next(CreateError(406, 'tutor is deleted'));
            }

            if(!tutor.password){
                return next(CreateError(400, 'Incorrect password'));
            }
            const isPasswordCorrect = await bcrypt.compare(password, tutor.password);
            if (!isPasswordCorrect) {
                return next(CreateError(400, 'Incorrect password'));
            }
            if (tutor.isBlocked) {
                return next(CreateError(402, 'tutor is blocked'));
            }
            if (!tutor.isVerified) {
                return next(CreateError(402, 'tutor is not verified'));
            }
            const token = commonMethods.createToken(tutor._id,true)
            const tutorData = {
                tutorId: tutor._id,
                userName: tutor.username,
                email: tutor.email
            };

            return next(CreateSuccess(200,"Login Success",tutorData,token));
        } catch (error) {
            // console.error('Error during login:', error);
            return next(CreateError(500, 'Something went wrong!'));
        }
    },
    getTutorsList:async(req,res,next)=>{
        try {
            const tutors = await tutorModel.find({isDeleted:false,isBlocked:false});
            return next(CreateSuccess(200, 'Fetched tutors successfully', tutors, null));
        } catch (error) {
            return next(CreateError(500,"Something went wrong while fetching users"));
        }
    },
    addTutor:async(req,res,next)=>{
        try {
            // console.log(req.body);
            const { tutorName,email, phone, password, education } = req.body;
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            const newTutor = new tutorModel({
                username:tutorName,
                email,
                phone,
                password:hashedPassword,
                education,
                isVerified:true
            });
    
            await newTutor.save();
    
            return next(CreateSuccess(200, "Tutor added successfully", newTutor));
        } catch (error) {
            // console.error('Error adding tutor:', error);
            return next(CreateError(500, "Something went wrong while adding the tutor"));
        }
    },
    blockTutor:async (req, res, next) => {
        const tutorId = req.params.id;
    
        try {
            const tutor = await tutorModel.findById(tutorId);
    
            if (!tutor) {
                return next(CreateError(404, "Tutor not found"));
            }
            if (tutor.isBlocked) {
                return next(CreateSuccess(200, "Tutor already blocked"));
            }
    
            tutor.isBlocked = true;
            await tutor.save();
            return next(CreateSuccess(200, "Tutor blocked successfully"));
        } catch (error) {
            return next(CreateError(500, 'Error blocking tutor'));
        }
    },
    verifyTutor:async (req, res, next) => {
        const tutorId = req.params.id;
    
        try {
            const tutor = await tutorModel.findById(tutorId);
    
            if (!tutor) {
                return next(CreateError(404, "Tutor not found"));
            }
            if (tutor.isVerified) {
                return next(CreateSuccess(200, "Tutor already verified"));
            }
    
            tutor.isVerified = true;
            await tutor.save();
            return next(CreateSuccess(200, "Tutor verified successfully"));
        } catch (error) {
            return next(CreateError(500, 'Error verifying tutor'));
        }
    },
    deleteTutor:async (req, res, next) => {
        const tutorId = req.params.id;
    
        try {
            const tutor = await tutorModel.findById(tutorId);
    
            if (!tutor) {
                return next(CreateError(404, "Tutor not found"));
            }
    
            tutor.isDeleted = true;
            await tutor.save();
            return next(CreateSuccess(200, "Tutor deleted successfully"));
        } catch (error) {
            return next(CreateError(500, 'Error deleting tutor'));
        }
    },
    getTutor:async (req, res, next) => {
        const tutorId = req.params.id;
    
        try {
            const tutor = await tutorModel.findById(tutorId);
    
            if (!tutor) {
                return next(CreateError(404, "Tutor not found"));
            }
            return next(CreateSuccess(200, "Tutor data fetched successfully", tutor));
        } catch (error) {
            return next(CreateError(500, 'Error fetching tutor data'));
        }
    
    },
    unblockTutor:async (req, res, next) => {
        const tutorId = req.params.id;
    
        try {
            const tutor = await tutorModel.findById(tutorId);
    
            if (!tutor) {
                return next(CreateError(404, "Tutor not found"));
            }
            if (!tutor.isBlocked) {
                return next(CreateSuccess(200, "Tutor already unblocked"));
            }
    
            tutor.isBlocked = false;
            await tutor.save();
            return next(CreateSuccess(200, "Tutor unblocked successfully"));
        } catch (error) {
            return next(CreateError(500, 'Error unblocking tutor'));
        }
    },
    updateTutor:async (req, res, next) => {
        const tutorId = req.params.id;
        const { tutorName, education, phone, password, email } = req.body;
    
         try {
            let tutor = await tutorModel.findById(tutorId);
    
            if (!tutor) {
                return next(CreateError(404, "Tutor not found"));
            }
            console.log("========ssd=");
            if (req.file) {
                const image = req.file.path;
                const result = await cloudinary.uploader.upload(image);
                tutor.photoUrl = result.secure_url;
              }
              console.log("=====dsds====");
    
            tutor.username = tutorName;
            tutor.education = education;
            tutor.phone = phone;
            tutor.email = email;
            console.log("=====dsds[[[]]]====");
            if (password[0] !== "*") {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);
                tutor.password = hashedPassword;
            }
            console.log("=====dsds[[]]====");
    
            await tutor.save();
    
            return next(CreateSuccess(200, "Tutor updated successfully"));
        } catch (error) {
            // console.error("Error updating tutor:", error);
            return next(CreateError(500, "Error updating tutor"));
        }
    },
    getTutorStudent:async(req,res,next)=>{
        try {
            const token = req.headers.authorization;
            const jwtPayload = commonMethods.parseJwt(token);
            const tutorId = jwtPayload.id;
    
            // Fetch all students data from the database
            const students = await studentModel.find({ tutor: tutorId })
                .populate('tutor', 'username')  // Populate tutor details
                .populate('course', 'courseName');  // Populate course details

            return next(CreateSuccess(200, "Fetched today\'s classes successfully",students));
            
        } catch (error) {
            // console.error('Error fetching today\'s classes:', error);
            return next(CreateError(500, "Error fetching today\'s classes"));
        }
    },
    markCompleted:async(req,res,next)=>{
        try {
            const userId = req.params.id;
            let student = await studentModel.findById({_id: userId});
    
            if (!student) {
                return next(CreateError(404, "Student not found"));
            }
            student.classStatus = 'Completed';

            student.save();
            const newCompletedClass = new CompletedClass({
                studentId: student._id,
                tutorId: student.tutor,
                coordinatorId: student.coordinator,
                courseId: student.course,
                duration: student.classDuration,
                classStatus: 'Completed',
                approvalStatus: 'Pending'
            });
    
            await newCompletedClass.save();
    
            return next(CreateSuccess(200, "Marked as completed", newCompletedClass));
    
        } catch (error) {
            // console.error('Error in mark complete:', error);
            return next(CreateError(500, "Error in mark complete"));
        }
    },
    blockStatus:async(req,res,next)=>{
        try {
            const token = req.headers.authorization;
            if (!token) {
                return res.status(401).json({ blocked: true }); 
            }
            // Parse the JWT token
            const jwtPayload = commonMethods.parseJwt(token);
            const tutorId = jwtPayload.id;
            console.log(tutorId);
            // Fetch the tutor from the database
            const tutor = await tutorModel.findById(tutorId).exec();
            if (!tutor) {
                return res.status(404).json({ blocked: true }); 
            }
    
            // Send the block status in the response
            res.status(200).json({ blocked: tutor.isBlocked });
        } catch (error) {
            // console.error('Block status error:', error);
            next(CreateError(500, 'Error retrieving block status'));
        }
    },
    getTutorUpcomingClasses:async(req,res,next)=>{
        try {

            const token = req.headers.authorization;
            const jwtPayload = commonMethods.parseJwt(token);
            const tutorId = jwtPayload.id;
            const today = moment().format('ddd');
        const students = await studentModel.find({ isAdmin: false,tutor:tutorId })
            .populate('tutor', 'username') 
            .populate('course', 'courseName');
        const todayClasses = students.filter(student => student.selectedDays.includes(today)).slice(0,4);
        // console.log("jhkhkjhk");
        // // console.log(todayClasses);
        return next(CreateSuccess(200, "Fetched upcoming classes successfully", todayClasses));
            
        } catch (error) {
            // console.error('Error fetching today\'s upcoming classes:', error);
            return next(CreateError(500, "Error fetching today\'s upcoming classes"));
        }
    },
    searchTutor:async(req,res,next)=>{
        try {
            const { term } = req.query;
            // Perform a case-insensitive search for course names starting with the term
            const tutors = await tutorModel.find({isDeleted:false, isBlocked:false,
              username: { $regex: `^${term}`, $options: 'i' } // Regex for case-insensitive match
            });
            return next(CreateSuccess(200, "Tutor found", tutors));
        } catch (error) {
            console.error('Error searching tutor:', error);
            return next(CreateError(500, "Error searching tutor"));
          }
    },
    getTutuorData:async(req,res,next)=>{
        try {
            const token = req.headers.authorization;
            const jwtPayload = commonMethods.parseJwt(token);
            const tutorId = jwtPayload.id;            
            const tutor = await tutorModel.find({_id:tutorId });
            return next(CreateSuccess(200,"Tutor data fetched successfully",tutor));
        } catch (error) {
            return next(CreateError(500, "Error fetching tutor data"));
        }
    },
    getOldChat:async(req,res,next)=>{
        try {
            const userId = req.params.id;
            console.log("User Id: ",userId);
            
            const token = req.headers.authorization;
            const jwtPayload = commonMethods.parseJwt(token);
            const tutorId = jwtPayload.id;
            console.log("Tutor Id: ",tutorId);
            
            const tutor = await tutorModel.findById(tutorId);
            if(!tutor || !tutor.isVerified || tutor.isBlocked || tutor.isDeleted){
                return next(CreateError(401, "tutor is unavailable"));
            }
            const oldChats = await chatModel.find({userId: userId,tutorId:tutorId});
            console.log(oldChats);
            
            return next(CreateSuccess(200, "Old chats fetched successfully", oldChats));
        } catch (error) {
            console.log(error.message);
            return next(CreateError(500, "Something went wrong while fetching old chats."));
        }
    }
}