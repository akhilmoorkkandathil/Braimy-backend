const cron = require('node-cron');
const nodemailer = require('nodemailer');
const UserCourseBucket = require('../models/userCourseBucketModel');
const dotenv = require('dotenv');


dotenv.config();

// Create a mail transporter (using Gmail for example)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Replace with your email
        pass: process.env.EMAIL_PASSWORD, // Replace with your password or app-specific password
    },
});

// Function to send emails
async function sendEmailsForClasses() {
    const currentDay = new Date().toLocaleString('en-US', { weekday: 'short' }); // Get current day of the week (e.g., 'Monday')

    try {
        const usersWithClasses = await UserCourseBucket.find({
            selectedDays: currentDay
        }).populate('userId courseId assignedTutor coordinatorId');

        // Fetch users who have classes on the current day
        usersWithClasses.forEach(async (bucket) => {
            const { userId, courseId, preferredTime,assignedTutor, classDuration } = bucket;
        
            const mailOptions = {
                from: 'your-email@gmail.com',
                to: userId.email,
                subject: `Reminder: Your class is scheduled for today`,
                text: `Dear ${userId.username},
        
        You have a ${courseId.courseName} class scheduled today at ${preferredTime} for a duration of ${classDuration}. 
        Your class will be taken by ${assignedTutor.username}.
        
        Please be ready!
        
        Best regards,
        Braimy.`,
            };
        
            try {
                // Send the email
                await transporter.sendMail(mailOptions);
                console.log(`Email sent to ${userId.email}`);
            } catch (error) {
                console.error(`Failed to send email to ${userId.email}:`, error);
            }
        });
    } catch (error) {
        console.error('Error sending emails:', error);
    }
}

// Schedule the job to run at 7 AM every day
cron.schedule('50 15 * * *', () => { // 25 minutes past 1 PM
    console.log('Running daily cron job at 1:25 PM');
    sendEmailsForClasses();
}, {
    timezone: 'Asia/Kolkata' // Set to your local time zone if needed
});

