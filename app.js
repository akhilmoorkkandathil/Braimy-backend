/* eslint-disable no-undef */
import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';

import userRouter from './routes/userRoutes.js';
import tutorRouter from './routes/tutorRoutes.js';
import coordinatorRouter from './routes/coordinatorRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import {CreateError}  from './utils/error.js';
import {initializeSocket} from './utils/socket.js';
import dns from 'dns'



import './utils/croneJob.js';
import './utils/pushNotification.js';

const app = express();
dotenv.config();
 function checkInternet(req, res, next) {
    dns.lookup('google.com', (err) => {
        if (err && err.code === "ENOTFOUND") {
             return next(CreateError(503, "No internet connection. Please try again later."));
        } else {
            next();
        }
    });
}
 app.use(checkInternet);
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use(express.static('public'));

const allowedOrigins = [process.env.BASE_URL_CLIENT];
app.use(cors({
    origin: allowedOrigins, // Replace with your frontend domain
    methods: ['GET', 'POST', 'PUT', 'DELETE','PATCH'],
    credentials: true
  }));
 app.use(session({
    secret: process.env.SECRET_KEY, // Replace with a secret key for session encryption
    resave: true,
    saveUninitialized: true,
}));
 app.use((req,res,next)=>{
    res.header('Cache-Control','no-cache,private,no-store,must-revalidate');
    res.header('Expires','0');
    res.header('Pragma','no-cache');
    next();
});
 app.use((req,res,next)=>{
    res.cookie('myCookie', 'Hello, this is my cookie!', { maxAge: 3600000 });
    next();
});
const mongoUri = `mongodb+srv://akhildasxyz:${process.env.MONGO_PASSWORD}@akhil1.ktzty9v.mongodb.net/BraimyDB?retryWrites=true&w=majority&appName=Akhil1`;

function connectMongoDB(){
    mongoose.connect(mongoUri)
.then(()=>{
 })
.catch(()=>{
    app.use((req, res, next) => {
        return next(CreateError(402, "Service Unavailable: Please check your internet connection or try again later."));
    });
})

}


app.use("/api/images",express.static(path.join('backend/images')))

app.use('/api/user', userRouter);
app.use('/api/admin',adminRouter);
app.use('/api/coordinator',coordinatorRouter);
app.use('/api/tutor',tutorRouter)


const server = http.createServer(app);

initializeSocket(server);
 app.use((responseObj,req,res,next)=>{
    const statusCode = responseObj.status || 500;
    const message = responseObj.message || "Something went wrong!";
    res.status(statusCode).json({
        success: [200,204,201].some(a=> a===statusCode)? true : false,
        status: statusCode,
        message: message,
        data: responseObj.data,
        token: responseObj.token
    });
    next()
});

server.listen(8000,()=>{
    connectMongoDB();
});

 