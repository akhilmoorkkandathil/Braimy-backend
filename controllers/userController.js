/* eslint-disable no-unused-vars */
import userModel from "../models/userModel.js";
import userOtpModel from "../models/userOtpModel.js";
import { CreateSuccess } from "../utils/success.js";
import bcrypt from "bcrypt";
import { CreateError } from "../utils/error.js";
import sendVerifyMail from "../utils/sendVerifyMail.js";
import moment from "moment";
import studentModel from "../models/userModel.js";
import chatModel from "../models/chatModel.js";
import jwt from "jsonwebtoken";
import commonMethods from "../utils/commonMethods.js";
import courseModel from "../models/courseModel.js";
import cloudinary from "../utils/cloudinary.js";
import Razorpay from "razorpay";
import paymentModel from "../models/paymentModel.js";
import UserCourseBucket from "../models/userCourseBucketModel.js";

const razorpayInstance = new Razorpay({
  key_id: process.env.RZP_KEY_ID,

  key_secret: process.env.RZP_KEY_SECRET,
});

const userController = {
  userRegister: async (req, res, next) => {
    try {
      let OTP;
      const user = await userModel.findOne({ email: req.body.email });
      if (user) {
        return next(CreateError(302, "User already registered"));
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(req.body.password, salt);
      const newUser = new userModel({
        username: req.body.fullName,
        email: req.body.email,
        phone: req.body.phone,
        password: hashedPassword,
      });
      await newUser.save();
      OTP = await sendVerifyMail(req.body.fullName, req.body.email, newUser._id);
      const newUserOtp = new userOtpModel({
        userId: newUser._id,
        OTP: OTP,
      });
      await newUserOtp.save();

      const data = {
        id: newUser._id,
        OTP: OTP,
        userType: "user",
      };

      return next(CreateSuccess(200, "Regsitration Successful. Please verify your mail.", data));
    } catch (error) {
      return next(CreateError(500, "Registration failed"));
    }
  },
  saveUserData: async (req, res, next) => {
    try {
      console.log("===========");
      const { name, email, photoUrl } = req.body;

      let user = await userModel.findOne({ email: email });

      if (user && user.isVerified) {
        let token = jwt.sign({ id: user._id, isUser: true }, process.env.JWT_SECRET, { expiresIn: "24h" });
        console.log(token);

        return next(CreateSuccess(200, "User already verified!", user, token));
      }
      const userData = new userModel({
        username: name,
        email: email,
        isVerified: true,
        photoUrl: photoUrl,
      });

      console.log(userData);

      await userData.save();
      let uewUser = await userModel.findOne({ email: email });

      let token = jwt.sign({ id: uewUser._id, isUser: true }, process.env.JWT_SECRET, { expiresIn: "24h" });
      console.log(token);

      return CreateSuccess(200, "User data saved!", userData, token);
    } catch (error) {}
  },
  setOtp: async (req, res, next) => {
    try {
      const userId = req.params.userId;
      const user = await userModel.findById(userId);
      if (!user) return next(CreateError(404, "User not found"));

      const OTP = await sendVerifyMail(user.fullName, user.email);
      const otpExists = await userOtpModel.findOne({ userId: user._id });
      if (otpExists) {
        await userOtpModel.findOneAndDelete({ userId: user._id });
      }

      const newUserOtp = new userOtpModel({
        userId: user._id,
        OTP: OTP,
      });

      const newOTP = await newUserOtp.save();

      if (newOTP) {
        return next(CreateSuccess(200, "OTP has been send!"));
      }
      return next(CreateError(400, "Failed to sent OTP!"));
    } catch (error) {
      return next(CreateError(500, "Something went wrong while sending the OTP."));
    }
  },
  googleLogin: async (req, res, next) => {
    try {
      const { email, name, photoUrl } = req.body;
      console.log(req.body);
      let user = await userModel.findOne({ email, isVerified: true, isAdmin: false });
      if (!user) {
        user = new userModel({
          username: name,
          email,
          photoUrl,
          isVerified: true,
        });
        await user.save();
      }
      console.log(user._id);
      const token = commonMethods.createToken(user._id, true);
      return next(CreateSuccess(200, "Google Login successful!", token));
    } catch (error) {
      return next(CreateError(500, "Something went wrong while Google login"));
    }
  },
  verifyOtp: async (req, res, next) => {
    try {
      const user = await userModel.findById(req.query.userId);
      if (user.isVerified) {
        return next(CreateSuccess(200, "User has been already verified."));
      }

      const userOtp = await userOtpModel.findOne({ userId: user._id });

      if (!userOtp) {
        return next(CreateError(402, "OTP has been expired"));
      }

      const enteredOTP = req.body.otp;
      if (userOtp.OTP === enteredOTP) {
        await userModel.updateOne({ _id: req.query.userId }, { $set: { isVerified: true } });
        return next(CreateSuccess(200, "Your Email has been verified."));
      } else {
        return next(CreateError(403, "OTP doesn't match"));
      }
    } catch (e) {
      let errorMessage = "An error occurred while verifying the email.";
      return next(CreateError(406, errorMessage));
    }
  },
  resendOTP: async (req, res, next) => {
    try {
      const user = await userModel.findById(req.body.userId);
      if (!user) return next(CreateError(404, "User not found"));

      if (user.isVerified) {
        return next(CreateError(403, "User has been already verified"));
      }
      const OTP = await sendVerifyMail(user.fullName, user.email, user._id);
      await userOtpModel.findOneAndUpdate(
        { userId: user._id },
        {
          $set: {
            OTP: OTP,
            createdAt: Date.now(),
          },
        },
        { upsert: true, new: true }
      );
      return next(CreateSuccess(200, "OTP has been resent."));
    } catch (error) {
      return next(CreateError(402, "Failed to resed OTP."));
    }
  },
  userLogin: async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const user = await userModel.findOne({ email, isAdmin: false });
      if (!user) {
        return next(CreateError(404, "User not found"));
      }

      if (user.isDeleted) {
        return next(CreateError(406, "User is deleted"));
      }

      if (!user.password) {
        return next(CreateError(400, "Incorrect password"));
      }
      const isPasswordCorrect = await bcrypt.compare(password, user.password);
      if (!isPasswordCorrect) {
        return next(CreateError(400, "Incorrect password"));
      }
      if (user.isBlocked) {
        return next(CreateError(402, "User is blocked"));
      }
      if (!user.isVerified) {
        return next(CreateError(402, "User is not verified"));
      }
      const token = commonMethods.createToken(user._id, true);
      const userData = {
        userId: user._id,
        userName: user.username,
        email: user.email,
      };
      return next(CreateSuccess(200, "User Login Sucessfully", userData, token));
    } catch (error) {
      return next(CreateError(500, "Something went wrong!"));
    }
  },

  getUserList: async (req, res, next) => {
    try {
      const students = await userModel.find({ isAdmin: false });

      return next(CreateSuccess(200, "Fetched students successfully", students));
    } catch (error) {
      return next(CreateError(500, "Something went wrong while fetching users"));
    }
  },
  addStudent: async (req, res, next) => {
    try {
      const { studentName, studentClass, phone, password, email, coordinator } = req.body;
      const image = req.file ? req.file.path : null;
      let photoUrl = "";
      if (image) {
        const result = await cloudinary.uploader.upload(image);
        photoUrl = result.secure_url;
      }
      const salt = await bcrypt.genSalt(10); 
      const hashedPassword = await bcrypt.hash(password, salt); 
      const newStudent = new studentModel({
        username: studentName,
        class: studentClass,
        phone,
        password: hashedPassword,
        email,
        coordinator,
        photoUrl,
        isVerified: true,
      });
      await newStudent.save();
      return next(CreateSuccess(200, "Student added successfully", newStudent));
    } catch (error) {
      return next(CreateError(500, "Something went wrong while adding the student"));
    }
  },
  blockStudent: async (req, res, next) => {
    const studentId = req.params.id;
    try {
      const student = await userModel.findById(studentId);

      if (!student) {
        return next(CreateError(404, "Student not found"));
      }
      if (student.isBlocked) {
        return next(CreateSuccess(200, "Student already Blocked"));
      }

      student.isBlocked = true; 
      await student.save();
      return next(CreateSuccess(200, "Student blocked successfully"));
    } catch (error) {
      return next(CreateError(500, "Error blocking student"));
    }
  },
  unblockStudent: async (req, res, next) => {
    const studentId = req.params.id;

    try {
      const student = await userModel.findById(studentId);

      if (!student) {
        return next(CreateError(404, "Student not found"));
      }
      if (!student.isBlocked) {
        return next(CreateSuccess(200, "Student already Unblocked"));
      }

      student.isBlocked = false; 
      await student.save();
      return next(CreateSuccess(200, "Student unblocked successfully"));
    } catch (error) {
      return next(CreateError(500, "Error unblocking student"));
    }
  },
  getStudent: async (req, res, next) => {
    const studentId = req.params.id;

    try {
      const student = await userModel.findById(studentId);

      if (!student) {
        return next(CreateError(404, "Student not found"));
      }
      return next(CreateSuccess(200, "Student data fetched successfully", student));
    } catch (error) {
      return next(CreateError(500, "Error blocking student"));
    }
  },
  updateStudent: async (req, res, next) => {
    try {
      const { studentName, studentClass, phone, password, email, coordinator } = req.body;
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
      if (password[0] !== "*") {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        student.password = hashedPassword;
      }

      const updatedStudent = await studentModel.findOneAndUpdate(
        { _id: studentId }, 
        {
          username: studentName,
          class: studentClass,
          phone: phone,
          email: email,
          coordinator: coordinator,
          photoUrl: student.photoUrl,
        },
        { new: true } 
      );

      console.log(updatedStudent);
      return next(CreateSuccess(200, "Student updated successfully"));
    } catch (err) {
      console.error("Error updating student:", err);
      return next(CreateError(500, "Error updating student"));
    }
  },
  subscribe: async (req, res, next) => {
    try {
      const { subscription } = req.body;

      let jwtPayload = parseJwt();
      const studentId = jwtPayload.id;
      const addSubscription = await userModel.findOneAndUpdate(
        { _id: studentId },
        {
          $set: { subscription: subscription },
        }
      );
      return next(CreateSuccess(200, "Subscription saved successfully"));
    } catch (error) {
      return next(CreateError(500, "Subscription saving faied"));
    }
  },
  blockStatus: async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      const jwtPayload = commonMethods.parseJwt(token);
      const studentId = jwtPayload.id;
      const student = await userModel.findById(studentId).exec();
      if (!student) {
        return res.status(404).json({ blocked: true });
      }
      res.status(200).json({ blocked: student.isBlocked });
    } catch (error) {
      next(CreateError(500, "Error retrieving block status"));
    }
  },
  uploadProfilePhoto: async (req, res, next) => {
    try {
      console.log("=============");
      const token = req.headers.authorization;
      const jwtPayload = commonMethods.parseJwt(token);
      const studentId = jwtPayload.id;
      let student = await studentModel.findById(studentId);
      if (!student) {
        return next(CreateError(404, "Student not found"));
      }
      if (req.file) {
        const image = req.file.path;
        const result = await cloudinary.uploader.upload(image);
        student.photoUrl = result.secure_url; 
      } else {
        return next(CreateError(400, "No file uploaded"));
      }
      await student.save();

      return next(CreateSuccess(200, "Profile photo updated successfully", student));
    } catch (error) {
      console.error("Error updating profile photo:", error);
      return next(CreateError(500, "Error updating profile photo"));
    }
  },
  updateUserProfile: async (req, res, next) => {
    try {
      console.log("=====================in update profile");
      console.log(req.body);
      const { username, phone, about } = req.body;
      const userClass = req.body.class;
      console.log("userClass", userClass);

      const token = req.headers.authorization;
      const jwtPayload = commonMethods.parseJwt(token);
      const studentId = jwtPayload.id;
      let student = await studentModel.findById(studentId);
      if (!student) {
        return next(CreateError(404, "Student not found"));
      }
      console.log("Inside user POrile before change", student);
      student.username = username || student.username; 
      student.class = userClass || student.class; 
      student.phone = phone || student.phone; 
      student.about = about || student.about; 
      console.log("final after change the class", student);
      await student.save();

      return next(CreateSuccess(200, "User profile updated successfully", student));
    } catch (error) {
      console.error("Error updating user profile:", error);
      return next(CreateError(500, "Error updating user profile"));
    }
  },
  getStudentClasses: async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      const jwtPayload = commonMethods.parseJwt(token);
      const studentId = jwtPayload.id;
      const today = moment().format("ddd"); 
      const todayClasses = await UserCourseBucket.find({
        userId: studentId, 
        selectedDays: today, 
      })
        .populate("courseId") 
        .populate("assignedTutor"); 

      console.log(todayClasses);
      if (!todayClasses.length) {
        return next(CreateSuccess(200, "No classes found for today"));
      }

      return next(CreateSuccess(200, "Fetched classes successfully", todayClasses));
    } catch (error) {
      console.error("Error fetching upcoming classes:", error);
      return next(CreateError(500, "Error fetching upcoming classes"));
    }
  },
  getOldChats: async (req, res, next) => {
    try {
      const tutorId = req.params.tutorId;
      const token = req.headers.authorization;
      const jwtPayload = commonMethods.parseJwt(token);
      const studentId = jwtPayload.id;
      const user = await userModel.findById(studentId);
      if (!user || !user.isVerified || user.isBlocked || user.isDeleted) {
        return next(CreateError(401, "User is unavailable"));
      }
      const oldChats = await chatModel.find({ userId: user._id, tutorId: tutorId });

      return next(CreateSuccess(200, "Old chats fetched successfully", oldChats));
    } catch (error) {
      return next(CreateError(500, "Something went wrong while fetching old chats."));
    }
  },
  getCourseData: async (req, res, next) => {
    try {
      const course = await courseModel.find({ _id: req.params.id, isDeleted: false });

      return next(CreateSuccess(200, "Fetched courses successfully", course, null));
    } catch (error) {
      return next(CreateError(500, "Something went wrong while fetching courses"));
    }
  },
  getCoursesData: async (req, res, next) => {
    try {
      const { term } = req.query;
      const courses = await courseModel.find({
        isDeleted: false,
        courseName: { $regex: `^${term}`, $options: "i" }, 
      });
      return next(CreateSuccess(200, "Courses found", courses));
    } catch (error) {
      console.error("Error searching courses:", error);
      return next(CreateError(500, "Error searching courses"));
    }
  },
  getStudentData: async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      const jwtPayload = commonMethods.parseJwt(token);
      const studentId = jwtPayload.id;
      const student = await studentModel.find({ isAdmin: false, _id: studentId });
      return next(CreateSuccess(200, "User data fetched successfully", student));
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
      switch (amount) {
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
        amount: amount * 100, 
        currency: "INR",
        receipt: type,
        payment_capture: 1,
      };

      try {
        const order = await razorpayInstance.orders.create(options);
        console.log(order.id);
        const newPayment = new paymentModel({
          orderId: order.id,
          studentId: studentId,
          planSelected: type,
          amountPaid: amount,
          date: new Date(),
          isDeleted: false,
          timeRecharged: timeRecharged,
        });

        await newPayment.save();
        return next(CreateSuccess(200, "Created Razorpay Appointment Order Successfully", { orderId: order.id, amount: options.amount }));
      } catch (error) {
        return next(CreateError(500, "Something went wrong while creating Razorpay order."));
      }
    } catch (error) {
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
      paymentData.status = "completed";
      await paymentData.save();
      const userId = paymentData.studentId; 
      const user = await userModel.findById(userId);

      if (!user) {
        return next(CreateSuccess(200, "User not found"));
      }
      let timeRecharged = 0;
      switch (paymentData.amountPaid) {
        case 7200:
          timeRecharged = 48; 
          break;
        case 1400:
          timeRecharged = 96; 
          break;
        case 2100:
          timeRecharged = 184; 
          break;
        default:
          timeRecharged = 0; 
      }
      user.rechargedHours = (user.rechargedHours || 0) + timeRecharged; 
      await user.save(); 
      return next(CreateSuccess(200, "Payment successful", paymentData));
    } catch (error) {
      return next(CreateError(500, "Payment failed"));
    }
  },
  getOldeChats: async (req, res, next) => {
    try {
      const userId = req.query.id;
      const user = await userModel.findById(userId);
      if (!user || !user.isVerified || user.isBlocked || user.isDeleted) {
        return next(CreateError(401, "User is unavailable"));
      }
      const oldChats = await chatModel.find({ userId: user._id });
      return next(CreateSuccess(200, "Old chats fetched successfully", oldChats));
    } catch (error) {
      return next(CreateError(500, "Something went wrong while fetching old chats."));
    }
  },
  getStudentTutorsWithLastMessage: async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      const jwtPayload = commonMethods.parseJwt(token);
      const studentId = jwtPayload.id;
      console.log("============");
      let userCourseBuckets = await UserCourseBucket.find({ userId: studentId })
        .populate("assignedTutor") 
        .populate("courseId"); 

      const result = await Promise.all(
        userCourseBuckets.map(async (bucket) => {
          const tutor = bucket.assignedTutor;
          if (tutor) {
            const lastMessage = await chatModel.findOne({ tutorId: tutor._id, userId: studentId }).sort({ createdAt: -1 }); 

            return {
              tutorId: tutor._id,
              username: tutor.username,
              photoUrl: tutor.photoUrl, 
              lastMessage: lastMessage ? lastMessage.message : "No messages", 
              lastMessageTime: lastMessage ? lastMessage.createdAt : null, 
            };
          }
        })
      );
      const tutorWithLastMessage = result.filter((val) => {
        if (val) {
          return val;
        }
      });
      return next(CreateSuccess(200, "Student tutors fetched successfully", tutorWithLastMessage));
    } catch (error) {
      return next(CreateError(500, "Something went wrong while fetching student's tutors."));
    }
  },
  addToBucket: async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      const jwtPayload = commonMethods.parseJwt(token);
      const studentId = jwtPayload.id;
      const { courseId, selectedDays, preferredTime, classDuration, coordinatorId } = req.body;
      console.log(req.body);
      const existingBucketEntry = await UserCourseBucket.findOne({
        userId: studentId,
        courseId: courseId,
      });

      if (existingBucketEntry) {
        return next(CreateError(403, "Course already added to the bucket")); 
      }
      const bucketData = new UserCourseBucket({
        userId: studentId, 
        courseId: courseId, 
        selectedDays: selectedDays, 
        preferredTime: preferredTime, 
        classDuration: classDuration, 
        coordinatorId: coordinatorId,
      });
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
      const bucketEntries = await UserCourseBucket.find({ userId: studentId })
        .populate("courseId") 
        .populate("assignedTutor")
        .populate("userId")
        .exec();

      console.log(bucketEntries);
      if (!bucketEntries.length) {
        return next(CreateSuccess(200, "No courses found in the bucket"));
      }
      const courses = bucketEntries.map((entry) => entry.courseId);

      console.log(bucketEntries);
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
        .populate("courseId") 
        .populate("assignedTutor")
        .populate("userId")
        .exec();

      console.log(bucketEntries);
      if (!bucketEntries.length) {
        return next(CreateSuccess(200, "No courses found in the bucket"));
      }
      return next(CreateSuccess(200, "Fetched bucket courses successfully", bucketEntries));
    } catch (error) {
      console.error("Error fetching bucket courses:", error);
      return next(CreateError(500, "Error fetching bucket courses"));
    }
  },
  fetchPaymentHistory: async (req, res, next) => {
    try {
      const token = req.headers.authorization; 
      const jwtPayload = commonMethods.parseJwt(token); 
      const studentId = jwtPayload.id; 
      const paymentHistory = await paymentModel
        .find({
          studentId: studentId, 
        })
        .populate("studentId"); 

      if (!paymentHistory.length) {
        return next(CreateError(200, "No payment history found for this user"));
      }

      return next(CreateSuccess(200, "Fetched payment history successfully", paymentHistory));
    } catch (error) {
      console.error("Error fetching payment history:", error);
      return next(CreateError(500, "Error fetching payment history"));
    }
  },
};

export default userController;
