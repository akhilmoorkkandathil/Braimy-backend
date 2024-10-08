import coordinatorModel from "../models/coordinatorModel.js";
import studentModel from "../models/userModel.js";
import { CreateSuccess } from "../utils/success.js";
import { CreateError } from "../utils/error.js";
import bcrypt from "bcrypt";
import moment from "moment";
import dotenv from "dotenv";
import commonMethods from "../utils/commonMethods.js";
import UserCourseBucket from "../models/userCourseBucketModel.js";
import cloudinary from "../utils/cloudinary.js";
import CompletedClassModel from "../models/atttendanceModel.js";

dotenv.config();

export const coordinatorController = {
  coordinatorRegister: async (req, res, next) => {
    try {
      const coordinator = await coordinatorModel.findOne({ email: req.body.email });
      if (coordinator) {
        return next(CreateError(400, "Coordinator already registered"));
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(req.body.password, salt);
      const newCoordinator = new coordinatorModel({
        username: req.body.fullName,
        email: req.body.email,
        phone: req.body.phone,
        password: hashedPassword,
      });
      await newCoordinator.save();

      return next(CreateSuccess(200, "Regsitration Successful."));
    } catch (error) {
      return next(CreateError(500, "Something went wrong!"));
    }
  },
  coordinatorLogin: async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const coordinator = await coordinatorModel.findOne({ email, isDeleted: false });
      req.session.coordinatorId = coordinator._id;
      if (!coordinator) {
        return next(CreateError(404, "coordinator not found"));
      }
      const isPasswordCorrect = await bcrypt.compare(password, coordinator.password);
      if (!isPasswordCorrect) {
        return next(CreateError(400, "Incorrect password"));
      }
      if (coordinator.isBlocked) {
        return next(CreateError(402, "coordinator is blocked"));
      }
      if (!coordinator.isVerified) {
        return next(CreateError(402, "coordinator is not verified"));
      }
      req.session.coordinatorId = coordinator._id;
      const token = commonMethods.createToken(coordinator._id, true);
      const coordinatorData = {
        coordinatorId: coordinator._id,
        username: coordinator.username,
        email: coordinator.email,
      };
      return next(CreateSuccess(200, "Login Success", coordinatorData, token));
    } catch (error) {
      console.error("Error during login:", error);
      return next(CreateError(500, "Something went wrong!"));
    }
  },
  getCoordinatorsList: async (req, res, next) => {
    try {
      const Coordinators = await coordinatorModel.find({ isDeleted: false });

      return next(CreateSuccess(200, "Fetched Coordinators successfully", Coordinators, null));
    } catch (error) {
      return next(CreateError(500, "Something went wrong while fetching users"));
    }
  },
  addCoordinator: async (req, res, next) => {
    try {
      const { coordinatorName, email, phone, description, password } = req.body;
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const newCoordinator = new coordinatorModel({
        username: coordinatorName,
        email,
        phone,
        description,
        password: hashedPassword,
        isVerified: true,
      });

      await newCoordinator.save();

      return next(CreateSuccess(200, "Coordinator added successfully", newCoordinator));
    } catch (error) {
      console.error("Error adding course:", error);
      return next(CreateError(500, "Something went wrong while adding the course"));
    }
  },
  blockCoordinator: async (req, res, next) => {
    const coordinatorId = req.params.id;

    try {
      const coordinator = await coordinatorModel.findById(coordinatorId);

      if (!coordinator) {
        return next(CreateError(404, "Coordinator not found"));
      }
      if (coordinator.isBlocked) {
        return next(CreateSuccess(200, "Coordinator already blocked"));
      }

      coordinator.isBlocked = true;
      await coordinator.save();
      return next(CreateSuccess(200, "Coordinator blocked successfully"));
    } catch (error) {
      return next(CreateError(500, "Error blocking coordinator"));
    }
  },

  verifyCoordinator: async (req, res, next) => {
    const coordinatorId = req.params.id;

    try {
      const coordinator = await coordinatorModel.findById(coordinatorId);

      if (!coordinator) {
        return next(CreateError(404, "Coordinator not found"));
      }
      if (coordinator.isVerified) {
        return next(CreateSuccess(200, "Coordinator already verified"));
      }

      coordinator.isVerified = true;
      await coordinator.save();
      return next(CreateSuccess(200, "Coordinator verified successfully"));
    } catch (error) {
      return next(CreateError(500, "Error verifying coordinator"));
    }
  },

  deleteCoordinator: async (req, res, next) => {
    const coordinatorId = req.params.id;

    try {
      const coordinator = await coordinatorModel.findById(coordinatorId);

      if (!coordinator) {
        return next(CreateError(404, "Coordinator not found"));
      }

      coordinator.isDeleted = true;
      await coordinator.save();
      return next(CreateSuccess(200, "Coordinator deleted successfully"));
    } catch (error) {
      return next(CreateError(500, "Error deleting coordinator"));
    }
  },

  getCoordinator: async (req, res, next) => {
    const coordinatorId = req.params.id;

    try {
      const coordinator = await coordinatorModel.findById(coordinatorId);

      if (!coordinator) {
        return next(CreateError(404, "Coordinator not found"));
      }
      return next(CreateSuccess(200, "Coordinator data fetched successfully", coordinator));
    } catch (error) {
      return next(CreateError(500, "Error fetching coordinator data"));
    }
  },

  unblockCoordinator: async (req, res, next) => {
    const coordinatorId = req.params.id;

    try {
      const coordinator = await coordinatorModel.findById(coordinatorId);

      if (!coordinator) {
        return next(CreateError(404, "Coordinator not found"));
      }
      if (!coordinator.isBlocked) {
        return next(CreateSuccess(200, "Coordinator already unblocked"));
      }

      coordinator.isBlocked = false;
      await coordinator.save();
      return next(CreateSuccess(200, "Coordinator unblocked successfully"));
    } catch (error) {
      return next(CreateError(500, "Error unblocking coordinator"));
    }
  },

  updateCoordinator: async (req, res, next) => {
    const coordinatorId = req.params.id;
    const { coordinatorName, phone, password, email } = req.body.coordinatorData;

    try {
      let coordinator = await coordinatorModel.findById(coordinatorId);

      if (!coordinator) {
        return next(CreateError(404, "Coordinator not found"));
      }

      coordinator.username = coordinatorName;
      coordinator.phone = phone;
      coordinator.email = email;

      if (password[0] !== "*") {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        coordinator.password = hashedPassword;
      }

      await coordinator.save();

      return next(CreateSuccess(200, "Coordinator updated successfully"));
    } catch (error) {
      return next(CreateError(500, "Error updating coordinator"));
    }
  },
  manageStudent: async (req, res, next) => {
    try {
      const { studentName, studentClass, phone, email, tutor, course, preferredTime, selectedDays, duration } = req.body;
      const updatedStudent = await studentModel.findOneAndUpdate(
        { email: email },
        {
          username: studentName,
          class: studentClass,
          phone: phone,
          tutor: tutor,
          course: course,
          preferredTime: preferredTime,
          selectedDays: selectedDays,
          classDuration: duration,
        }
      );

      if (!updatedStudent) {
        return next(CreateError(404, "Student not found"));
      }

      return next(CreateSuccess(200, "Student data updated successfully"));
    } catch (error) {
      return next(CreateError(500, "Error in adding student data"));
    }
  },
  todaysClasses: async (req, res, next) => {
    try {
      const today = moment().format("ddd");

      const students = await studentModel.find({ isAdmin: false }).populate("tutor", "username").populate("course", "courseName");

      const filteredStudents = students.filter((student) => student.selectedDays.includes(today));
      return next(CreateSuccess(200, "Fetched today's classes successfully", filteredStudents));
    } catch (error) {
      return next(CreateError(500, "Error fetching today's classes"));
    }
  },
  upcomingClasses: async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      const jwtPayload = commonMethods.parseJwt(token);
      const coordinatorId = jwtPayload.id;
      const userCourseBuckets = await UserCourseBucket.find({ coordinatorId: coordinatorId }).populate("userId courseId assignedTutor");

      const today = moment().format("ddd");

      const upcomingClasses = userCourseBuckets.filter((bucket) => bucket.selectedDays.includes(today));

      return next(CreateSuccess(200, "Fetched upcoming classes successfully", upcomingClasses));
    } catch (error) {
      console.error("Error fetching upcoming classes:", error);
      return next(CreateError(500, "Error fetching upcoming classes"));
    }
  },
  approveClass: async (req, res, next) => {
    try {
      const completedClassId = req.params.id;

      const completedClass = await CompletedClassModel.findById(completedClassId);

      if (!completedClass) {
        return next(CreateError(404, "Completed class not found"));
      }

      completedClass.status = "Approved";

      const classDurationInHours = parseInt(completedClass.duration.replace("hr", ""));

      await completedClass.save();
      await studentModel.findByIdAndUpdate(completedClass.studentId, { $inc: { rechargedHours: -classDurationInHours } }, { new: true });

      return next(CreateSuccess(200, "Class approved successfully"));
    } catch (error) {
      console.error("Error approving class:", error);
      return next(CreateError(500, "Error in approving class"));
    }
  },
  blockStatus: async (req, res, next) => {
    try {
      const token = req.headers.authorization.split(" ")[1];
      if (!token) {
        return next(CreateError(401, "Token not present"));
      }
      const jwtPayload = commonMethods.parseJwt(token);
      const coordinatorId = jwtPayload.id;

      const coordinator = await coordinatorModel.findById(coordinatorId).exec();

      if (!coordinator) {
        return res.status(404).json({ blocked: true });
      }

      res.status(200).json({ blocked: coordinator.isBlocked });
    } catch (error) {
      next(CreateError(500, "Error retrieving block status"));
    }
  },
  getUsersList: async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      const jwtPayload = commonMethods.parseJwt(token);
      const coordinatorId = jwtPayload.id;

      const users = await studentModel.find({
        coordinator: coordinatorId,
      });

      if (!users.length) {
        return next(CreateSuccess(200, "No users found assigned"));
      }

      return next(CreateSuccess(200, "Fetched users successfully", users));
    } catch (error) {
      console.error("Error fetching users:", error);
      return next(CreateError(500, "Error fetching users"));
    }
  },
  fetchBucketCourses: async (req, res, next) => {
    try {
      const studentId = req.params.userId;

      const bucketEntries = await UserCourseBucket.find({ userId: studentId }).populate("courseId").populate("assignedTutor").exec();

      if (!bucketEntries.length) {
        return next(CreateSuccess(200, "No courses found in the bucket"));
      }

      console.log(bucketEntries);

      return next(CreateSuccess(200, "Fetched bucket courses successfully", bucketEntries));
    } catch (error) {
      console.error("Error fetching bucket courses:", error);
      return next(CreateError(500, "Error fetching bucket courses"));
    }
  },
  addCourseToUserBucket: async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      const jwtPayload = commonMethods.parseJwt(token);
      const coordinatorId = jwtPayload.id;
      const studentId = req.params.studentId;
      const { tutor, course, selectedDays, preferredTime, duration } = req.body;

      const existingBucketEntry = await UserCourseBucket.findOne({
        userId: studentId,
        courseId: course,
      });

      if (existingBucketEntry) {
        return next(CreateError(403, "Course already added to the bucket"));
      }

      const bucketData = new UserCourseBucket({
        userId: studentId,
        courseId: course,
        assignedTutor: tutor,
        selectedDays: selectedDays,
        preferredTime: preferredTime,
        classDuration: duration,
        coordinatorId: coordinatorId,
      });

      await bucketData.save();

      return next(CreateSuccess(201, "Course added to user's bucket successfully", bucketData));
    } catch (error) {
      console.error("Error adding course to user bucket:", error);
      return next(CreateError(500, "Error adding course to user bucket"));
    }
  },
  updateCourseToUserBucket: async (req, res, next) => {
    try {
      const studentId = req.params.studentId;
      const { course, tutor, selectedDays, preferredTime, classDuration } = req.body;

      const bucketEntry = await UserCourseBucket.findOne({
        userId: studentId,
        courseId: course,
      });

      console.log(bucketEntry);

      if (!bucketEntry) {
        return next(CreateError(403, "Course not found in the bucket"));
      }

      bucketEntry.selectedDays = selectedDays || bucketEntry.selectedDays;
      bucketEntry.preferredTime = preferredTime || bucketEntry.preferredTime;
      bucketEntry.classDuration = classDuration || bucketEntry.classDuration;

      if (course) {
        bucketEntry.courseId = course;
      }
      if (tutor) {
        bucketEntry.assignedTutor = tutor;
      }

      await bucketEntry.save();

      return next(CreateSuccess(200, "Course updated in user's bucket successfully", bucketEntry));
    } catch (error) {
      console.error("Error updating course in bucket:", error);
      return next(CreateError(500, "Error updating course in user's bucket"));
    }
  },
  removeFromBucket: async (req, res, next) => {
    try {
      const { studentId, courseId } = req.params;

      const result = await UserCourseBucket.findOneAndDelete({
        userId: studentId,
        courseId: courseId,
      });

      if (!result) {
        return next(CreateError(403, "Course not found in the bucket"));
      }

      return next(CreateSuccess(200, "Course removed from user's bucket successfully"));
    } catch (error) {
      console.error("Error removing course from bucket:", error);
      return next(CreateError(500, "Error removing course from user's bucket"));
    }
  },
  getBucketCourse: async (req, res, next) => {
    try {
      const { studentId, courseId } = req.params;

      const bucketEntry = await UserCourseBucket.findOne({
        userId: studentId,
        courseId: courseId,
      });

      return next(CreateSuccess(200, "Fetched course from user's bucket successfully", bucketEntry));
    } catch (error) {
      console.error("Error fetching course from bucket:", error);
      return next(CreateError(500, "Error fetching course from user's bucket"));
    }
  },
  uploadCoordinatorProfilePhoto: async (req, res, next) => {
    try {
      console.log("=============");
      const token = req.headers.authorization;
      const jwtPayload = commonMethods.parseJwt(token);
      const coordinatorId = jwtPayload.id;

      let coordinator = await coordinatorModel.findById(coordinatorId);
      if (!coordinator) {
        return next(CreateError(404, "Coordinator not found"));
      }

      if (req.file) {
        const image = req.file.path;
        const result = await cloudinary.uploader.upload(image);
        coordinator.photoUrl = result.secure_url;
      } else {
        return next(CreateError(400, "No file uploaded"));
      }

      await coordinator.save();

      return next(CreateSuccess(200, "Profile photo updated successfully", coordinator));
    } catch (error) {
      console.error("Error updating profile photo:", error);
      return next(CreateError(500, "Error updating profile photo"));
    }
  },

  getCoordinatorData: async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      const jwtPayload = commonMethods.parseJwt(token);
      const coordinatorId = jwtPayload.id;
      const coordinator = await coordinatorModel.find({ _id: coordinatorId });
      return next(CreateSuccess(200, "User data fetched successfully", coordinator[0]));
    } catch (error) {
      return next(CreateError(500, "Error fetching user data"));
    }
  },
  editCoordinatorProfileInfo: async (req, res, next) => {
    try {
      const { username, email, phone, about } = req.body;

      const token = req.headers.authorization;
      const jwtPayload = commonMethods.parseJwt(token);
      const coordinatorId = jwtPayload.id;
      let coordinator = await coordinatorModel.findById(coordinatorId);
      if (!coordinator) {
        return next(CreateError(404, "Coordinator not found"));
      }

      coordinator.username = username || coordinator.username;
      coordinator.email = email || coordinator.email;
      coordinator.phone = phone || coordinator.phone;
      coordinator.about = about || coordinator.about;

      await coordinator.save();

      return next(CreateSuccess(200, "Coordinator profile updated successfully", coordinator));
    } catch (error) {
      console.error("Error updating coordinator profile:", error);
      return next(CreateError(500, "Error updating Coordinator profile"));
    }
  },
  getAllCompletedClasses: async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      const jwtPayload = commonMethods.parseJwt(token);
      const coordinatorId = jwtPayload.id;

      const completedClasses = await CompletedClassModel.find({
        coordinatorId: coordinatorId,
      })
        .populate("studentId")
        .populate("courseId");
      if (!completedClasses.length) {
        return next(CreateSuccess(200, "No completed classes found for this coordinator"));
      }

      return next(CreateSuccess(200, "Fetched completed classes successfully", completedClasses));
    } catch (error) {
      console.error("Error fetching completed classes:", error);
      return next(CreateError(500, "Error fetching completed classes"));
    }
  },
};
