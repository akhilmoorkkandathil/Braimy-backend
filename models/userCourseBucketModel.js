import mongoose from "mongoose";
const { Schema } = mongoose;
 const userCourseBucketSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true 
    },
    courseId: {
        type: Schema.Types.ObjectId,
        ref: 'Course', 
        required: true 
    },
    assignedTutor: {
        type: Schema.Types.ObjectId,
        ref: 'Tutor', 
        required: false 
    },
    coordinatorId: {
        type: Schema.Types.ObjectId,
        ref: 'Coordinator', 
        required: false 
    },
    selectedDays: {
        type: [String], 
        required: true 
    },
    preferredTime: {
        type: String, 
        required: true 
    },
    classDuration: {
        type: String, 
        required: true 
    },
    createdAt: {
        type: Date,
        default: Date.now 
    }
});
 const UserCourseBucket = mongoose.model('UserCourseBucket', userCourseBucketSchema);

export default UserCourseBucket;
