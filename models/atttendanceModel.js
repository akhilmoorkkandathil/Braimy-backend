import mongoose from "mongoose";
const { Schema } = mongoose;
 const completedClassSchema = new Schema({
    studentId: {
        type: Schema.Types.ObjectId,
        ref: 'User', 
        required: true
    },
    tutorId: {
        type: Schema.Types.ObjectId,
        ref: 'Tutor', 
        required: true
    },
    courseId: {
        type: Schema.Types.ObjectId,
        ref: 'Course', 
        required: true
    },
    coordinatorId: {
        type: Schema.Types.ObjectId,
        ref: 'Coordinator', 
        required: true
    },
    duration: {
        type: String, 
        required: true
    },
    date: {
        type: Date,
        default: Date.now 
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved'], 
        default: 'Pending' 
    }
});
 const CompletedClassModel = mongoose.model('CompletedClass', completedClassSchema);

export default CompletedClassModel;