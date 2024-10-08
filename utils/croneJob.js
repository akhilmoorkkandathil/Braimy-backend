import cron from 'node-cron';
import nodemailer from 'nodemailer';
import UserCourseBucket from '../models/userCourseBucketModel.js';
import dotenv from 'dotenv';



dotenv.config();
 const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASSWORD, 
    },
});
 async function sendEmailsForClasses() {
    const currentDay = new Date().toLocaleString('en-US', { weekday: 'short' }); 

    try {
        const usersWithClasses = await UserCourseBucket.find({
            selectedDays: currentDay
        }).populate('userId courseId assignedTutor coordinatorId');
         usersWithClasses.forEach(async (bucket) => {
            const { userId, courseId, preferredTime,assignedTutor, classDuration } = bucket;
        
            if(assignedTutor){
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
                     await transporter.sendMail(mailOptions);
                    console.log(`Email sent to ${userId.email}`);
                } catch (error) {
                    console.error(`Failed to send email to ${userId.email}:`, error);
                }
            }
        });
    } catch (error) {
        console.error('Error sending emails:', error);
    }
}
 cron.schedule('50 15 * * *', () => { 
    console.log('Running daily cron job at 1:25 PM');
    sendEmailsForClasses();
}, {
    timezone: 'Asia/Kolkata' 
});

