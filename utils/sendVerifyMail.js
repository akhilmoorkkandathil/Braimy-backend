import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import {generateOTP} from '../utils/otpGenerator.js';

dotenv.config();

const emailUser = process.env.EMAIL_USER;
const emailPassword = process.env.EMAIL_PASSWORD;

const sendVerifyMail = async (name,email)=>{
    try
    {    
        const otp = generateOTP()+'';
         let message = `<p>Dear ${name},</p>
        <p>${otp} is your one time password (OTP). Please do not share the OTP with others.</p>
        <p>Regards,</p>
        <p>Team Braimy</p>`;
        const transporter = nodemailer.createTransport({
            host:'smtp.gmail.com',
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user: emailUser,
                pass: emailPassword
            }
        });
        const mailOptions = {
            from: {
                name: 'Braimy',
                address: emailUser,
            },
            to: email,
            subject:'For Email Verification',
            html: message
         }
        transporter.sendMail(mailOptions,(error,info)=>{
            if(error)
            {
             }
            else
            {
             }
        })
         return otp;
    }
    catch(err)
    {
     }
};

export default sendVerifyMail;