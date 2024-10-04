
 const tutorModel = require('../models/tutorModel');
const studentModel = require('../models/userModel')
const {CreateSuccess} = require("../utils/success");
const {CreateError} = require('../utils/error');
const bcrypt = require('bcrypt');
const attendanceModel = require('../models/atttendanceModel');
const moment = require('moment');
const commonMethods = require('../utils/commonMethods');
const cloudinary = require('../utils/cloudinary')
const chatModel = require('../models/chatModel');
const UserCourseBucket = require('../models/userCourseBucketModel');






module.exports = {
    // /tutor/register_tutor
     tutorRegister : async(req,res,next) => {
        try {
            const tutor = await tutorModel.findOne({email: req.body.email});
            if(tutor)
            {
                return next(CreateError(400, "Tutor already registered"));
            }
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(req.body.password, salt);
            //  //console.log("Tutor",req.body);
            const newTutor = new tutorModel({
                username:req.body.fullName,
                email: req.body.email,
                phone: req.body.phone,
                password: hashedPassword
            });
            await newTutor.save();
            
            return next(CreateSuccess(200, 'Regsitration Successful.'));
            
        } catch (error) {
             //console.log("Register error",  error);
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
            //  //console.log(req.session.tutorId);
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
             //console.log(token);
            
            return next(CreateSuccess(200,"Login Success",tutorData,token));
        } catch (error) {
            console.error('Error during login:', error);
            return next(CreateError(500, 'Something went wrong!'));
        }
    },
    getTutorsList:async(req,res,next)=>{
        try {
            const tutors = await tutorModel.find({isDeleted:false,isBlocked:false});
            return next(CreateSuccess(200, 'Fetched tutors successfully', tutors, null));
        } catch (error) {
             //console.log(error);
            return next(CreateError(500,"Something went wrong while fetching users"));
        }
    },
    addTutor:async(req,res,next)=>{
        try {
            //  //console.log(req.body);
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
            console.error('Error adding tutor:', error);
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
             //console.log(error);
            
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
             //console.log(error);
            
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
             //console.log(error);
            
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
             //console.log(error);
            
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
             //console.log(error);
            
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
            if (req.file) {
                const image = req.file.path;
                const result = await cloudinary.uploader.upload(image);
                tutor.photoUrl = result.secure_url;
              }
    
            tutor.username = tutorName;
            tutor.education = education;
            tutor.phone = phone;
            tutor.email = email;
            if (password[0] !== "*") {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);
                tutor.password = hashedPassword;
            }
    
            await tutor.save();
    
            return next(CreateSuccess(200, "Tutor updated successfully"));
        } catch (error) {
            console.error("Error updating tutor:", error);
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

            return next(CreateSuccess(200, "Fetched today's classes successfully",students));
            
        } catch (error) {
            console.error("Error fetching today's classes:", error);
            return next(CreateError(500, "Error fetching today's classes"));
        }
    },
    getTutorStudentWithLastMessage: async (req, res, next) => {
        try {
            const token = req.headers.authorization;
            const jwtPayload = commonMethods.parseJwt(token);
            const tutorId = jwtPayload.id;
    
            // Fetch all user course buckets for the tutor
            const userCourseBuckets = await UserCourseBucket.find({ assignedTutor: tutorId })
                .populate('userId courseId'); // Populate student and course details
    
            // Create a list of students with their last messages
            const tutorWithLastMessage = await Promise.all(userCourseBuckets.map(async (bucket) => {
                const student = bucket.userId; // Get the student from the populated field
    
                // Fetch the last message for the student
                const lastMessage = await chatModel.findOne({ tutorId: tutorId, userId: student._id })
                    .sort({ createdAt: -1 }); // Sort by date to get the last message
    
                return {
                    userId: student._id,
                    username: student.username,
                    photoUrl: student.photoUrl, // Assuming photoUrl is a field in the student model
                    lastMessage: lastMessage ? lastMessage.message : "No messages", // Assuming 'message' is the field for the message content
                    lastMessageTime: lastMessage ? lastMessage.createdAt : null, // Get the timestamp of the last message
                };
            }));
    
            // Return response with students and last messages
            return next(CreateSuccess(200, "Fetched today's classes successfully", tutorWithLastMessage));
        } catch (error) {
            console.error("Error fetching today's classes:", error);
            return next(CreateError(500, "Error fetching today's classes"));
        }
    },
    getTutorStudentWithMessage:async(req,res,next)=>{
        try {
             //console.log("==========");
            
            const token = req.headers.authorization;
            const jwtPayload = commonMethods.parseJwt(token);
            const tutorId = jwtPayload.id;
    
            // Fetch all students data from the database
            const students = await studentModel.find({ _id: { $in: tutorId } }).select('username photoUrl');
            const tutorWithLastMessage = await Promise.all(
                students.map(async (student) => {
                  const lastMessage = await chatModel
                    .findOne({ userId: student._id, tutorId: tutorId })
                    .sort({ createdAt: -1 })
                    .select('message senderType createdAt');
          
                  return {
                    tutorId: student._id,
                    username: student.username,
                    photoUrl: student.photoUrl,
                    lastMessage: lastMessage ? lastMessage.message : "No messages",
                    lastMessageTime: lastMessage ? lastMessage.createdAt : null,
                  };
                })
              );

               //console.log("tutorWithLastMessage",tutorWithLastMessage);
              
          
            return next(CreateSuccess(200, "Fetched today's classes successfully",tutorWithLastMessage));
            
        } catch (error) {
            console.error("Error fetching today's classes:", error);
            return next(CreateError(500, "Error fetching today's classes"));
        }
    },
    markCompleted: async (req, res, next) => {
        try {
            console.log(req.body);
            const {
                userId: { _id: studentId },
                assignedTutor: tutorId,
                courseId: { _id: courseId },
                classDuration: duration,
                coordinatorId,
                dateMarked // Extract the date marked from the request body
            } = req.body; // Extract data from request body
    
           
            const markedDate = new Date(dateMarked);

            // Check if the class has already been marked as completed for the given date
            const existingEntry = await attendanceModel.findOne({
                studentId: studentId,
                tutorId: tutorId,
                courseId: courseId,
                date: {
                    $gte: new Date(markedDate.setHours(0, 0, 0, 0)), // Start of the day
                    $lt: new Date(markedDate.setHours(23, 59, 59, 999)) // End of the day
                }
            });
    
            if (existingEntry) {
                return next(CreateSuccess(200, "Class already marked as completed for this date"));
            }
    
            // Create a new completed class entry
            const completedClass = new attendanceModel({
                studentId: studentId,
                tutorId: tutorId,
                courseId: courseId,
                duration: duration,
                coordinatorId: coordinatorId,
                date: markedDate, // Use the provided date
            });
    
            // Save the completed class entry to the database
            await completedClass.save();
    
            return next(CreateSuccess(200, "Marked as completed"));
        } catch (error) {
            console.error('Error in mark complete:', error);
            return next(CreateError(500, "Error in mark complete"));
        }
    },
    getTutorCompletedClasses: async (req, res, next) => {
        try {
            const token = req.headers.authorization;
            const jwtPayload = commonMethods.parseJwt(token);
            const tutorId = jwtPayload.id; // Assuming the tutor ID is in the token
    
            // Fetch completed classes for the tutor
            const completedClasses = await attendanceModel.find({
                tutorId: tutorId // Filter by tutor ID
            }).populate('studentId') // Optionally populate student details
              .populate('courseId'); // Optionally populate course details
    
            if (!completedClasses.length) {
                return next(CreateError(404, "No completed classes found for this tutor"));
            }

            console.log(completedClasses);
    
            return next(CreateSuccess(200, "Fetched completed classes successfully", completedClasses));
        } catch (error) {
            console.error('Error fetching completed classes:', error);
            return next(CreateError(500, "Error fetching completed classes"));
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
             //console.log(tutorId);
            // Fetch the tutor from the database
            const tutor = await tutorModel.findById(tutorId).exec();
            if (!tutor) {
                return res.status(404).json({ blocked: true }); 
            }
    
            // Send the block status in the response
            res.status(200).json({ blocked: tutor.isBlocked });
        } catch (error) {
            console.error('Block status error:', error);
            next(CreateError(500, 'Error retrieving block status'));
        }
    },
    getTutorUpcomingClasses:async(req,res,next)=>{
        try {

            const token = req.headers.authorization;
            const jwtPayload = commonMethods.parseJwt(token);
            const tutorId = jwtPayload.id;
            const today = moment().format('ddd');
    
            const todayClasses = await UserCourseBucket.find({
                assignedTutor: tutorId, // Filter by student ID
                selectedDays: today // Check if today is in the selectedDays array
            })
            .populate('courseId') // Populate course details if needed
            .populate('userId'); // Populate tutor details if needed

            // Sort the classes based on preferredTime
        todayClasses.sort((a, b) => {
            const timeA = a.preferredTime.split(' ')[0]; // Get the time part
            const periodA = a.preferredTime.split(' ')[1]; // Get AM/PM part
            const timeB = b.preferredTime.split(' ')[0]; // Get the time part
            const periodB = b.preferredTime.split(' ')[1]; // Get AM/PM part

            // Convert time to minutes for comparison
            const convertToMinutes = (time, period) => {
                const [hours, minutes] = time.split(':').map(Number);
                return (period === 'PM' ? hours + 12 : hours) * 60 + minutes; // Convert to 24-hour format
            };

            const totalMinutesA = convertToMinutes(timeA, periodA);
            const totalMinutesB = convertToMinutes(timeB, periodB);

            return totalMinutesA - totalMinutesB; // Sort in ascending order
        });
        return next(CreateSuccess(200, "Fetched upcoming classes successfully", todayClasses.slice(0,4)));
            
        } catch (error) {
            console.error('Error fetching today\'s upcoming classes:', error);
            return next(CreateError(500, "Error fetching today's upcoming classes"));
        }
    },
    getTutorClasses:async(req,res,next)=>{
        try {

            const token = req.headers.authorization;
            const jwtPayload = commonMethods.parseJwt(token);
            const tutorId = jwtPayload.id;
            const today = moment().format('ddd');
    
            const todayClasses = await UserCourseBucket.find({
                assignedTutor: tutorId, // Filter by student ID
                selectedDays: today // Check if today is in the selectedDays array
            })
            .populate('courseId') // Populate course details if needed
            .populate('userId'); // Populate tutor details if needed
            // Sort the classes based on preferredTime
        todayClasses.sort((a, b) => {
            const timeA = a.preferredTime.split(' ')[0]; // Get the time part
            const periodA = a.preferredTime.split(' ')[1]; // Get AM/PM part
            const timeB = b.preferredTime.split(' ')[0]; // Get the time part
            const periodB = b.preferredTime.split(' ')[1]; // Get AM/PM part

            // Convert time to minutes for comparison
            const convertToMinutes = (time, period) => {
                const [hours, minutes] = time.split(':').map(Number);
                return (period === 'PM' ? hours + 12 : hours) * 60 + minutes; // Convert to 24-hour format
            };

            const totalMinutesA = convertToMinutes(timeA, periodA);
            const totalMinutesB = convertToMinutes(timeB, periodB);

            return totalMinutesA - totalMinutesB; // Sort in ascending order
        });
        return next(CreateSuccess(200, "Fetched upcoming classes successfully", todayClasses.slice(0,4)));
            
        } catch (error) {
            console.error('Error fetching today\'s upcoming classes:', error);
            return next(CreateError(500, "Error fetching today's upcoming classes"));
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
             //console.log("Token for tutor",token);
            const jwtPayload = commonMethods.parseJwt(token);
            const tutorId = jwtPayload.id;            
            const tutor = await tutorModel.find({_id:tutorId });
            return next(CreateSuccess(200,"Tutor data fetched successfully",tutor[0]));
        } catch (error) {
             console.log(error);
            return next(CreateError(500, "Error fetching tutor data"));
        }
    },
    getOldChat:async(req,res,next)=>{
        try {
            const userId = req.params.id;
             //console.log("User Id: ",userId);
            
            const token = req.headers.authorization;
            const jwtPayload = commonMethods.parseJwt(token);
            const tutorId = jwtPayload.id;
             //console.log("Tutor Id: ",tutorId);
            
            const tutor = await tutorModel.findById(tutorId);
            if(!tutor || !tutor.isVerified || tutor.isBlocked || tutor.isDeleted){
                return next(CreateError(401, "tutor is unavailable"));
            }
            const oldChats = await chatModel.find({userId: userId,tutorId:tutorId});
             //console.log(oldChats);
            
            return next(CreateSuccess(200, "Old chats fetched successfully", oldChats));
        } catch (error) {
             //console.log(error.message);
            return next(CreateError(500, "Something went wrong while fetching old chats."));
        }
    },
    uploadTutorProfilePhoto:async(req,res,next)=>{
        try {
            const token = req.headers.authorization;
            const jwtPayload = commonMethods.parseJwt(token);
            const tutorId = jwtPayload.id;
    
            // Find the tutor by ID
            let tutor = await tutorModel.findById(tutorId);
            if (!tutor) {
                return next(CreateError(404, "Tutor not found"));
            }
    
            // Check if a file is uploaded
            if (req.file) {
                const image = req.file.path;
                const result = await cloudinary.uploader.upload(image);
                tutor.photoUrl = result.secure_url; // Update the photoUrl in the tutor object
            } else {
                return next(CreateError(400, "No file uploaded"));
            }
    
            // Save the updated tutor document
            await tutor.save();
    
            return next(CreateSuccess(200, "Profile photo updated successfully", tutor));
        } catch (error) {
            console.error("Error updating profile photo:", error);
            return next(CreateError(500, "Error updating profile photo"));
        }
    },
    editProfileInfo:async(req,res,next)=>{
        try {
            const { username, education, phone, about } = req.body;

            const token = req.headers.authorization;
            const jwtPayload = commonMethods.parseJwt(token);
            const tutorId = jwtPayload.id;
            let tutor = await tutorModel.findById(tutorId);
        if (!tutor) {
            return next(CreateError(404, "Tutor not found"));
        }

        // Update the tutor's profile data
        tutor.username = username || tutor.username; // Update username if provided
        tutor.education = education || tutor.education; // Update class if provided
        tutor.phone = phone || tutor.phone; // Update phone if provided
        tutor.about = about || tutor.about; // Update about if provided

        // Save the updated tutor document
        await tutor.save();

        return next(CreateSuccess(200, "User profile updated successfully", tutor));
        } catch (error) {
            console.error("Error updating user profile:", error);
        return next(CreateError(500, "Error updating user profile"));
        }
    }
   
    
}