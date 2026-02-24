const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("./models/User");

let ioInstance = null;

function initSocket(httpServer) {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  ioInstance.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error("Authentication token missing"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return next(new Error("Invalid token"));
      }

      socket.user = user;
      return next();
    } catch (err) {
      return next(new Error("Socket authentication failed"));
    }
  });

  ioInstance.on("connection", async (socket) => {
    try {
      socket.join(`user:${socket.user._id.toString()}`);
    } catch (err) {
      console.error("Socket room setup error:", err.message);
    }
  });

  return ioInstance;
}

function getIO() {
  if (!ioInstance) {
    throw new Error("Socket.io has not been initialized");
  }
  return ioInstance;
}

module.exports = { initSocket, getIO };
