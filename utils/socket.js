const { Server } = require("socket.io");
const chatController = require("../controllers/chatController");
const Chat = require("../models/chatModel");

const onlineUsers = new Map();

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.BASE_URL_CLIENT,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket.io user connectedm - util socket.js");
    socket.emit("Server sended to the client without any request")

    socket.on("joinChat", ({ userId, userType }) => {
      if (userId) {
        socket.join(userId);
        console.log(`${userType} joined chat with ID: ${userId}`);
        onlineUsers.set(userId, socket.id);
        io.emit("onlineUsers", Array.from(onlineUsers.keys()));
      }
    });

    socket.on("sendMessage", async ({ userId,tutorId,senderType, message }) => {
      console.log(userId,tutorId);
      const chatMessage = new Chat({
        userId,
        tutorId,
        senderType,
        message,
      });
      await chatMessage.save();

      if (senderType === "Tutor") {
        console.log("tutor sends message to user: ", userId);
        io.to(userId).emit("messageReceived", {
          userId: chatMessage.userId,
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

    socket.on("joinVideoCall", ({ userId, userType, roomId }) => {
      socket.join(roomId);
      console.log(`User ${userId} joined video call room ${roomId}`);
      socket.to(roomId).emit("userJoined", { userId, userType });
    });

    socket.on("sendVideoMessage", (payload) => {
      console.log("hello inside sendVideoMessage: ", payload);
      const { roomId, ...data } = payload;
      console.log(`check data:`, data);

      console.log("inside sendVideoMessage Socket connection", roomId);
      socket.to(roomId).emit("videoMessage", data);
    });

    socket.on("disconnect", () => {
      console.log("user disconnected");
      onlineUsers.forEach((value, key) => {
        if (value === socket.id) {
          onlineUsers.delete(key);
        }
      });
      io.emit("onlineUsers", Array.from(onlineUsers.keys()));

      console.log("Socket.io user disconnected");
    });

    chatController.handleMessage(socket);
  });
  return io;
};

module.exports = initializeSocket;
