import cron from 'node-cron';
import webpush from 'web-push';
import UserCourseBucket from '../models/userCourseBucketModel.js';
import studentModel from '../models/userModel.js';
 const publicKey = process.env.PUBLIC_KEY;
const privateKey = process.env.PRIVATE_KEY;

webpush.setVapidDetails('mailto:akhildasxyz@gmail.com', publicKey, privateKey);
 async function sendPushNotification(student, className) {
    console.log(student,className);
    const payload = {
        notification: {
            title: "Braimy",
            body: `Your class "${className}" starts in 10 minutes!`,
            vibrate: [100, 50, 100],
            icon: "../assets/favicon.ico",
            data: {
                additionalData: "Class reminder"
            }
        }
    };

    try {
        await webpush.sendNotification(student.subscription, JSON.stringify(payload));
        console.log(`Notification sent to student ${student.username} for class ${className}`);
    } catch (error) {
        console.error(`Failed to send notification to student ${student._id}:`, error);
    }
}
 async function checkAndSendNotifications() {
    const now = new Date();
    const tenMinutesFromNow = new Date(now.getTime() + 10 * 60000);

    try {
         const upcomingClasses = await UserCourseBucket.find({
            selectedDays: { $in: [now.toLocaleString('en-us', {weekday: 'short'})] },
            preferredTime: tenMinutesFromNow.getHours() + ":" + tenMinutesFromNow.getMinutes() + " " + (tenMinutesFromNow.getHours() >= 12 ? "PM" : "AM") // HH:MM AM/PM format
        }).populate('userId courseId');

        console.log("Upcoming classes in notification",upcomingClasses);

        for (const classSchedule of upcomingClasses) {
            const student = await studentModel.findById(classSchedule.userId);
            if (student && student.subscription) {
                const className = classSchedule.courseId.courseName; 
                await sendPushNotification(student, className);
            }
        }
    } catch (error) {
        console.error('Error in checkAndSendNotifications:', error);
    }
}
 cron.schedule('* * * * *', () => {
    console.log('Running notification check...');
    checkAndSendNotifications();
});

console.log('Cron job for class notifications has been scheduled.');