
const coordinatorModel = require('../models/coordinatorModel');
const studentModel = require('../models/userModel')
const {CreateSuccess} = require("../utils/success");
const {CreateError} = require('../utils/error');
const bcrypt = require('bcrypt');
const moment = require('moment');
const dotenv = require('dotenv');
const webpush = require('web-push');
const commonMethods = require('../utils/commonMethods');
const UserCourseBucket = require('../models/userCourseBucketModel');
const cloudinary = require('../utils/cloudinary');
const CompletedClassModel = require('../models/atttendanceModel');


dotenv.config();





module.exports = {
    //  /user/
     coordinatorRegister : async(req,res,next) => {
        try {
            const coordinator = await coordinatorModel.findOne({email: req.body.email});
            if(coordinator)
            {
                return next(CreateError(400, "Coordinator already registered"));
            }
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(req.body.password, salt);
            //  //console.log(req.body);
            const newCoordinator = new coordinatorModel({
                username:req.body.fullName,
                email: req.body.email,
                phone: req.body.phone,
                password: hashedPassword
            });
            await newCoordinator.save();
            
            return next(CreateSuccess(200, 'Regsitration Successful.'));
            
        } catch (error) {
             //console.log("Register error",  error);
            return next(CreateError(500, "Something went wrong!"));
        }
    },
    coordinatorLogin: async(req,res,next)=>{
        console.log("==========");
        try {
            const { email, password } = req.body;
    
            const coordinator = await coordinatorModel.findOne({ email,isDeleted:false });
            req.session.coordinatorId = coordinator._id;
            if (!coordinator) {
                return next(CreateError(404, 'coordinator not found'));
            }
            const isPasswordCorrect = await bcrypt.compare(password, coordinator.password);
            if (!isPasswordCorrect) {
                return next(CreateError(400, 'Incorrect password'));
            }
            if (coordinator.isBlocked) {
                return next(CreateError(402, 'coordinator is blocked'));
            }
            if (!coordinator.isVerified) {
                return next(CreateError(402, 'coordinator is not verified'));
            }
            req.session.coordinatorId = coordinator._id;
            const token = commonMethods.createToken(coordinator._id,true)
            const coordinatorData = {
                coordinatorId: coordinator._id,
                username: coordinator.username,
                email: coordinator.email
            };
            return next(CreateSuccess(200,"Login Success",coordinatorData,token));
    
        } catch (error) {
            console.error('Error during login:', error); // Log the error for debugging
            return next(CreateError(500, 'Something went wrong!'));
        }
    },
    getCoordinatorsList:async(req,res,next)=>{
        try {
            // Fetch all students data from the database
            const Coordinators = await coordinatorModel.find({isDeleted:false});
            
            return next(CreateSuccess(200, 'Fetched Coordinators successfully', Coordinators, null));
        } catch (error) {
            return next(CreateError(500,"Something went wrong while fetching users"));
        }
    },
    addCoordinator:async(req,res,next)=>{
        try {
            //  //console.log(req.body);
            const { coordinatorName, email, phone, description, password } = req.body;
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            const newCoordinator = new coordinatorModel({
                username:coordinatorName,
                email,
                phone,
                description,
                password:hashedPassword,
                isVerified:true
            });
    
            await newCoordinator.save();
    
            return next(CreateSuccess(200, "Coordinator added successfully", newCoordinator));
        } catch (error) {
             console.error('Error adding course:', error);
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
            return next(CreateError(500, 'Error blocking coordinator'));
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
            return next(CreateError(500, 'Error verifying coordinator'));
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
            return next(CreateError(500, 'Error deleting coordinator'));
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
            return next(CreateError(500, 'Error fetching coordinator data'));
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
            return next(CreateError(500, 'Error unblocking coordinator'));
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
            // console.error("Error updating coordinator:", error);
            return next(CreateError(500, "Error updating coordinator"));
        }
    },
    manageStudent:async(req,res,next)=>{
        //  //console.log("hello",req.body);
        try {
            const {
                studentName,
                studentClass,
                phone,
                email,
                tutor,
                course,
                preferredTime,
                selectedDays,
                duration
            } = req.body;
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
                    classDuration:duration
                }
            );
    
            if (!updatedStudent) {
                return next(CreateError(404, "Student not found"));
            }
    
            return next(CreateSuccess(200, "Student data updated successfully"));
        } catch (error) {
            // console.error('Error adding student:', error);
            return next(CreateError(500, "Error in adding student data"));
        }        
    },
    todaysClasses:async(req,res,next)=>{
        try {
             //console.log("==========");
            // Get the current day of the week (e.g., 'Mon', 'Tue', 'Wed', etc.)
            const today = moment().format('ddd');  // Formats as 'Mon', 'Tue', etc.
    
            // Fetch all students data from the database
            const students = await studentModel.find({ isAdmin: false })
                .populate('tutor', 'username')  // Populate tutor details
                .populate('course', 'courseName');  // Populate course details
    
            // Filter students to include only those whose `selectedDays` include today's day
            const filteredStudents = students.filter(student => student.selectedDays.includes(today));
 //console.log("=======ewrwer");
            return next(CreateSuccess(200, "Fetched today\'s classes successfully",filteredStudents));
            
        } catch (error) {
            // console.error('Error fetching today\'s classes:', error);
            return next(CreateError(500, "Error fetching today\'s classes"));
        }
    },
    upcomingClasses: async (req, res, next) => {
        try {
            const token = req.headers.authorization; // Get the token from the request headers
            const jwtPayload = commonMethods.parseJwt(token); // Assuming you have a method to parse the JWT
            const coordinatorId = jwtPayload.id; // Extract the coordinator ID from the token payload
    
            // Fetch all user course buckets for students assigned to the coordinator
            const userCourseBuckets = await UserCourseBucket.find({ coordinatorId: coordinatorId })
                .populate('userId courseId assignedTutor'); // Populate necessary fields
    
            // Get today's day of the week
            const today = moment().format('ddd'); // e.g., 'Mon', 'Tue', etc.
    
            // Filter upcoming classes based on selectedDays
            const upcomingClasses = userCourseBuckets.filter(bucket => 
                bucket.selectedDays.includes(today) // Check if today is in the selectedDays array
            );
    
            // Return response with upcoming classes
            return next(CreateSuccess(200, "Fetched upcoming classes successfully", upcomingClasses));
        } catch (error) {
            console.error('Error fetching upcoming classes:', error);
            return next(CreateError(500, "Error fetching upcoming classes"));
        }
    },
    approveClass: async (req, res, next) => {
        try {
            const completedClassId = req.params.id; // Extract the completed class ID from the request parameters
    
            // Find the completed class by ID
            const completedClass = await CompletedClassModel.findById(completedClassId);
            
            if (!completedClass) {
                return next(CreateError(404, "Completed class not found"));
            }
    
            // Update the status to 'approved'
            completedClass.status = 'Approved';

            const classDurationInHours = parseInt(completedClass.duration.replace('hr', ''));

            // Save the updated completed class entry to the database
            await completedClass.save();
            // Find and update the user's rechargedHours by reducing the class duration
            await studentModel.findByIdAndUpdate(
                completedClass.studentId,
                { $inc: { rechargedHours: -classDurationInHours } }, // Decrement rechargedHours
                { new: true } // Return the updated user document
            );
    
            return next(CreateSuccess(200, "Class approved successfully"));
        } catch (error) {
            console.error('Error approving class:', error);
            return next(CreateError(500, "Error in approving class"));
        }
    },
    blockStatus:async(req,res,next)=>{
        try {
            const token = req.headers.authorization.split(" ")[1];
            if (!token) {
                return next(CreateError(401,"Token not present"))
            }
            // Parse the JWT token
            const jwtPayload = commonMethods.parseJwt(token);
            const coordinatorId = jwtPayload.id;
            // Fetch the coordinator from the database
            const coordinator = await coordinatorModel.findById(coordinatorId).exec();
            //  //console.log(coordinator);
            if (!coordinator) {
                return res.status(404).json({ blocked: true }); 
            }
    
            // Send the block status in the response
            res.status(200).json({ blocked: coordinator.isBlocked });
        } catch (error) {
            // console.error('Block status error:', error);
            next(CreateError(500, 'Error retrieving block status'));
        }
    },
    getUsersList: async (req, res, next) => {
        try {
            const token = req.headers.authorization;
            const jwtPayload = commonMethods.parseJwt(token);
            const coordinatorId = jwtPayload.id; // Assuming the coordinator ID is in the token
    
            // Fetch all users associated with the coordinator
            const users = await studentModel.find({
                coordinator: coordinatorId // Filter by coordinator ID
            });
    
            if (!users.length) {
                return next(CreateSuccess(200, "No users found assigned"));
            }
    
            return next(CreateSuccess(200, "Fetched users successfully", users));
        } catch (error) {
            console.error('Error fetching users:', error);
            return next(CreateError(500, "Error fetching users"));
        }
    },
    fetchBucketCourses: async (req, res, next) => {
      try {

        const studentId = req.params.userId;
          // Fetch the user's bucket entries
          const bucketEntries = await UserCourseBucket.find({ userId: studentId })
              .populate('courseId') // Populate the course details
              .populate('assignedTutor')
              .exec();
  
          // Check if there are any bucket entries
          if (!bucketEntries.length) {
              return next(CreateSuccess(200, "No courses found in the bucket"));
          }

          console.log(bucketEntries);
  
          // Send the bucket entries (with populated course data) to the frontend
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
        const studentId = req.params.studentId; // Get studentId from request parameters
        const { tutor, course, selectedDays, preferredTime, duration } = req.body; // Extract data from request body

        // Check if the course is already added to the student's bucket
        const existingBucketEntry = await UserCourseBucket.findOne({
            userId: studentId,
            courseId: course
        });

        if (existingBucketEntry) {
            return next(CreateError(403, "Course already added to the bucket")); // Conflict status
        }

        // Create a new bucket entry
        const bucketData = new UserCourseBucket({
            userId: studentId, // Set the userId to the student's ID
            courseId: course, // Include courseId
            assignedTutor:tutor,  // Include tutorId
            selectedDays: selectedDays, // Include selectedDays
            preferredTime: preferredTime, // Include preferredTime
            classDuration: duration, // Include classDuration
            coordinatorId:coordinatorId
        });

        // Save the new bucket entry to the database
        await bucketData.save();

        return next(CreateSuccess(201, "Course added to user's bucket successfully", bucketData));
    } catch (error) {
        console.error("Error adding course to user bucket:", error);
        return next(CreateError(500, "Error adding course to user bucket"));
    }
},
updateCourseToUserBucket: async (req, res, next) => {
    try {
        const studentId = req.params.studentId; // Get studentId from request parameters
        const { course, tutor, selectedDays, preferredTime, classDuration } = req.body; // Extract data from request body
        // Find the existing bucket entry
        const bucketEntry = await UserCourseBucket.findOne({
            userId: studentId,
            courseId: course
        });


        console.log(bucketEntry);

        if (!bucketEntry) {
            return next(CreateError(403, "Course not found in the bucket")); // Not found status
        }

        // Update the bucket entry with new data
        bucketEntry.selectedDays = selectedDays || bucketEntry.selectedDays; // Update selectedDays if provided
        bucketEntry.preferredTime = preferredTime || bucketEntry.preferredTime; // Update preferredTime if provided
        bucketEntry.classDuration = classDuration || bucketEntry.classDuration; // Update classDuration if provided

        // Update courseId and assignedTutor if provided
        if (course) {
            bucketEntry.courseId = course; // Update courseId
        }
        if (tutor) {
            bucketEntry.assignedTutor = tutor; // Update assignedTutor
        }

        // Save the updated bucket entry to the database
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

        // Find and remove the course from the user's bucket
        const result = await UserCourseBucket.findOneAndDelete({
            userId: studentId,
            courseId: courseId
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

        // Find the course in the user's bucket
        const bucketEntry = await UserCourseBucket.findOne({
            userId: studentId,
            courseId: courseId
        })
        
        return next(CreateSuccess(200, "Fetched course from user's bucket successfully", bucketEntry));
    } catch (error) {
        console.error("Error fetching course from bucket:", error);
        return next(CreateError(500, "Error fetching course from user's bucket"));
    }
},
uploadCoordinatorProfilePhoto:async(req,res,next)=>{
    try {

        console.log("=============");
        const token = req.headers.authorization;
        const jwtPayload = commonMethods.parseJwt(token);
        const coordinatorId = jwtPayload.id;

        // Find the student by ID
        let coordinator = await coordinatorModel.findById(coordinatorId);
        if (!coordinator) {
            return next(CreateError(404, "Coordinator not found"));
        }

        // Check if a file is uploaded
        if (req.file) {
            const image = req.file.path;
            const result = await cloudinary.uploader.upload(image);
            coordinator.photoUrl = result.secure_url; // Update the photoUrl in the student object
        } else {
            return next(CreateError(400, "No file uploaded"));
        }

        // Save the updated student document
        await coordinator.save();

        return next(CreateSuccess(200, "Profile photo updated successfully", coordinator));
    } catch (error) {
        console.error("Error updating profile photo:", error);
        return next(CreateError(500, "Error updating profile photo"));
    }
},

getCoordinatorData:async(req,res,next)=>{
    try {
        const token = req.headers.authorization;
        const jwtPayload = commonMethods.parseJwt(token);
        const coordinatorId = jwtPayload.id;
        const coordinator = await coordinatorModel.find({ _id:coordinatorId });
        return next(CreateSuccess(200,"User data fetched successfully",coordinator[0]));
    } catch (error) {
        return next(CreateError(500, "Error fetching user data"));
    }
},
editCoordinatorProfileInfo:async(req,res,next)=>{
    try {
        const { username, email , phone, about } = req.body;

        const token = req.headers.authorization;
        const jwtPayload = commonMethods.parseJwt(token);
        const coordinatorId = jwtPayload.id;
        let coordinator = await coordinatorModel.findById(coordinatorId);
    if (!coordinator) {
        return next(CreateError(404, "Coordinator not found"));
    }

    // Update the student's profile data
    coordinator.username = username || coordinator.username; // Update username if provided
    coordinator.email = email || coordinator.email; // Update class if provided
    coordinator.phone = phone || coordinator.phone; // Update phone if provided
    coordinator.about = about || coordinator.about; // Update about if provided

    // Save the updated coordinator document
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
        const coordinatorId = jwtPayload.id; // Assuming the tutor ID is in the token

        // Fetch all user course buckets for the tutor
        const completedClasses = await CompletedClassModel.find({
            coordinatorId: coordinatorId // Filter by tutor ID
        }).populate('studentId') // Optionally populate student details
          .populate('courseId'); // Optionally populate course details
        if (!completedClasses.length) {
            return next(CreateSuccess(200, "No completed classes found for this coordinator"));
        }

        return next(CreateSuccess(200, "Fetched completed classes successfully", completedClasses));
    } catch (error) {
        console.error('Error fetching completed classes:', error);
        return next(CreateError(500, "Error fetching completed classes"));
    }
},
}