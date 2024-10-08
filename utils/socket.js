import { Server } from "socket.io";
import chatController from "../controllers/chatController.js";
import Chat from "../models/chatModel.js";



export const initializeSocket = (server) => {
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
       }
    });

    socket.on("sendMessage", async (message) => {
      const chatMessage = new Chat({
        userId:message.userId,
        tutorId:message.tutorId,
        senderType:message.senderType,
        message:message.message,
      });
      await chatMessage.save();

      if (message.senderType === "Tutor") {
         io.to(message.userId).emit("messageReceived", {
          tutorId: chatMessage.tutorId,
          senderType: chatMessage.senderType,
          message: chatMessage.message,
          createdAt: chatMessage.createdAt,
        });
      } else {
        io.to(message.tutorId).emit("messageReceived", {
          userId: chatMessage.userId,
          senderType: chatMessage.senderType,
          message: chatMessage.message,
          createdAt: chatMessage.createdAt,
        });
      }
     });
   

  socket.on('offer', (offer) => {
    socket.broadcast.emit('offer', offer);
  });

  socket.on('answer', (answer) => {
    socket.broadcast.emit('answer', answer);
  });

  socket.on('ice-candidate', (candidate) => {
    console.log(candidate);
    socket.broadcast.emit('ice-candidate', candidate);
  });

  socket.on('end-call', () => {
    socket.broadcast.emit('end-call');
  });

  socket.on('disconnect', () => {
     socket.broadcast.emit('end-call');
  });

    chatController.handleMessage(socket);
  });
  return io;
};

