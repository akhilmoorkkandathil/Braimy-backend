const mongoose = require("mongoose");
const { Schema } = mongoose;

// Define the schema for storing completed classes
const completedClassSchema = new Schema({
    studentId: {
        type: Schema.Types.ObjectId,
        ref: 'User', // Reference to the User collection/model
        required: true
    },
    tutorId: {
        type: Schema.Types.ObjectId,
        ref: 'Tutor', // Reference to the Tutor collection/model
        required: true
    },
    courseId: {
        type: Schema.Types.ObjectId,
        ref: 'Course', // Reference to the Course collection/model
        required: true
    },
    coordinatorId: {
        type: Schema.Types.ObjectId,
        ref: 'Coordinator', // Reference to the Course collection/model
        required: true
    },
    duration: {
        type: String, // Duration as a string (e.g., '1 hour')
        required: true
    },
    date: {
        type: Date,
        default: Date.now // Automatically set the date when marked completed
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved'], // Only allow 'pending' or 'approved'
        default: 'Pending' // Default status
    }
});

// Create the Mongoose model
const CompletedClass = mongoose.model('CompletedClass', completedClassSchema);

module.exports = CompletedClass;