const { Server } = require("socket.io");
const chatController = require("../controllers/chatController");
const Chat = require("../models/chatModel");


const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.BASE_URL_CLIENT,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.on("joinChat", ({ userId, userType }) => {
      if (userId) {
        socket.join(userId);
         //console.log(`${userType} joined chat with ID: ${userId}`);
      }
    });

    socket.on("sendMessage", async ({ userId,tutorId,senderType, message }) => {
      const chatMessage = new Chat({
        userId,
        tutorId,
        senderType,
        message,
      });
      await chatMessage.save();

      if (senderType === "Tutor") {
         //console.log("tutor sends message to user: ", userId);
        io.to(userId).emit("messageReceived", {
          tutorId: chatMessage.tutorId,
          senderType: chatMessage.senderType,
          message: chatMessage.message,
          createdAt: chatMessage.createdAt,
        });
      } else {
        io.to(tutorId).emit("messageReceived", {
          userId: chatMessage.userId,
          senderType: chatMessage.senderType,
          message: chatMessage.message,
          createdAt: chatMessage.createdAt,
        });
      }
      io.emit("lastMessage", { userId, tutorId, message, createdAt: chatMessage.createdAt });
    });

     //console.log('A user connected');

  

  socket.on('offer', (offer) => {
    socket.broadcast.emit('offer', offer);
  });

  socket.on('answer', (answer) => {
    socket.broadcast.emit('answer', answer);
  });

  socket.on('ice-candidate', (candidate) => {
    socket.broadcast.emit('ice-candidate', candidate);
  });

  socket.on('end-call', () => {
    socket.broadcast.emit('end-call');
  });

  socket.on('disconnect', () => {
     //console.log('A user disconnected');
    socket.broadcast.emit('end-call');
  });

    chatController.handleMessage(socket);
  });
  return io;
};

module.exports = initializeSocket;
