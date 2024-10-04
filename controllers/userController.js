/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

const userModel = require('../models/userModel');
const userOtpModel = require('../models/userOtpModel');
const {CreateSuccess} = require("../utils/success");
const bcrypt = require('bcrypt');
const {CreateError} = require('../utils/error');
const {sendVerifyMail} = require('../utils/sendVerifyMail');
const moment = require('moment');
const studentModel = require('../models/userModel');
const model = require('../utils/gemini')
const chatModel = require('../models/chatModel');
const jwt = require('jsonwebtoken');


const commonMethods = require('../utils/commonMethods');
const courseModel = require('../models/courseModel')
const cloudinary = require('../utils/cloudinary');
const Razorpay = require('razorpay');
const paymentModel = require('../models/paymentModel');
const UserCourseBucket = require('../models/userCourseBucketModel');
const razorpayInstance = new Razorpay({ 

    // Replace with your key_id 
    key_id: process.env.RZP_KEY_ID, 
    
    // Replace with your key_secret 
    key_secret: process.env.RZP_KEY_SECRET 
    }); 




module.exports = {
     userRegister : async(req,res,next) => {
        try {
            let OTP;
            const user = await userModel.findOne({email: req.body.email});
            if(user)
            {
                return next(CreateError(302, "User already registered"));
            }
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(req.body.password, salt);
            // //console.log(req.body);
            const newUser = new userModel({
                username:req.body.fullName,
                email: req.body.email,
                phone: req.body.phone,
                password: hashedPassword
            });
            await newUser.save();
            OTP = await sendVerifyMail(req.body.fullName,req.body.email,newUser._id);
            // //console.log(`check otp inisde register fn =`, OTP);
            const newUserOtp = new userOtpModel({
                userId: newUser._id,
                OTP: OTP
            });
            await newUserOtp.save();
            
            const data = {
                id: newUser._id, 
                OTP: OTP,
                userType: "user"
            }
            
            return next(CreateSuccess(200, 'Regsitration Successful. Please verify your mail.', data));
               
            
        } catch (error) {
            // //console.log("Register Failes",  error);
            return next(CreateError(500,"Registration failed"))
        }
    },
    saveUserData:async(req,res,next)=>{
        try {

             console.log("===========");
             //console.log(req.body);
            const { name, email, photoUrl} = req.body;
        
            // Check if user already exists
            let user = await userModel.findOne({ email: email });
        
            if (user && user.isVerified) {
                let token = jwt.sign(
                    { id: user._id, isUser: true },
                    process.env.JWT_SECRET,
                    { expiresIn: '24h' }
                );
                console.log(token);
                
              return next(CreateSuccess(200, "User already verified!", user,token));
            }
        
            // Create a new user
            const userData = new userModel({
              username: name,
              email: email,
              isVerified: true,
              photoUrl:photoUrl 
            });

            console.log(userData);
            
        
            await userData.save();
            let uewUser = await userModel.findOne({ email: email });

            let token = jwt.sign(
                { id: uewUser._id, isUser: true },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );
            console.log(token);
            
        
            return CreateSuccess(200, "User data saved!", userData,token);
          } catch (error) {
             //console.log(error);
            return next(CreateError(500, "Error saving user data", error));
          }
        
    },
    setOtp : async (req,res,next)=>{
        try {
            const userId = req.params.userId;
            // //console.log(userId);
            const user = await userModel.findById(userId);
            if(!user)
                return next(CreateError(404, "User not found"));
    
            const OTP = await sendVerifyMail(user.fullName,user.email);
            // //console.log("OTP",OTP);
            const otpExists = await userOtpModel.findOne({userId:user._id});

            // //console.log("otpExists",otpExists);
            if(otpExists)
            {
                await userOtpModel.findOneAndDelete({userId:user._id}); 
            }
                
            const newUserOtp = new userOtpModel({
                userId: user._id,
                OTP: OTP
            });
    
            const newOTP = await newUserOtp.save();
    
            if(newOTP)
            {
                // //console.log(" new otp: ", newOTP);
                return next(CreateSuccess(200, "OTP has been send!"));
            }
            return next(CreateError(400, "Failed to sent OTP!"));
        } catch (error) {
            // //console.log(error.message);
            return next(CreateError(500, "Something went wrong while sending the OTP."))
        }
    },
    googleLogin: async (req, res, next) => {
        try {
          const { email, name, photoUrl } = req.body;
      console.log(req.body);
          // Check if user already exists and is verified
          let user = await userModel.findOne({ email, isVerified: true });
      
          // If user doesn't exist, create a new one
          if (!user) {
            user = new userModel({
              username: name,
              email,
              photoUrl,
              isVerified: true // Assuming new users are automatically verified via Google login
            });
      
            // Save the new user to the database
            await user.save();
          }
      console.log(user._id);
          // Generate token for the user
          const token = commonMethods.createToken(user._id, true);
          
          // Respond with success and token
          return next(CreateSuccess(200, "Google Login successful!", token));
      
        } catch (error) {
          // Handle any error during the process
          return next(CreateError(500, "Something went wrong while Google login"));
        }
      }
      ,

    verifyOtp : async (req,res,next)=>{
        try
        {
            
            const user = await userModel.findById(req.query.userId);
            if(user.isVerified)
                {
                    return next(CreateSuccess(200,'User has been already verified.'))
                }
            
    
            const userOtp = await userOtpModel.findOne({userId:user._id});
    
            if(!userOtp){
                return next(CreateError(402, "OTP has been expired"));
            } 
    
            const enteredOTP = req.body.otp;
            if (userOtp.OTP === enteredOTP) {
                await userModel.updateOne({_id:req.query.userId},{$set:{isVerified:true}});
                return next(CreateSuccess(200, 'Your Email has been verified.'));
            }
            else{
                return next(CreateError(403, "OTP doesn't match"))
            }
        }
        catch(e)
        {    
            // //console.log(e);
            let errorMessage = "An error occurred while verifying the email."
            return next(CreateError(406, errorMessage));
        }
    },
    resendOTP : async (req,res,next)=>{
        try {
            const user = await userModel.findById(req.body.userId);
            if(!user) return next(CreateError(404, "User not found"));
    
            if(user.isVerified)
                {
                    return next(CreateError(403, 'User has been already verified'))
                }
                const OTP = await sendVerifyMail(user.fullName,user.email,user._id);
                await userOtpModel.findOneAndUpdate(
                    { userId: user._id }, 
                    {
                        $set: {
                            OTP: OTP,
                            createdAt: Date.now() 
                        }
                    },
                    { upsert: true, new: true } 
                );
    
                //await newUserOtp.save();
                return next(CreateSuccess(200, 'OTP has been resent.'));
        } catch (error) {
            //  //console.log(error.message);
            return next(CreateError(402, 'Failed to resed OTP.'));
        }
    },
    userLogin : async (req,res,next)=>{
        try {
            const { email, password } = req.body;
            
            const user = await userModel.findOne({ email,isAdmin:false });
            if (!user) {
                return next(CreateError(404, 'User not found'));
            }
    
            if (user.isDeleted) {
                return next(CreateError(406, 'User is deleted'));
            }

            if(!user.password){
                return next(CreateError(400, 'Incorrect password'));
            }
            const isPasswordCorrect = await bcrypt.compare(password, user.password);
            if (!isPasswordCorrect) {
                return next(CreateError(400, 'Incorrect password'));
            }
            if (user.isBlocked) {
                return next(CreateError(402, 'User is blocked'));
            }
            if (!user.isVerified) {
                return next(CreateError(402, 'User is not verified'));
            }
            const token = commonMethods.createToken(user._id,true);
            const userData = {
                userId: user._id,
                userName: user.username,
                email: user.email
            };
            //  //console.log(userData);
            return next(CreateSuccess(200, 'User Login Sucessfully',userData,token));
    
        } catch (error) {
            // console.error('Error during login:', error); // Log the error for debugging
            return next(CreateError(500, 'Something went wrong!'));
        }
    },

    getUserList:async(req,res,next)=>{
        try {
            const students = await userModel.find({ isAdmin: false })

    
            return next(CreateSuccess(200, 'Fetched students successfully', students));
        } catch (error) {
            return next(CreateError(500,"Something went wrong while fetching users"));
        }
    },
    addStudent:async(req,res,next)=>{
        try {
            const { studentName, studentClass, phone, password, email, coordinator } = req.body;
            const image = req.file ? req.file.path : null;

            // Handle image upload to cloud storage if needed
            let photoUrl = '';
            if (image) {
            const result = await cloudinary.uploader.upload(image);
            photoUrl = result.secure_url;
            }
            const salt = await bcrypt.genSalt(10); // Generate a salt
        const hashedPassword = await bcrypt.hash(password, salt); // Hash the password
            const newStudent = new studentModel({
            username:studentName,
            class:studentClass,
            phone,
            password:hashedPassword,
            email,
            coordinator,
            photoUrl,
            isVerified:true
            });
            // Save the new student document
            await newStudent.save();
    
            // Send success response
            return next(CreateSuccess(200, "Student added successfully", newStudent));
        } catch (error) {
            // console.error('Error adding student:', error);
            return next(CreateError(500, "Something went wrong while adding the student"));
        }
    },
    blockStudent:async(req,res,next)=>{
        const studentId = req.params.id;
         //console.log("studentId INside the",studentId);
        try {
            const student = await userModel.findById(studentId);

            if (!student) {
                return next(CreateError(404, "Student not found"));
            }
            if (student.isBlocked) {
                return next(CreateSuccess(200, "Student already Blocked"));
            }

            student.isBlocked = true; // Assuming you have a 'blocked' field in your user schema
            await student.save();
            return next(CreateSuccess(200, "Student blocked successfully"));
        } catch (error) {
            return next(CreateError(500,  'Error blocking student'));
        }
    },
    unblockStudent:async(req,res,next)=>{
        const studentId = req.params.id;

        try {
            const student = await userModel.findById(studentId);

            if (!student) {
                return next(CreateError(404, "Student not found"));
            }
            if (!student.isBlocked) {
                return next(CreateSuccess(200, "Student already Unblocked"));
            }

            student.isBlocked = false; // Assuming you have a 'blocked' field in your user schema
            await student.save();
            return next(CreateSuccess(200, "Student unblocked successfully"));
        } catch (error) {
            return next(CreateError(500,  'Error unblocking student'));
        }
    },
    getStudent:async(req,res,next)=>{
        const studentId = req.params.id;

        try {
            const student = await userModel.findById(studentId);

            if (!student) {
                return next(CreateError(404, "Student not found"));
            }
            return next(CreateSuccess(200, "Student data fetched successfully",student));
        } catch (error) {
            return next(CreateError(500,  'Error blocking student'));
        }
    },
    updateStudent:async(req,res,next)=>{
        // //console.log(req);
        try {
            const { studentName, studentClass, phone, password, email, coordinator } = req.body;
             //console.log(studentName);
            const studentId = req.params.id;
            let student = await studentModel.findById(studentId);
        
            if (!student) {
              return next(CreateError(404, "Student not found"));
            }
        console.log(req.file);
            if (req.file) {
              const image = req.file.path;
              const result = await cloudinary.uploader.upload(image);
              console.log(result);
              student.photoUrl = result.secure_url;
            }
            if (password[0]!=="*") {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);
                student.password = hashedPassword;
            }
        
            const updatedStudent = await studentModel.findOneAndUpdate(
                { _id: studentId }, // The condition to find the student by ID
                {
                  username: studentName,
                  class: studentClass,
                  phone: phone,
                  email: email,
                  coordinator: coordinator,
                  photoUrl: student.photoUrl,
                },
                { new: true } // Option to return the updated document
              );
              
               console.log(updatedStudent);
        return next(CreateSuccess(200, "Student updated successfully"));
    } catch (err) {
         console.error("Error updating student:", err);
        return next(CreateError(500, "Error updating student"));
    }
    },
    subscribe:async(req,res,next)=>{
        try {
            const { subscription } = req.body;

            let jwtPayload = parseJwt();
            const studentId = jwtPayload.id;
            const addSubscription = await userModel.findOneAndUpdate({_id:studentId}, {
                $set: { subscription:subscription }
            });
            return next(CreateSuccess(200, "Subscription saved successfully"));


        } catch (error) {
            return next(CreateError(500, "Subscription saving faied"));
        }
    },
    blockStatus:async(req,res,next)=>{
        try {
            const token = req.headers.authorization;
            const jwtPayload = commonMethods.parseJwt(token);
            const studentId = jwtPayload.id;
              //console.log(studentId);
            // Fetch the student from the database
            const student = await userModel.findById(studentId).exec();
            // //console.log(student);
            if (!student) {
                // next(CreateError(404, "User blocked",{ blocked: true }));
                return res.status(404).json({ blocked: true }); 
            }
    
            // Send the block status in the response
           // return next(CreateError(200, "User not blocked",{ blocked: student.isBlocked }));
            res.status(200).json({ blocked: student.isBlocked });
        } catch (error) {
            // console.error('Block status error:', error);
            next(CreateError(500, 'Error retrieving block status'));
        }
    },
    uploadProfilePhoto:async(req,res,next)=>{
        try {

            console.log("=============");
            const token = req.headers.authorization;
            const jwtPayload = commonMethods.parseJwt(token);
            const studentId = jwtPayload.id;
    
            // Find the student by ID
            let student = await studentModel.findById(studentId);
            if (!student) {
                return next(CreateError(404, "Student not found"));
            }
    
            // Check if a file is uploaded
            if (req.file) {
                const image = req.file.path;
                const result = await cloudinary.uploader.upload(image);
                student.photoUrl = result.secure_url; // Update the photoUrl in the student object
            } else {
                return next(CreateError(400, "No file uploaded"));
            }
    
            // Save the updated student document
            await student.save();
    
            return next(CreateSuccess(200, "Profile photo updated successfully", student));
        } catch (error) {
            console.error("Error updating profile photo:", error);
            return next(CreateError(500, "Error updating profile photo"));
        }
    },
    updateUserProfile:async(req,res,next)=>{
        try {
            console.log("=====================in update profile");
            console.log(req.body);
            const { username, phone, about } = req.body;
            const userClass = req.body.class;
            console.log("userClass",userClass);

            const token = req.headers.authorization;
            const jwtPayload = commonMethods.parseJwt(token);
            const studentId = jwtPayload.id;
            let student = await studentModel.findById(studentId);
        if (!student) {
            return next(CreateError(404, "Student not found"));
        }
        console.log("Inside user POrile before change",student);

        // Update the student's profile data
        student.username = username || student.username; // Update username if provided
        student.class = userClass  || student.class; // Update class if provided
        student.phone = phone || student.phone; // Update phone if provided
        student.about = about || student.about; // Update about if provided
        console.log("final after change the class",student);
        // Save the updated student document
        await student.save();

        return next(CreateSuccess(200, "User profile updated successfully", student));
        } catch (error) {
            console.error("Error updating user profile:", error);
        return next(CreateError(500, "Error updating user profile"));
        }
    },
    getStudentClasses: async(req, res, next) => {
        try {
            const token = req.headers.authorization;
            const jwtPayload = commonMethods.parseJwt(token);
            const studentId = jwtPayload.id;
            const today = moment().format('ddd'); // Get today's day (e.g., 'Mon', 'Tue', etc.)
    
            // Fetch classes for the student that are scheduled for today
            const todayClasses = await UserCourseBucket.find({
                userId: studentId, // Filter by student ID
                selectedDays: today // Check if today is in the selectedDays array
            })
            .populate('courseId') // Populate course details if needed
            .populate('assignedTutor'); // Populate tutor details if needed
    
            if (!todayClasses.length) {
                return next(CreateSuccess(200, "No classes found for today"));
            }
    
            return next(CreateSuccess(200, "Fetched classes successfully", todayClasses));
        } catch (error) {
            console.error('Error fetching upcoming classes:', error);
            return next(CreateError(500, "Error fetching upcoming classes"));
        }
    },
    // geminiResult:async(req,res,next)=>{
    //     let prompt = req.body.prompt;
    //     const result = await model.generateContent(prompt);
    //     const response = await result.response;
    //     //  //console.log(response.text());
    //     return next(CreateSuccess(200, "data created"));
    // },
    getOldChats : async (req,res,next)=>{
        try {
            const tutorId = req.params.tutorId;
            const token = req.headers.authorization;
            const jwtPayload = commonMethods.parseJwt(token);
            const studentId = jwtPayload.id;
            const user = await userModel.findById(studentId);
            if(!user || !user.isVerified || user.isBlocked || user.isDeleted){
                return next(CreateError(401, "User is unavailable"));
            }
            const oldChats = await chatModel.find({userId: user._id,tutorId:tutorId});
             //console.log(oldChats);
            
            return next(CreateSuccess(200, "Old chats fetched successfully", oldChats));
        } catch (error) {
             //console.log(error.message);
            return next(CreateError(500, "Something went wrong while fetching old chats."));
        }
    },
    getCourseData:async(req,res,next)=>{
        try {
            // Fetch all courses data from the database
            const course = await courseModel.find({_id:req.params.id,isDeleted:false});
            
            return next(CreateSuccess(200, 'Fetched courses successfully', course, null));
        } catch (error) {
            return next(CreateError(500,"Something went wrong while fetching courses"));
        }
    },
    getCoursesData:async(req,res,next)=>{
        try {
            const { term } = req.query;
            // Perform a case-insensitive search for course names starting with the term
            const courses = await courseModel.find({isDeleted:false,
              courseName: { $regex: `^${term}`, $options: 'i' } // Regex for case-insensitive match
            });
            return next(CreateSuccess(200, "Courses found", courses));
        } catch (error) {
            console.error('Error searching courses:', error);
            return next(CreateError(500, "Error searching courses"));
          }
    },
    getStudentData:async(req,res,next)=>{
        try {
            const token = req.headers.authorization;
            const jwtPayload = commonMethods.parseJwt(token);
            const studentId = jwtPayload.id;
            const student = await studentModel.find({ isAdmin: false,_id:studentId });
            //console.log("student in getStudentData",student);
            return next(CreateSuccess(200,"User data fetched successfully",student));
        } catch (error) {
            return next(CreateError(500, "Error fetching user data"));
        }
    },
    payment: async (req, res, next) => {
        try {
            const { type, amount } = req.body;
            const token = req.headers.authorization;
            const jwtPayload = commonMethods.parseJwt(token);
            const studentId = jwtPayload.id;
            let timeRecharged = 0;
            switch(amount){
                case 7200:
                    timeRecharged = 48;
                    break;
                case 14400:
                    timeRecharged = 96;
                    break;
                case 21600:
                    timeRecharged = 184;
                    break;
                default:
                    timeRecharged = 0;
            }
        
            const options = {
                amount: amount * 100, // amount in paise
                currency: 'INR',
                receipt: type,
                payment_capture: 1,
            };
    
            try {
                const order = await razorpayInstance.orders.create(options);  
                console.log(order.id);
                const newPayment = new paymentModel({
                    orderId:order.id,
                    studentId: studentId,
                    planSelected: type,
                    amountPaid: amount,
                    date: new Date(),
                    isDeleted: false,
                    timeRecharged:timeRecharged
                });
    
                await newPayment.save();  
                return next(CreateSuccess(200, "Created Razorpay Appointment Order Successfully", { orderId: order.id, amount: options.amount }));
            } catch (error) {
                return next(CreateError(500, "Something went wrong while creating Razorpay order."));
            }
        } catch (error) {
             //console.log("Error in payment processing:", error.message);
            return next(CreateError(500, "An error occurred"));
        }
    },
    updatePaymentStatus: async (req, res, next) => {
        try {
            const orderId = req.params.orderId;
            const paymentData = await paymentModel.findOne({ orderId: orderId });
            if (!paymentData) {
                return next(CreateError(404, "Payment not found"));
            }
            paymentData.status = 'completed';
            await paymentData.save();
            const userId = paymentData.studentId; // Assuming studentId is stored in paymentData
            const user = await userModel.findById(userId);
    
            if (!user) {
                return next(CreateSuccess(200, "User not found"));
            }
    
            // Update the recharged hours based on the amount paid
            let timeRecharged = 0;
            switch (paymentData.amountPaid) {
                case 7200:
                    timeRecharged = 48; // Example: 48 hours for 7200
                    break;
                case 1400:
                    timeRecharged = 96; // Example: 96 hours for 1400
                    break;
                case 2100:
                    timeRecharged = 184; // Example: 184 hours for 2100
                    break;
                default:
                    timeRecharged = 0; // No recharge for other amounts
            }
    
            // Update the user's recharge hours
            user.rechargedHours = (user.rechargedHours || 0) + timeRecharged; // Increment the recharged hours
            await user.save(); // Save the updated user document
            return next(CreateSuccess(200, "Payment successful", paymentData));
        } catch (error) {
            return next(CreateError(500, "Payment failed"));
        }
    },
    getOldeChats:async(req,res,next)=>{
        try {
            const userId = req.query.id;
            const user = await userModel.findById(userId);
            if(!user || !user.isVerified || user.isBlocked || user.isDeleted){
                return next(CreateError(401, "User is unavailable"));
            }
            const oldChats = await chatModel.find({userId: user._id});
            return next(CreateSuccess(200, "Old chats fetched successfully", oldChats));
        } catch (error) {
             //console.log(error.message);
            return next(CreateError(500, "Something went wrong while fetching old chats."));
        }
    },
    getStudentTutorsWithLastMessage: async (req, res, next) => {
        try {
            const token = req.headers.authorization;
            const jwtPayload = commonMethods.parseJwt(token);
            const studentId = jwtPayload.id;
    console.log("============");
            // Fetch the user course buckets for the student
            let userCourseBuckets = await UserCourseBucket.find({ userId: studentId })
            .populate('assignedTutor') // Populate tutor details
            .populate('courseId'); // Optionally populate course details
    
                const result = await Promise.all(userCourseBuckets.map(async (bucket) => {
                    const tutor = bucket.assignedTutor;
                    if(tutor){
                        const lastMessage = await chatModel.findOne({ tutorId: tutor._id, userId: studentId })
                        .sort({ createdAt: -1 }); // Sort by date to get the last message
        
                    return {
                        tutorId: tutor._id,
                        username: tutor.username,
                        photoUrl: tutor.photoUrl, // Assuming photoUrl is a field in the tutor model
                        lastMessage: lastMessage ? lastMessage.message : "No messages", // Assuming 'message' is the field for the message content
                        lastMessageTime: lastMessage ? lastMessage.createdAt : null, // Get the timestamp of the last message
                    };
                    }
                    // Fetch the last message for the tutor
                    
                }));
                const tutorWithLastMessage = result.filter((val)=>{
                    if(val){
                        return val
                    }
                })
        
                // Return response with tutors and last messages
                return next(CreateSuccess(200, "Student tutors fetched successfully", tutorWithLastMessage));
        } catch (error) {
           //console.log(error.message);
          return next(CreateError(500, "Something went wrong while fetching student's tutors."));
        }
      },
      addToBucket: async (req, res, next) => {
        try {
            const token = req.headers.authorization;
            const jwtPayload = commonMethods.parseJwt(token);
            const studentId = jwtPayload.id;
    
            // Get bucket data from the request body
            const { courseId, selectedDays, preferredTime, classDuration,coordinatorId } = req.body;
            console.log(req.body);

            // Check if the course is already added to the user's bucket
            const existingBucketEntry = await UserCourseBucket.findOne({
                userId: studentId,
                courseId: courseId
            });

            if (existingBucketEntry) {
                return next(CreateError(403, "Course already added to the bucket")); // Conflict status
            }
    
            // Create a new bucket entry
            const bucketData = new UserCourseBucket({
                userId: studentId, // Set the userId to the student's ID
                courseId: courseId, // Include courseId
                selectedDays: selectedDays, // Include selectedDays
                preferredTime: preferredTime, // Include preferredTime
                classDuration: classDuration, // Include classDuration
                coordinatorId:coordinatorId,
            });
    
            // Save the new bucket entry to the database
            await bucketData.save();
    
            return next(CreateSuccess(201, "Added to course bucket successfully", bucketData));
        } catch (error) {
            console.error("Error adding to bucket:", error);
            return next(CreateError(500, "Error adding to course bucket"));
        }
      },
      fetchBucketCourses: async (req, res, next) => {
        try {
            const token = req.headers.authorization;
            const jwtPayload = commonMethods.parseJwt(token);
            const studentId = jwtPayload.id;
    
            // Fetch the user's bucket entries
            const bucketEntries = await UserCourseBucket.find({ userId: studentId })
                .populate('courseId') // Populate the course details
                .populate('assignedTutor')
                .populate('userId')
                .exec();

                console.log(bucketEntries);
            // Check if there are any bucket entries
            if (!bucketEntries.length) {
                return next(CreateSuccess(200, "No courses found in the bucket"));
            }
            const courses = bucketEntries.map(entry => entry.courseId);

            console.log(bucketEntries);
    
            // Send the bucket entries (with populated course data) to the frontend
            return next(CreateSuccess(200, "Fetched bucket courses successfully", bucketEntries));
        } catch (error) {
            console.error("Error fetching bucket courses:", error);
            return next(CreateError(500, "Error fetching bucket courses"));
        }
    },
    fetchAllBucketCourses: async (req, res, next) => {
        try {
           console.log("=====");
            const bucketEntries = await UserCourseBucket.find()
                .populate('courseId') // Populate the course details
                .populate('assignedTutor')
                .populate('userId')
                .exec();

                console.log(bucketEntries);
            // Check if there are any bucket entries
            if (!bucketEntries.length) {
                return next(CreateSuccess(200, "No courses found in the bucket"));
            }
    
            // Send the bucket entries (with populated course data) to the frontend
            return next(CreateSuccess(200, "Fetched bucket courses successfully", bucketEntries));
        } catch (error) {
            console.error("Error fetching bucket courses:", error);
            return next(CreateError(500, "Error fetching bucket courses"));
        }
    },
    fetchPaymentHistory: async (req, res, next) => {
        try {
            const token = req.headers.authorization; // Get the token from the request headers
            const jwtPayload = commonMethods.parseJwt(token); // Assuming you have a method to parse the JWT
            const studentId = jwtPayload.id; // Extract the student ID from the token payload
    
            // Fetch all payment records for the student
            const paymentHistory = await paymentModel.find({
                studentId: studentId // Filter by student ID
            }).populate('studentId'); // Optionally populate student details if needed
    
            if (!paymentHistory.length) {
                return next(CreateError(200, "No payment history found for this user"));
            }
    
            return next(CreateSuccess(200, "Fetched payment history successfully", paymentHistory));
        } catch (error) {
            console.error('Error fetching payment history:', error);
            return next(CreateError(500, "Error fetching payment history"));
        }
    },
    

}