const chatController = {
  handleMessage: (socket) => {
    socket.on("message", (data) => {
      socket.broadcast.emit("received", { data: data, message: "This is a test message from server" });
    });
  },

  handleDisconnection: (socket) => {
    socket.on("disconnect", () => {});
  },
};

export default chatController;
