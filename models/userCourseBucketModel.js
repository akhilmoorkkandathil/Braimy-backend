const mongoose = require("mongoose");
const { Schema } = mongoose;

// Define the schema for storing user course schedules
const userCourseBucketSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true // Ensure this field is required
    },
    courseId: {
        type: Schema.Types.ObjectId,
        ref: 'Course', // Reference to the Course collection/model
        required: true // Ensure this field is required
    },
    assignedTutor: {
        type: Schema.Types.ObjectId,
        ref: 'Tutor', // Reference to the Tutor collection/model
        required: false // Optional: Tutor assignment can be added later
    },
    coordinatorId: {
        type: Schema.Types.ObjectId,
        ref: 'Coordinator', // Reference to the Tutor collection/model
        required: false // Optional: Tutor assignment can be added later
    },
    selectedDays: {
        type: [String], // Array of strings to store selected days (e.g., 'Monday', 'Wednesday')
        required: true // Ensure that at least one day is selected
    },
    preferredTime: {
        type: String, // Time as a string (e.g., '10:00 AM')
        required: true // Ensure this field is required
    },
    classDuration: {
        type: String, // Duration as a string (e.g., '1 hour')
        required: true // Ensure this field is required
    },
    createdAt: {
        type: Date,
        default: Date.now // Automatically set creation date
    }
});

// Create the Mongoose model
const UserCourseBucket = mongoose.model('UserCourseBucket', userCourseBucketSchema);

module.exports = UserCourseBucket;
