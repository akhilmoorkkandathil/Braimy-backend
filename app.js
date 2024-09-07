/* eslint-disable no-undef */
const express = require('express');
const http = require('http')
const mongoose = require('mongoose');
const path = require('path')
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const userRouter = require('./routes/userRoutes');
const tutorRouter = require('./routes/tutorRoutes');
const coordinatorRouter = require('./routes/coordinatorRoutes');
const adminRouter = require('./routes/adminRoutes');
const {CreateError} = require('../backend/utils/error')
const initializeSocket = require('./utils/socket')

const app = express();
dotenv.config();


const dns = require('dns');

// Middleware to check internet connectivity
function checkInternet(req, res, next) {
    dns.lookup('google.com', (err) => {
        if (err && err.code === "ENOTFOUND") {
            console.log("Entered internet checking - No internet");
            return next(CreateError(503, "No internet connection. Please try again later."));
        } else {
            next();
        }
    });
}

// Apply the middleware globally
app.use(checkInternet);
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use(express.static('public'));

const allowedOrigins = [process.env.BASE_URL_CLIENT,'http://127.0.0.1:8081','http://10.20.4.220:8081'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));




// Initialize and use the session middleware
app.use(session({
    secret: process.env.SECRET_KEY, // Replace with a secret key for session encryption
    resave: true,
    saveUninitialized: true,
}));

// Prevent caching
app.use((req,res,next)=>{
    res.header('Cache-Control','no-cache,private,no-store,must-revalidate');
    res.header('Expires','0');
    res.header('Pragma','no-cache');
    next();
});

// Setup Cookie middleware
app.use((req,res,next)=>{
    res.cookie('myCookie', 'Hello, this is my cookie!', { maxAge: 3600000 });
    next();
});
const mongoUri = `mongodb+srv://akhildasxyz:${process.env.MONGO_PASSWORD}@akhil1.ktzty9v.mongodb.net/BraimyDB?retryWrites=true&w=majority&appName=Akhil1`;

function connectMongoDB(){
    mongoose.connect(mongoUri)
.then(()=>{
     console.log("Connected to Database!");
})
.catch((error)=>{
    app.use((req, res, next) => {
        return next(createError(402, "Service Unavailable: Please check your internet connection or try again later."));
    });
})

}


app.use("/images",express.static(path.join('backend/images')))

app.use('/user', userRouter);
app.use('/admin',adminRouter);
app.use('/coordinator',coordinatorRouter);
app.use('/tutor',tutorRouter)


// const io = new Server(server, {
//     cors: {
//         origin: process.env.BASE_URL_CLIENT,
//         methods: ["GET", "POST"],
//         credentials: true
//     }
// });

// io.on('connection', (socket)=>{
//     //console.log('socket io connected');
//     socket.on('message', (data)=> {
//         ////console.log(data);
//         socket.broadcast.emit('received', {data: data, message: 'This is a test message from server'})
//     })
// })
// initializeSocket(server);

// const io = new Server(server, {
//     cors: {
//         origin: process.env.BASE_URL_CLIENT,
//         methods: ["GET", "POST"],
//         credentials: true
//     }
// }); 

//  io.on('connection', (socket)=>{
//     //console.log('socket io connected');
//     socket.on('message', (data)=> {
//         //console.log(data);
//         socket.broadcast.emit('received', {data: data, message: 'This is a test message from server'})
//     })
// }) 



// //Response Handler middleware
// app.use((responseObj,req,res)=>{
//   console.log("Helloooo......");
//   console.log(responseObj);
//     const statusCode = responseObj.status || 500;
//     const message = responseObj.message || "Something went wrong!";
//     return res.status(statusCode).json({
//         success: [200,204,201].some(a=> a===statusCode)? true : false,
//         status: statusCode,
//         message: message,
//         data: responseObj.data,
//         token: responseObj.token
//     });
// });

const server = http.createServer(app);

const io = initializeSocket(server);

//Response Handler middleware
app.use((responseObj,req,res,next)=>{
    const statusCode = responseObj.status || 500;
    const message = responseObj.message || "Something went wrong!";
    return res.status(statusCode).json({
        success: [200,204,201].some(a=> a===statusCode)? true : false,
        status: statusCode,
        message: message,
        data: responseObj.data,
        token: responseObj.token
    });
});

server.listen(8000, ()=>{
    connectMongoDB();
    // console.log('Connected to backend');
});

