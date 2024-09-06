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
const tutorModel = require('../models/tutorModel')

const commonMethode = require('../utils/commonMethods');
const commonMethods = require('../utils/commonMethods');
const courseModel = require('../models/courseModel')
const cloudinary = require('../utils/cloudinary');
const Razorpay = require('razorpay');
const paymentModel = require('../models/paymentModel')
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
                return next(CreateError(400, "User already registered"));
            }
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(req.body.password, salt);
            //console.log(req.body);
            const newUser = new userModel({
                username:req.body.fullName,
                email: req.body.email,
                phone: req.body.phone,
                password: hashedPassword
            });
            await newUser.save();
            OTP = await sendVerifyMail(req.body.fullName,req.body.email,newUser._id);
            //console.log(`check otp inisde register fn =`, OTP);
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
            //console.log("Register Failes",  error);
            return next(CreateError(500,"Registration failed"))
        }
    },
    saveUserData:async(req,res,next)=>{
        try {
            const { name, email, photoUrl} = req.body;
        
            // Check if user already exists
            let user = await userModel.findOne({ email: email });
        
            if (user) {
              return next(CreateSuccess(200, "User already exists!", user));
            }
        
            // Create a new user
            const userData = new userModel({
              username: name,
              email: email,
              isVerified: true,
              photoUrl:photoUrl 
            });
        
            await userData.save();
        
            return next(CreateSuccess(200, "User data saved!", user));
          } catch (error) {
            return next(CreateError(500, "Error saving user data", error));
          }
        
    },
    setOtp : async (req,res,next)=>{
        try {
            const userId = req.params.userId;
            //console.log(userId);
            const user = await userModel.findById(userId);
            if(!user)
                return next(CreateError(404, "User not found"));
    
            const OTP = await sendVerifyMail(user.fullName,user.email);
            //console.log("OTP",OTP);
            const otpExists = await userOtpModel.findOne({userId:user._id});

            //console.log("otpExists",otpExists);
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
                //console.log(" new otp: ", newOTP);
                return next(CreateSuccess(200, "OTP has been send!"));
            }
            return next(CreateError(400, "Failed to sent OTP!"));
        } catch (error) {
            //console.log(error.message);
            return next(CreateError(500, "Something went wrong while sending the OTP."))
        }
    },

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
            //console.log(e);
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
            // console.log(error.message);
            return next(CreateError(402, 'Failed to resed OTP.'));
        }
    },
    userLogin : async (req,res,next)=>{
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return next(CreateError(400, 'Email and password are required'));
            }
    
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
            const token = commonMethode.createToken(user._id,true);
            const userData = {
                userId: user._id,
                userName: user.username,
                email: user.email
            };
            // console.log(userData);
            return next(CreateSuccess(200, 'User Login Sucessfully',userData,token));
    
        } catch (error) {
            // console.error('Error during login:', error); // Log the error for debugging
            return next(CreateError(500, 'Something went wrong!'));
        }
    },

    getUserList:async(req,res,next)=>{
        try {
            const students = await userModel.find({ isAdmin: false })
            .populate('tutor', 'username')
            .populate('course', 'courseName');

    
            return next(CreateSuccess(200, 'Fetched students successfully', students));
        } catch (error) {
            return next(CreateError(500,"Something went wrong while fetching users"));
        }
    },
    // getTutorUser:async(req,res,next)=>{
    //     try {
    //         // Fetch all students data from the database
    //         const students = await userModel.find({tutor:req.session.tutorId});
    //         return next(CreateSuccess(200, 'Fetched students successfully', students, null));
    //     } catch (e) {
    //         return next(CreateError(500,"Something went wrong while fetching users"));
    //     }
    // },
    addStudent:async(req,res,next)=>{
        try {
            const { studentName, studentClass, phone, password, email, tutor, coordinator, course } = req.body;
            const image = req.file ? req.file.path : null;

            // Handle image upload to cloud storage if needed
            let imageUrl = '';
            if (image) {
            const result = await cloudinary.uploader.upload(image);
            imageUrl = result.secure_url;
            }

            const newStudent = new studentModel({
            studentName,
            studentClass,
            phone,
            password,
            email,
            tutor,
            coordinator,
            course,
            imageUrl
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
        //console.log(req);
        try {
            const { studentName, studentClass, phone, password, email, tutor, coordinator, course } = req.body;
            console.log(studentName);
            const studentId = req.params.id;
            let student = await studentModel.findById(studentId);
        
            if (!student) {
              return next(CreateError(404, "Student not found"));
            }
        
            if (req.file) {
              const image = req.file.path;
              const result = await cloudinary.uploader.upload(image);
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
                  tutor: tutor,
                  coordinator: coordinator,
                  course: course,
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
             console.log(studentId);
            // Fetch the student from the database
            const student = await userModel.findById(studentId).exec();
            //console.log(student);
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
    getStudentClasses:async(req,res,next)=>{
        try {
            const token = req.headers.authorization;
            const jwtPayload = commonMethods.parseJwt(token);
            const studentId = jwtPayload.id;
            const today = moment().format('ddd');
        const students = await studentModel.find({ isAdmin: false,_id:studentId })
            .populate('tutor', 'username')
            .populate('course', 'courseName');
            // console.log(students);
        const todayClasses = students.filter(student => student.selectedDays.includes(today)).slice(0,4);
        
        return next(CreateSuccess(200, "Fetched classes successfully", todayClasses));
            
        } catch (error) {
            // console.error('Error fetching upcoming classes:', error);
            return next(CreateError(500, "Error fetching upcoming classes"));
        }
    },
    // geminiResult:async(req,res,next)=>{
    //     let prompt = req.body.prompt;
    //     const result = await model.generateContent(prompt);
    //     const response = await result.response;
    //     // console.log(response.text());
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
            console.log(oldChats);
            
            return next(CreateSuccess(200, "Old chats fetched successfully", oldChats));
        } catch (error) {
            console.log(error.message);
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
    
            const newPayment = new paymentModel({
                studentId: studentId,
                planSelected: type,
                amountPaid: amount,
                date: new Date().toISOString().split("T")[0],
                status: 'cancelled',
                isDeleted: false,
            });

            await newPayment.save();
        
            const options = {
                amount: amount * 100, // amount in paise
                currency: 'INR',
                receipt: type,
                payment_capture: 1,
            };
    
            try {
                const order = await razorpayInstance.orders.create(options);    
                return next(CreateSuccess(200, "Created Razorpay Appointment Order Successfully", { orderId: order.id, amount: options.amount }));
            } catch (error) {
                return next(CreateError(500, "Something went wrong while creating Razorpay order."));
            }
        } catch (error) {
            console.log("Error in payment processing:", error.message);
            return next(CreateError(500, "An error occurred"));
        }
    },
    paymentSucess:async(req,res,next)=>{
        try {
            const token = req.headers.authorization;
            const jwtPayload = commonMethods.parseJwt(token);
            const studentId = jwtPayload.id;
            const paymentData = await paymentModel.findOne({ studentId: studentId });
                if (!paymentData) {
                    return next(CreateError(404, "Payment data not found"));
                }
    
                paymentData.status = 'completed';
                await paymentData.save();
    
                const user = await userModel.findById(studentId);
                if (!user) {
                    return next(CreateError(404, "User not found"));
                }
    
                switch (paymentData.planSelected) {
                    case 'Basic':
                        user.rechrgedHourse += 48;
                        break;
                    case 'Academic':
                        user.rechrgedHourse += 96;
                        break;
                    case 'Academic-Pro':
                        user.rechrgedHourse += 144;
                        break;
                }
                await user.save();
            return next(CreateSuccess(200, "Payment Successfull"));
        } catch (error) {
            return next(CreateError(404,"Payment Failed"));
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
            console.log(error.message);
            return next(CreateError(500, "Something went wrong while fetching old chats."));
        }
    },
    getStudentTutor:async(req,res,next)=>{
        try {
            const token = req.headers.authorization;
            const jwtPayload = commonMethods.parseJwt(token);
            const studentId = jwtPayload.id;
            const student = await studentModel.find({ isAdmin: false,_id:studentId });
            console.log(student);
            
            const tutorId = student[0].tutor;
            console.log(tutorId);
            
            const tutor = await tutorModel.find({_id:tutorId});
            console.log(tutor);
            
            return next(CreateSuccess(200, "Student tutors fetched successfully", tutor));

        } catch (error) {
            console.log(error.message);
            return next(CreateError(500, "Something went wrong while fetching students tutors."));
        }
    }
    

}